import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanyStatusDto, ReassignPlatformAdminDto } from './dto/company.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Companies')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('companies')
@UseGuards(RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  private actor(actorId: string, actorName: string, role: string) {
    return { emp_id: actorId || 'SA001', emp_name: actorName || 'Super Admin', role: role || 'SUPER_ADMIN' };
  }

  @ApiOperation({ summary: 'List companies - Super Admin sees all, Platform Admin can filter to their own via platformAdminId' })
  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  getAllCompanies(
    @Query('platformAdminId') platformAdminId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.companyService.getAllCompanies(platformAdminId, status, search);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  getCompanyById(@Param('id') id: string) {
    return this.companyService.getCompanyById(id);
  }

  @ApiOperation({ summary: 'Create and onboard a new company, inviting its Company Admin and assigning a Platform Admin' })
  @Post()
  @Roles('SUPER_ADMIN')
  createCompany(
    @Body() dto: CreateCompanyDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.createCompany(dto, this.actor(actorId, actorName, role));
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(id, dto);
  }

  @ApiOperation({ summary: 'Activate, deactivate, or suspend a company' })
  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.updateStatus(id, dto, this.actor(actorId, actorName, role));
  }

  @ApiOperation({ summary: 'Reassign the Platform Admin managing this company' })
  @Patch(':id/reassign')
  @Roles('SUPER_ADMIN')
  reassignPlatformAdmin(
    @Param('id') id: string,
    @Body() dto: ReassignPlatformAdminDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.reassignPlatformAdmin(id, dto, this.actor(actorId, actorName, role));
  }
}
