import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { GLOBAL_MAX_FILE_SIZE_BYTES, isUploadCategory, SAFE_STORED_FILENAME, UploadCategory } from './upload.constants';

// No RolesGuard here - every EmpTrack role may legitimately upload something (a
// profile photo, a ticket attachment, a document), so the check that matters is
// "is this a request from an identified actor" (the x-actor-id header, this app's
// existing stand-in for an authenticated identity - see EmployeeService/CompanyService)
// rather than a specific role.
@ApiTags('File Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private requireActor(actorId: string, role: string) {
    if (!actorId) throw new UnauthorizedException('Missing actor identity.');
    return { emp_id: actorId, role };
  }

  private assertCategory(category: string): UploadCategory {
    if (!isUploadCategory(category)) {
      throw new BadRequestException(`Unsupported upload category: ${category}`);
    }
    return category;
  }

  @ApiOperation({ summary: 'Upload a file into a specific EmpTrack area (profile-image, employee-document, company-document, support-attachment, technical-attachment, recruitment-document)' })
  @Post(':category')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: GLOBAL_MAX_FILE_SIZE_BYTES },
    }),
  )
  uploadFile(
    @Param('category') categoryParam: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-actor-id') actorId: string,
    @Headers('role') role: string,
  ) {
    const category = this.assertCategory(categoryParam);
    const actor = this.requireActor(actorId, role);
    return this.uploadService.saveFile(category, file, actor);
  }

  @ApiOperation({ summary: 'Download a previously uploaded file by its generated id' })
  @Get(':category/:filename')
  downloadFile(
    @Param('category') categoryParam: string,
    @Param('filename') filename: string,
    @Headers('x-actor-id') actorId: string,
    @Res() res: Response,
  ) {
    const category = this.assertCategory(categoryParam);
    this.requireActor(actorId, undefined as any);

    if (!SAFE_STORED_FILENAME.test(filename)) {
      throw new BadRequestException('Invalid file identifier.');
    }

    const filePath = this.uploadService.resolveSafeFilePath(category, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found.');
    }

    return res.sendFile(filePath);
  }
}
