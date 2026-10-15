import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { NotificationService } from '../notification/notification.service';
import { CriticalEscalationService } from '../critical-escalation/critical-escalation.service';
import {
  AssignTicketDto,
  ReassignTicketDto,
  ResolveTicketDto,
  EscalateTicketDto,
  AddTicketCommentDto,
  ChangeTicketStatusDto,
  ChangeTicketPriorityDto,
  ChangeTicketCategoryDto,
  AddInternalNoteDto,
  ReopenTicketDto,
  EscalateToTechnicalDto,
  EscalateToPlatformAdminDto,
  VerifyResolutionDto,
  RejectResolutionDto,
  RaiseTicketDto,
} from './dto/platform-ticket.dto';

type Actor = { emp_id: string; emp_name: string; role: string };
type TicketType = 'TECHNICAL' | 'SUPPORT';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Injectable()
export class PlatformTicketService {
  constructor(
    private readonly dataStore: MockDataService,
    private readonly notificationService: NotificationService,
    private readonly criticalEscalationService: CriticalEscalationService,
  ) {}

  private enrich(ticket: any) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === ticket.company_id);
    const assignee = this.dataStore.getEmployees().find((e) => e.emp_id === ticket.assigned_to);
    return {
      ...ticket,
      company_name: company ? company.company_name : ticket.company_id,
      assigned_to_name: assignee ? assignee.emp_name : null,
    };
  }

  private touch(ticket: any) {
    ticket.updated_date = new Date().toISOString().split('T')[0];
  }

  private find(ticketType: TicketType, id: string, scopePlatformAdminId: string | null) {
    const ticket = this.dataStore.getPlatformTickets().find((t) => t.ticket_id === id && t.ticket_type === ticketType);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (scopePlatformAdminId && ticket.platform_admin_id !== scopePlatformAdminId) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  getAll(
    ticketType: TicketType,
    scopePlatformAdminId: string | null,
    status?: string,
    priority?: string,
    companyId?: string,
    assignedTo?: string,
    category?: string,
    search?: string,
    escalatedOnly?: boolean,
  ) {
    let tickets = this.dataStore.getPlatformTickets().filter((t) => t.ticket_type === ticketType);
    if (scopePlatformAdminId) tickets = tickets.filter((t) => t.platform_admin_id === scopePlatformAdminId);
    if (status && status !== 'all') tickets = tickets.filter((t) => t.status === status);
    if (priority && priority !== 'all') tickets = tickets.filter((t) => t.priority === priority);
    if (companyId && companyId !== 'all') tickets = tickets.filter((t) => t.company_id === companyId);
    if (assignedTo === 'unassigned') tickets = tickets.filter((t) => !t.assigned_to);
    else if (assignedTo) tickets = tickets.filter((t) => t.assigned_to === assignedTo);
    if (category && category !== 'all') tickets = tickets.filter((t) => t.category === category);
    if (escalatedOnly) tickets = tickets.filter((t) => t.status === 'ESCALATED');

    let enriched = tickets.map((t) => this.enrich(t));

    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter((t) =>
        (t.ticket_id || '').toLowerCase().includes(q) ||
        (t.company_name || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.raised_by_name || '').toLowerCase().includes(q) ||
        (t.raised_by_email || '').toLowerCase().includes(q),
      );
    }

    return enriched.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
  }

  getById(ticketType: TicketType, id: string, scopePlatformAdminId: string | null) {
    return this.enrich(this.find(ticketType, id, scopePlatformAdminId));
  }

  assign(ticketType: TicketType, id: string, dto: AssignTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    ticket.assigned_to = dto.assigned_to;
    if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: ticketType === 'TECHNICAL' ? 'Technical issue assigned' : 'Support ticket assigned',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} assigned.`,
    });
    this.notifyAssignee(ticket, dto.assigned_to);

    return this.enrich(ticket);
  }

  reassign(ticketType: TicketType, id: string, dto: ReassignTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    ticket.reassign_log.push({ from: ticket.assigned_to, to: dto.assigned_to, reason: dto.reason, date: new Date().toISOString().split('T')[0] });
    ticket.assigned_to = dto.assigned_to;
    if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: ticketType === 'TECHNICAL' ? 'Technical issue reassigned' : 'Support ticket reassigned',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} reassigned: ${dto.reason}`,
    });
    this.notifyAssignee(ticket, dto.assigned_to);

    return this.enrich(ticket);
  }

  private notifyAssignee(ticket: any, assignedTo: string) {
    this.notificationService.createNotification({
      employee_id: assignedTo,
      message: `${ticket.ticket_type === 'TECHNICAL' ? 'Technical issue' : 'Support ticket'} ${ticket.ticket_id} (${ticket.title}) has been assigned to you.`,
      type: 'info',
    });
  }

  addComment(ticketType: TicketType, id: string, dto: AddTicketCommentDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    ticket.comments.push({ author: actor.emp_name, message: dto.message, timestamp: new Date().toISOString() });
    this.touch(ticket);

    // Only the ticket's assigned owner is notified - never every member of the team -
    // and only when the reply came from someone else (e.g. a Platform Admin relaying a
    // customer's message), so the assignee doesn't get notified of their own reply.
    if (ticket.assigned_to && ticket.assigned_to !== actor.emp_id) {
      this.notificationService.createNotification({
        employee_id: ticket.assigned_to,
        message: `${actor.emp_name} replied on ${ticket.ticket_id} (${ticket.title}).`,
        type: 'info',
      });
    }

    return this.enrich(ticket);
  }

  resolve(ticketType: TicketType, id: string, dto: ResolveTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) throw new BadRequestException('This ticket is already resolved or closed.');
    ticket.status = 'RESOLVED';
    ticket.resolved_date = new Date().toISOString().split('T')[0];
    if (dto.resolution_notes) ticket.comments.push({ author: actor.emp_name, message: dto.resolution_notes, timestamp: new Date().toISOString() });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: ticketType === 'TECHNICAL' ? 'Technical issue resolved' : 'Support ticket resolved',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} marked as resolved.`,
    });

    return this.enrich(ticket);
  }

  escalate(ticketType: TicketType, id: string, dto: EscalateTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);

    const escalation = this.criticalEscalationService.create(
      {
        company_id: ticket.company_id,
        category: ticketType === 'TECHNICAL' ? 'Technical' : 'Support',
        priority: 'Critical',
        assigned_team: ticketType === 'TECHNICAL' ? 'Technical Team' : 'Support Team',
        description: `Escalated from ${ticket.ticket_id}: ${ticket.title}.${dto.note ? ' ' + dto.note : ''}`,
      },
      actor,
    );

    ticket.status = 'ESCALATED';
    ticket.linked_escalation_id = escalation.issue_id;
    if (dto.note) ticket.comments.push({ author: actor.emp_name, message: dto.note, timestamp: new Date().toISOString() });
    this.touch(ticket);

    return this.enrich(ticket);
  }

  changeStatus(ticketType: TicketType, id: string, dto: ChangeTicketStatusDto, actor: Actor, scopePlatformAdminId: string | null) {
    if (!VALID_STATUSES.includes(dto.status)) throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    const previousStatus = ticket.status;
    ticket.status = dto.status;
    if (dto.status === 'RESOLVED') {
      ticket.resolved_date = new Date().toISOString().split('T')[0];
    } else if (['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(dto.status) && ['RESOLVED', 'CLOSED'].includes(previousStatus)) {
      ticket.resolved_date = null;
    }
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket status changed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} status changed from ${previousStatus} to ${dto.status}.`,
    });
    return this.enrich(ticket);
  }

  changePriority(ticketType: TicketType, id: string, dto: ChangeTicketPriorityDto, actor: Actor, scopePlatformAdminId: string | null) {
    const priority = (dto.priority || '').toUpperCase();
    if (!VALID_PRIORITIES.includes(priority)) throw new BadRequestException(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    const previousPriority = ticket.priority;
    ticket.priority = priority.charAt(0) + priority.slice(1).toLowerCase();
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket priority changed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} priority changed from ${previousPriority} to ${ticket.priority}.`,
    });
    return this.enrich(ticket);
  }

  changeCategory(ticketType: TicketType, id: string, dto: ChangeTicketCategoryDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    const previousCategory = ticket.category;
    // A configured category, or the ticket's existing one (older tickets carry labels
    // that are no longer in the list).
    const categories: string[] = this.dataStore.getTicketCategories() || [];
    if (!categories.includes(dto.category) && dto.category !== previousCategory) {
      throw new BadRequestException(`Category must be one of: ${categories.join(', ')}.`);
    }
    ticket.category = dto.category;
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket category changed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} category changed from ${previousCategory} to ${dto.category}.`,
    });
    return this.enrich(ticket);
  }

  claim(ticketType: TicketType, id: string, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    if (ticket.assigned_to) throw new BadRequestException('Ticket has already been claimed by another Support Member.');
    ticket.assigned_to = actor.emp_id;
    if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket claimed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} claimed by ${actor.emp_name}.`,
    });
    return this.enrich(ticket);
  }

  reopen(ticketType: TicketType, id: string, dto: ReopenTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) throw new BadRequestException('Only resolved or closed tickets can be reopened.');
    ticket.status = 'IN_PROGRESS';
    ticket.resolved_date = null;
    if (dto.reason) ticket.comments.push({ author: actor.emp_name, message: `Reopened: ${dto.reason}`, timestamp: new Date().toISOString() });
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket reopened',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} reopened.${dto.reason ? ' Reason: ' + dto.reason : ''}`,
    });
    return this.enrich(ticket);
  }

  close(ticketType: TicketType, id: string, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    if (ticket.status !== 'RESOLVED') throw new BadRequestException('Only resolved tickets can be closed.');
    ticket.status = 'CLOSED';
    this.touch(ticket);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Ticket closed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} closed.`,
    });
    return this.enrich(ticket);
  }

  addInternalNote(ticketType: TicketType, id: string, dto: AddInternalNoteDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    if (!ticket.internal_notes) ticket.internal_notes = [];
    ticket.internal_notes.push({ author: actor.emp_name, message: dto.message, timestamp: new Date().toISOString() });
    this.touch(ticket);
    return this.enrich(ticket);
  }

  getInternalNotes(ticketType: TicketType, id: string, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
    return ticket.internal_notes || [];
  }

  escalateToTechnical(id: string, dto: EscalateToTechnicalDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find('SUPPORT', id, scopePlatformAdminId);
    if (ticket.status === 'ESCALATED') throw new BadRequestException('This ticket has already been escalated.');

    const technicalTicket = {
      ticket_id: 'TIX-' + Date.now(),
      ticket_type: 'TECHNICAL',
      company_id: ticket.company_id,
      platform_admin_id: ticket.platform_admin_id,
      raised_by_name: ticket.raised_by_name,
      raised_by_id: ticket.raised_by_id || null,
      raised_by_email: ticket.raised_by_email || null,
      title: `Escalated from ${ticket.ticket_id}: ${ticket.title}`,
      category: 'Technical Issue',
      priority: ticket.priority,
      status: 'OPEN',
      assigned_to: null,
      description: `${ticket.description}${dto.note ? '\n\nSupport Member note: ' + dto.note : ''}`,
      created_date: new Date().toISOString().split('T')[0],
      updated_date: new Date().toISOString().split('T')[0],
      resolved_date: null,
      comments: [],
      reassign_log: [],
      internal_notes: [],
      escalated_team: null,
      linked_technical_ticket_id: null,
      linked_from_ticket_id: ticket.ticket_id,
    };
    this.dataStore.getPlatformTickets().push(this.dataStore.normalizeTicket(technicalTicket));

    ticket.status = 'ESCALATED';
    ticket.escalated_team = 'TECHNICAL';
    ticket.linked_technical_ticket_id = technicalTicket.ticket_id;
    if (!ticket.internal_notes) ticket.internal_notes = [];
    ticket.internal_notes.push({ author: actor.emp_name, message: `Escalated to Technical Team as ${technicalTicket.ticket_id}.${dto.note ? ' ' + dto.note : ''}`, timestamp: new Date().toISOString() });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Support ticket escalated to Technical Team',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} escalated as ${technicalTicket.ticket_id}.`,
    });

    if (ticket.platform_admin_id) {
      this.notificationService.createNotification({
        employee_id: ticket.platform_admin_id,
        message: `Support ticket ${ticket.ticket_id} was escalated to the Technical Team as ${technicalTicket.ticket_id}.`,
        type: 'warning',
      });
    }

    return this.enrich(ticket);
  }

  escalateToPlatformAdmin(id: string, dto: EscalateToPlatformAdminDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find('SUPPORT', id, scopePlatformAdminId);
    if (ticket.status === 'ESCALATED') throw new BadRequestException('This ticket has already been escalated.');

    ticket.status = 'ESCALATED';
    ticket.escalated_team = 'PLATFORM_ADMIN';
    const note = dto.note || dto.reason;
    if (!ticket.internal_notes) ticket.internal_notes = [];
    ticket.internal_notes.push({ author: actor.emp_name, message: `Escalated to Platform Admin.${note ? ' ' + note : ''}`, timestamp: new Date().toISOString() });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Support ticket escalated to Platform Admin',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id}: ${ticket.title}.${note ? ' ' + note : ''}`,
    });

    if (ticket.platform_admin_id) {
      this.notificationService.createNotification({
        employee_id: ticket.platform_admin_id,
        message: `${actor.emp_name} escalated support ticket ${ticket.ticket_id} (${ticket.title}) to you.${note ? ' ' + note : ''}`,
        type: 'warning',
      });
    }

    return this.enrich(ticket);
  }

  // --- Verification of Technical Member work --------------------------------
  // A Technical Member resolves an issue and sends it back; only the Platform
  // Admin can sign it off (which closes it permanently) or return it for rework.

  verifyResolution(id: string, dto: VerifyResolutionDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find('TECHNICAL', id, scopePlatformAdminId);
    if (ticket.verification_status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('This issue is not awaiting verification.');
    }

    ticket.verification_status = 'VERIFIED';
    ticket.verification_note = dto.note || null;
    ticket.verified_by = actor.emp_id;
    ticket.verified_by_name = actor.emp_name;
    ticket.verified_at = new Date().toISOString();
    ticket.status = 'CLOSED';
    if (dto.note) ticket.comments.push({ author: actor.emp_name, message: dto.note, timestamp: new Date().toISOString() });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue verified',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} verified and closed.`,
    });

    if (ticket.assigned_to) {
      this.notificationService.createNotification({
        employee_id: ticket.assigned_to,
        message: `${actor.emp_name} verified your resolution of ${ticket.ticket_id} (${ticket.title}). The issue is now closed.`,
        type: 'info',
      });
    }

    return this.enrich(ticket);
  }

  rejectResolution(id: string, dto: RejectResolutionDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find('TECHNICAL', id, scopePlatformAdminId);
    if (ticket.verification_status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('This issue is not awaiting verification.');
    }

    ticket.verification_status = 'REJECTED';
    ticket.verification_note = dto.reason;
    ticket.verified_by = actor.emp_id;
    ticket.verified_by_name = actor.emp_name;
    ticket.verified_at = new Date().toISOString();
    // Returned for rework: back into the member's active queue.
    ticket.status = 'IN_PROGRESS';
    ticket.resolved_date = null;
    ticket.comments.push({ author: actor.emp_name, message: `Verification rejected: ${dto.reason}`, timestamp: new Date().toISOString() });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue verification rejected',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} returned for rework: ${dto.reason}`,
    });

    if (ticket.assigned_to) {
      this.notificationService.createNotification({
        employee_id: ticket.assigned_to,
        message: `${actor.emp_name} returned ${ticket.ticket_id} (${ticket.title}) for rework: ${dto.reason}`,
        type: 'warning',
      });
    }

    return this.enrich(ticket);
  }

  // Company Admin raises a new issue. It belongs to their own company and goes
  // ONLY to the Platform Admin that company is assigned to (company.platform_admin_id)
  // - never Super Admin, never other companies' Platform Admins, never broadcast.
  raiseTicket(dto: RaiseTicketDto, actor: Actor) {
    const employee = this.dataStore.getEmployees().find((e) => e.emp_id === actor.emp_id);
    if (!employee) throw new NotFoundException('Requesting employee not found');
    const company = this.dataStore.getCompanies().find((c) => c.company_id === employee.companyId);
    if (!company) throw new NotFoundException('No company found for this Company Admin');

    const ticketType = (dto.ticket_type || 'TECHNICAL').toUpperCase() === 'SUPPORT' ? 'SUPPORT' : 'TECHNICAL';
    const priorityKey = (dto.priority || 'MEDIUM').toUpperCase();
    if (!VALID_PRIORITIES.includes(priorityKey)) {
      throw new BadRequestException(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }
    const priority = priorityKey.charAt(0) + priorityKey.slice(1).toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    const ticket = this.dataStore.normalizeTicket({
      ticket_id: 'TIX-' + Date.now(),
      ticket_type: ticketType,
      company_id: company.company_id,
      platform_admin_id: company.platform_admin_id,
      raised_by_name: `${actor.emp_name} (Company Admin)`,
      raised_by_id: actor.emp_id,
      raised_by_email: employee.email,
      title: dto.title,
      category: dto.category || 'General',
      priority,
      status: 'OPEN',
      assigned_to: null,
      description: dto.description,
      created_date: today,
      updated_date: today,
      resolved_date: null,
      escalated_team: null,
      linked_technical_ticket_id: null,
      linked_from_ticket_id: null,
    });
    this.dataStore.getPlatformTickets().push(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Issue raised to Platform Admin',
      company_id: company.company_id,
      details: `${ticket.ticket_id}: ${ticket.title}`,
    });

    if (company.platform_admin_id) {
      const page = ticketType === 'SUPPORT' ? 'support-tickets' : 'technical-issues';
      this.notificationService.createNotification({
        employee_id: company.platform_admin_id,
        message: `New issue raised by ${actor.emp_name} (${company.company_name}): ${ticket.title} [${priority}]`,
        type: 'warning',
        link: `/front-end/platform_admin/${page}.html?open=${ticket.ticket_id}`,
      });
    }

    return this.enrich(ticket);
  }

  getStats(scopePlatformAdminId: string | null, mineActorId?: string) {
    const tickets = this.dataStore.getPlatformTickets().filter((t) => t.ticket_type === 'SUPPORT' && (!scopePlatformAdminId || t.platform_admin_id === scopePlatformAdminId));
    const today = new Date().toISOString().split('T')[0];
    const openStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];
    const mine = mineActorId ? tickets.filter((t) => t.assigned_to === mineActorId) : [];

    const resolvedTickets = tickets.filter((t) => t.resolved_date);
    const avgResolutionDays = resolvedTickets.length
      ? Math.round(
          (resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolved_date).getTime() - new Date(t.created_date).getTime()), 0) /
            resolvedTickets.length) /
            (1000 * 60 * 60 * 24) * 10,
        ) / 10
      : 0;

    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    tickets.forEach((t) => {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    return {
      // Assignment is a separate axis from priority - unassigned/critical are both
      // scope-wide counts (who owns nothing / what's urgent), never filtered to "mine".
      unassigned_tickets: tickets.filter((t) => !t.assigned_to).length,
      critical_tickets: tickets.filter((t) => t.priority === 'Critical' && !['RESOLVED', 'CLOSED'].includes(t.status)).length,
      new_tickets: tickets.filter((t) => t.status === 'OPEN').length,
      my_open_tickets: mine.filter((t) => openStatuses.includes(t.status)).length,
      high_priority_tickets: tickets.filter((t) => (t.priority === 'High' || t.priority === 'Critical') && openStatuses.includes(t.status)).length,
      in_progress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      awaiting_customer: tickets.filter((t) => t.status === 'WAITING_FOR_CUSTOMER').length,
      escalated_tickets: tickets.filter((t) => t.status === 'ESCALATED').length,
      // Ownership-scoped: tickets THIS Support Member resolved today, not the whole team's.
      resolved_today: mine.filter((t) => t.resolved_date === today).length,
      total_open_tickets: tickets.filter((t) => openStatuses.includes(t.status)).length,
      tickets_received: tickets.length,
      tickets_resolved: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
      avg_resolution_days: avgResolutionDays,
      by_priority: byPriority,
      by_category: byCategory,
      my_high_priority: mine.filter((t) => (t.priority === 'High' || t.priority === 'Critical') && openStatuses.includes(t.status)).length,
      my_escalated: mine.filter((t) => t.status === 'ESCALATED').length,
      my_resolved: mine.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    };
  }
}
