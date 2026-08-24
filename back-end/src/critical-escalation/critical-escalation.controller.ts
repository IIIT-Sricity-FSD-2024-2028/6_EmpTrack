import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { CriticalEscalationService } from './critical-escalation.service';
import {
  CreateCriticalEscalationDto,
  AssignEscalationDto,
  UpdatePriorityDto,
  ResolveEscalationDto,
  EscalateDto,
  AddCommentDto,
} from './dto/critical-escalation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Critical Escalations')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('critical-escalations')
@UseGuards(RolesGuard)
export class CriticalEscalationController {
  constructor(private readonly service: CriticalEscalationService) {}

  private actor(role: string, actorId: string, actorName: string) {
    return { emp_id: actorId || 'SA001', emp_name: actorName || 'Super Admin', role: role || 'SUPER_ADMIN' };
  }

  @ApiOperation({ summary: 'List critical escalations (Super Admin)' })
  @Get()
  @Roles('SUPER_ADMIN')
  getAll(@Query('status') status?: string, @Query('priority') priority?: string, @Query('companyId') companyId?: string) {
    return this.service.getAll(status, priority, companyId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @ApiOperation({ summary: 'Raise a critical escalation - Super Admin, Platform Admin, or Company Admin' })
  @Post()
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPANY_ADMIN')
  create(
    @Body() dto: CreateCriticalEscalationDto,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.create(dto, this.actor(role, actorId, actorName));
  }

  @Patch(':id/assign')
  @Roles('SUPER_ADMIN')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignEscalationDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.assign(id, dto, this.actor('SUPER_ADMIN', actorId, actorName));
  }

  @Patch(':id/priority')
  @Roles('SUPER_ADMIN')
  updatePriority(
    @Param('id') id: string,
    @Body() dto: UpdatePriorityDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.updatePriority(id, dto, this.actor('SUPER_ADMIN', actorId, actorName));
  }

  @Patch(':id/resolve')
  @Roles('SUPER_ADMIN')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveEscalationDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.resolve(id, dto, this.actor('SUPER_ADMIN', actorId, actorName));
  }

  @Patch(':id/escalate')
  @Roles('SUPER_ADMIN')
  escalate(
    @Param('id') id: string,
    @Body() dto: EscalateDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.escalate(id, dto, this.actor('SUPER_ADMIN', actorId, actorName));
  }

  @Post(':id/comments')
  @Roles('SUPER_ADMIN')
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.addComment(id, dto, this.actor('SUPER_ADMIN', actorId, actorName));
  }
}
