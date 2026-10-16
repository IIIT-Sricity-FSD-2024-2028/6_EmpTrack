import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CompanyRegistrationService } from './company-registration.service';
import {
  ApproveRegistrationDto,
  CompanyDetailsDto,
  ListRegistrationsQuery,
  RejectRegistrationDto,
  SubmitRegistrationDto,
} from './dto/company-registration.dto';

const TOKEN_HEADER = 'x-registration-token';

// Applicant endpoints. Applicants have no login yet, so these are @Public() and
// authorised per registration by the access token returned from POST (sent back in
// the X-Registration-Token header). Nothing here can change a registration's status
// beyond draft/rejected -> approved with an active Company Admin account.
@ApiTags('Company Registration')
@ApiHeader({ name: TOKEN_HEADER, required: false, description: 'Access token returned when the registration was started' })
@Public()
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('company-registrations')
export class CompanyRegistrationController {
  constructor(private readonly service: CompanyRegistrationService) {}

  @ApiOperation({ summary: 'Start a company registration (step 1: company details). Returns a reference and a one-time access token.' })
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@Body() dto: CompanyDetailsDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Registration status, documents and rejection reason (applicant view)' })
  @Get(':reference')
  get(@Param('reference') reference: string, @Headers(TOKEN_HEADER) token: string) {
    return this.service.get(reference, token);
  }

  @ApiOperation({ summary: 'Update company details while drafting or after a rejection' })
  @Patch(':reference')
  update(@Param('reference') reference: string, @Headers(TOKEN_HEADER) token: string, @Body() dto: CompanyDetailsDto) {
    return this.service.update(reference, token, dto);
  }

  @ApiOperation({ summary: 'Upload or replace a verification document (incorporation, gst, other, logo). PDF/JPG/PNG.' })
  @Post(':reference/documents/:docType')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  upload(
    @Param('reference') reference: string,
    @Param('docType') docType: string,
    @Headers(TOKEN_HEADER) token: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadDocument(reference, token, docType, file);
  }

  @ApiOperation({ summary: 'Step 3: submit details and activate the Company Admin account' })
  @Post(':reference/submit')
  @HttpCode(HttpStatus.OK)
  submit(@Param('reference') reference: string, @Headers(TOKEN_HEADER) token: string, @Body() dto: SubmitRegistrationDto) {
    return this.service.submit(reference, token, dto);
  }
}

// Reviewer endpoints - Super Admin only. A company can never reach these with its
// registration token: they require a logged-in SUPER_ADMIN session (AuthGuard + RolesGuard).
@ApiTags('Company Registration Review')
@Controller('registration-reviews')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class RegistrationReviewController {
  constructor(private readonly service: CompanyRegistrationService) {}

  private actor(id: string, name: string, role: string) {
    return { emp_id: id, emp_name: name, role };
  }

  @Get()
  list(@Query() query: ListRegistrationsQuery) {
    return this.service.list(query.status);
  }

  @Get(':reference')
  get(@Param('reference') reference: string) {
    return this.service.getForReview(reference);
  }

  @ApiOperation({ summary: 'Stream a submitted verification document to the reviewer' })
  @Get(':reference/documents/:docType')
  document(@Param('reference') reference: string, @Param('docType') docType: string, @Res() res: Response) {
    const { filePath, mimeType, originalName } = this.service.documentForReview(reference, docType);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${originalName.replace(/[^\w.\- ]/g, '_')}"`);
    return res.sendFile(filePath);
  }

  @Post(':reference/start-review')
  @HttpCode(HttpStatus.OK)
  startReview(@Param('reference') reference: string, @Headers('x-actor-id') id: string, @Headers('x-actor-name') name: string, @Headers('role') role: string) {
    return this.service.startReview(reference, this.actor(id, name, role));
  }

  @Post(':reference/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('reference') reference: string,
    @Body() dto: ApproveRegistrationDto,
    @Headers('x-actor-id') id: string,
    @Headers('x-actor-name') name: string,
    @Headers('role') role: string,
  ) {
    return this.service.approve(reference, dto, this.actor(id, name, role));
  }

  @Post(':reference/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('reference') reference: string,
    @Body() dto: RejectRegistrationDto,
    @Headers('x-actor-id') id: string,
    @Headers('x-actor-name') name: string,
    @Headers('role') role: string,
  ) {
    return this.service.reject(reference, dto, this.actor(id, name, role));
  }
}
