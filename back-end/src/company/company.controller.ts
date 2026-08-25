import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanyStatusDto, ReassignPlatformAdminDto, CreateCompanyAdminDto, UpdateCompanyAdminDto, UpdateCompanyAdminStatusDto } from './dto/company.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Companies')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('companies')
@UseGuards(RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  private actor(actorId: string, actorName: string, role: string) {
    return { emp_id: actorId || 'SA001', emp_name: actorName || 'Super Admin', role: role || 'SUPER_ADMIN' };
  }

  @ApiOperation({ summary: 'List companies - Super Admin sees all (optionally filtered by platformAdminId), Platform Admin is always scoped to their own companies' })
  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  getAllCompanies(
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Query('platformAdminId') platformAdminId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.companyService.getAllCompanies(resolvePlatformAdminScope(role, actorId, platformAdminId), status, search);
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

  @ApiOperation({ summary: 'List Company Admins for a company - Platform Admin must manage that company' })
  @Get(':id/admins')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  getCompanyAdmins(
    @Param('id') id: string,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.getCompanyAdmins(id, this.actor(actorId, actorName, role));
  }

  @ApiOperation({ summary: 'Platform Admin creates a Company Admin for one of their assigned companies' })
  @Post(':id/admins')
  @Roles('PLATFORM_ADMIN')
  createCompanyAdmin(
    @Param('id') id: string,
    @Body() dto: CreateCompanyAdminDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.createCompanyAdmin(id, dto, this.actor(actorId, actorName, role));
  }

  @Patch(':id/admins/:adminId')
  @Roles('PLATFORM_ADMIN')
  updateCompanyAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @Body() dto: UpdateCompanyAdminDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.updateCompanyAdmin(id, adminId, dto, this.actor(actorId, actorName, role));
  }

  @ApiOperation({ summary: 'Activate or deactivate a Company Admin' })
  @Patch(':id/admins/:adminId/status')
  @Roles('PLATFORM_ADMIN')
  updateCompanyAdminStatus(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @Body() dto: UpdateCompanyAdminStatusDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.companyService.updateCompanyAdminStatus(id, adminId, dto, this.actor(actorId, actorName, role));
  }
}
