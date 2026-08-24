import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformAdminService } from './platform-admin.service';
import { CreatePlatformAdminDto, UpdatePlatformAdminDto, UpdatePlatformAdminStatusDto } from './dto/platform-admin.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Platform Admins')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('platform-admins')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  private actor(actorId: string, actorName: string) {
    return { emp_id: actorId || 'SA001', emp_name: actorName || 'Super Admin', role: 'SUPER_ADMIN' };
  }

  @Get()
  getAllPlatformAdmins(@Query('status') status?: string, @Query('search') search?: string) {
    return this.platformAdminService.getAllPlatformAdmins(status, search);
  }

  @ApiOperation({ summary: "Count of active Platform Admins - gates the 'Create Company' flow" })
  @Get('active-count')
  getActiveCount() {
    return { count: this.platformAdminService.getActiveCount() };
  }

  @Get(':id')
  getPlatformAdminById(@Param('id') id: string) {
    return this.platformAdminService.getPlatformAdminById(id);
  }

  @Get(':id/companies')
  getAssignedCompanies(@Param('id') id: string) {
    return this.platformAdminService.getAssignedCompanies(id);
  }

  @Get(':id/activity')
  getActivity(@Param('id') id: string) {
    return this.platformAdminService.getActivity(id);
  }

  @Post()
  createPlatformAdmin(
    @Body() dto: CreatePlatformAdminDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.platformAdminService.createPlatformAdmin(dto, this.actor(actorId, actorName));
  }

  @Patch(':id')
  updatePlatformAdmin(@Param('id') id: string, @Body() dto: UpdatePlatformAdminDto) {
    return this.platformAdminService.updatePlatformAdmin(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformAdminStatusDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.platformAdminService.updateStatus(id, dto, this.actor(actorId, actorName));
  }
}
