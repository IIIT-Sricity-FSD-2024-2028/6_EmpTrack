import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PlatformTicketService } from './platform-ticket.service';
import {
  AssignTicketDto,
  ReassignTicketDto,
  ResolveTicketDto,
  EscalateTicketDto,
  AddTicketCommentDto,
  VerifyResolutionDto,
  RejectResolutionDto,
} from './dto/platform-ticket.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Platform Admin: Technical Issues')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('technical-issues')
@UseGuards(RolesGuard)
@Roles('PLATFORM_ADMIN')
export class TechnicalIssueController {
  constructor(private readonly service: PlatformTicketService) {}

  private actor(actorId: string, actorName: string) {
    return { emp_id: actorId, emp_name: actorName || 'Platform Admin', role: 'PLATFORM_ADMIN' };
  }

  @Get()
  getAll(
    @Headers('x-actor-id') actorId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('companyId') companyId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.service.getAll('TECHNICAL', resolvePlatformAdminScope('PLATFORM_ADMIN', actorId), status, priority, companyId, assignedTo);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.service.getById('TECHNICAL', id, resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.assign('TECHNICAL', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @Patch(':id/reassign')
  reassign(@Param('id') id: string, @Body() dto: ReassignTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.reassign('TECHNICAL', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.resolve('TECHNICAL', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @ApiOperation({ summary: 'Escalate a technical issue to the Super Admin' })
  @Patch(':id/escalate')
  escalate(@Param('id') id: string, @Body() dto: EscalateTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.escalate('TECHNICAL', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: AddTicketCommentDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.addComment('TECHNICAL', id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @ApiOperation({ summary: 'Sign off on work a Technical Member sent back for verification, closing the issue' })
  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyResolutionDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.verifyResolution(id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }

  @ApiOperation({ summary: 'Return a verification request to the Technical Member for rework' })
  @Patch(':id/reject-verification')
  rejectVerification(@Param('id') id: string, @Body() dto: RejectResolutionDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.service.rejectResolution(id, dto, this.actor(actorId, actorName), resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }
}
