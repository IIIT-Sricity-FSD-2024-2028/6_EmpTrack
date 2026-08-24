import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { NotificationService } from '../notification/notification.service';
import { CriticalEscalationService } from '../critical-escalation/critical-escalation.service';
import {
  AssignTicketDto,
  ReassignTicketDto,
  ResolveTicketDto,
  EscalateTicketDto,
  AddTicketCommentDto,
} from './dto/platform-ticket.dto';

type Actor = { emp_id: string; emp_name: string; role: string };
type TicketType = 'TECHNICAL' | 'SUPPORT';

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

  getAll(ticketType: TicketType, scopePlatformAdminId: string | null, status?: string, priority?: string, companyId?: string, assignedTo?: string) {
    let tickets = this.dataStore.getPlatformTickets().filter((t) => t.ticket_type === ticketType);
    if (scopePlatformAdminId) tickets = tickets.filter((t) => t.platform_admin_id === scopePlatformAdminId);
    if (status && status !== 'all') tickets = tickets.filter((t) => t.status === status);
    if (priority && priority !== 'all') tickets = tickets.filter((t) => t.priority === priority);
    if (companyId) tickets = tickets.filter((t) => t.company_id === companyId);
    if (assignedTo) tickets = tickets.filter((t) => t.assigned_to === assignedTo);
    return tickets.map((t) => this.enrich(t));
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
    return this.enrich(ticket);
  }

  resolve(ticketType: TicketType, id: string, dto: ResolveTicketDto, actor: Actor, scopePlatformAdminId: string | null) {
    const ticket = this.find(ticketType, id, scopePlatformAdminId);
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
}
