import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { SupportMemberService } from './support-member.service';
import { PlatformTicketService } from '../platform-ticket/platform-ticket.service';
import {
  AssignTicketDto,
  ResolveTicketDto,
  AddTicketCommentDto,
  ChangeTicketStatusDto,
  ChangeTicketPriorityDto,
  ChangeTicketCategoryDto,
  AddInternalNoteDto,
  ReopenTicketDto,
  EscalateToTechnicalDto,
  EscalateToPlatformAdminDto,
} from '../platform-ticket/dto/platform-ticket.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Support Member: Support Dashboard')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('support-member')
@UseGuards(RolesGuard)
@Roles('SUPPORT_MEMBER')
export class SupportMemberController {
  constructor(
    private readonly supportMemberService: SupportMemberService,
    private readonly ticketService: PlatformTicketService,
  ) {}

  private actor(actorId: string, actorName: string) {
    return { emp_id: actorId, emp_name: actorName || 'Support Member', role: 'SUPPORT_MEMBER' };
  }

  private scope(actorId: string) {
    return this.supportMemberService.resolveScope(actorId).platformAdminId;
  }

  @ApiOperation({ summary: 'Dashboard summary cards and lightweight analytics' })
  @Get('stats')
  getStats(@Headers('x-actor-id') actorId: string) {
    return this.ticketService.getStats(this.scope(actorId), actorId);
  }

  @Get('categories')
  getCategories() {
    return this.supportMemberService.getCategories();
  }

  @ApiOperation({ summary: 'List support tickets visible to this Support Member (scoped to their Platform Admin)' })
  @Get('tickets')
  getTickets(
    @Headers('x-actor-id') actorId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('companyId') companyId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('escalatedOnly') escalatedOnly?: string,
  ) {
    const resolvedAssignedTo = assignedTo === 'me' ? actorId : assignedTo;
    return this.ticketService.getAll('SUPPORT', this.scope(actorId), status, priority, companyId, resolvedAssignedTo, category, search, escalatedOnly === 'true');
  }

  @Get('tickets/:id')
  getTicketById(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.ticketService.getById('SUPPORT', id, this.scope(actorId));
  }

  @ApiOperation({ summary: 'Claim an unassigned ticket for yourself' })
  @Patch('tickets/:id/claim')
  claim(@Param('id') id: string, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.claim('SUPPORT', id, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/status')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeTicketStatusDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.changeStatus('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/priority')
  changePriority(@Param('id') id: string, @Body() dto: ChangeTicketPriorityDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.changePriority('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/category')
  changeCategory(@Param('id') id: string, @Body() dto: ChangeTicketCategoryDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.changeCategory('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.resolve('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/reopen')
  reopen(@Param('id') id: string, @Body() dto: ReopenTicketDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.reopen('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @Patch('tickets/:id/close')
  close(@Param('id') id: string, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.close('SUPPORT', id, this.actor(actorId, actorName), this.scope(actorId));
  }

  @ApiOperation({ summary: 'Send a message to the Company Admin (customer-facing conversation)' })
  @Post('tickets/:id/comments')
  addComment(@Param('id') id: string, @Body() dto: AddTicketCommentDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.addComment('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @ApiOperation({ summary: 'Internal notes - never visible to the Company Admin' })
  @Get('tickets/:id/internal-notes')
  getInternalNotes(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.ticketService.getInternalNotes('SUPPORT', id, this.scope(actorId));
  }

  @Post('tickets/:id/internal-notes')
  addInternalNote(@Param('id') id: string, @Body() dto: AddInternalNoteDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.addInternalNote('SUPPORT', id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @ApiOperation({ summary: 'Escalate a technical problem to the Technical Team' })
  @Patch('tickets/:id/escalate-technical')
  escalateToTechnical(@Param('id') id: string, @Body() dto: EscalateToTechnicalDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.escalateToTechnical(id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @ApiOperation({ summary: 'Escalate an administrative/company-level issue to the Platform Admin' })
  @Patch('tickets/:id/escalate-platform-admin')
  escalateToPlatformAdmin(@Param('id') id: string, @Body() dto: EscalateToPlatformAdminDto, @Headers('x-actor-id') actorId: string, @Headers('x-actor-name') actorName: string) {
    return this.ticketService.escalateToPlatformAdmin(id, dto, this.actor(actorId, actorName), this.scope(actorId));
  }

  @ApiOperation({ summary: 'Read-only view of a technical ticket that was escalated from one of this Support Member\'s tickets' })
  @Get('technical-issues/:id')
  getLinkedTechnicalTicket(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.supportMemberService.getLinkedTechnicalTicket(id, this.scope(actorId));
  }

  @ApiOperation({ summary: 'Curated company info relevant to a support ticket - no unrestricted HR data' })
  @Get('companies/:id')
  getCompanySummary(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.supportMemberService.getCompanySummary(id, this.scope(actorId));
  }
}
