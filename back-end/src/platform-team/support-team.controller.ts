import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformTeamService } from './platform-team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, UpdateTeamMemberStatusDto } from './dto/platform-team.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Platform Admin: Support Team')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('support-team')
@UseGuards(RolesGuard)
@Roles('PLATFORM_ADMIN')
export class SupportTeamController {
  constructor(private readonly service: PlatformTeamService) {}

  private actor(actorId: string, actorName: string) {
    return { emp_id: actorId, emp_name: actorName || 'Platform Admin', role: 'PLATFORM_ADMIN' };
  }

  @Get()
  getAll(@Headers('x-actor-id') actorId: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.service.getAll('SUPPORT_TEAM', resolvePlatformAdminScope('PLATFORM_ADMIN', actorId), status, search);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.service.getById('SUPPORT_TEAM', id, resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @ApiOperation({ summary: 'Add a Support Team member' })
  @Post()
  create(@Body() dto: CreateTeamMemberDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.create('SUPPORT_TEAM', dto, this.actor(actorId, actorName));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto, @Headers('x-actor-id') actorId: string) {
    return this.service.update('SUPPORT_TEAM', id, dto, resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberStatusDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.updateStatus('SUPPORT_TEAM', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }
}
