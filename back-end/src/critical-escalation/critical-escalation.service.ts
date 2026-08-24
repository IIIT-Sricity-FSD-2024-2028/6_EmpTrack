import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import {
  CreateCriticalEscalationDto,
  AssignEscalationDto,
  UpdatePriorityDto,
  ResolveEscalationDto,
  EscalateDto,
  AddCommentDto,
} from './dto/critical-escalation.dto';

type Actor = { emp_id: string; emp_name: string; role: string };

@Injectable()
export class CriticalEscalationService {
  constructor(private readonly dataStore: MockDataService) {}

  private enrich(escalation: any) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === escalation.company_id);
    const raisedBy = this.dataStore.getEmployees().find((e) => e.emp_id === escalation.raised_by);
    return {
      ...escalation,
      company_name: company ? company.company_name : escalation.company_id,
      raised_by_name: raisedBy ? raisedBy.emp_name : escalation.raised_by,
    };
  }

  private touch(escalation: any) {
    escalation.updated_date = new Date().toISOString().split('T')[0];
  }

  getAll(status?: string, priority?: string, companyId?: string) {
    let escalations = this.dataStore.getCriticalEscalations();
    if (status && status !== 'all') escalations = escalations.filter((e) => e.status === status);
    if (priority && priority !== 'all') escalations = escalations.filter((e) => e.priority === priority);
    if (companyId) escalations = escalations.filter((e) => e.company_id === companyId);
    return escalations.map((e) => this.enrich(e));
  }

  getById(id: string) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    return this.enrich(escalation);
  }

  create(dto: CreateCriticalEscalationDto, actor: Actor) {
    const escalation = {
      issue_id: 'CESC-' + Date.now(),
      company_id: dto.company_id,
      raised_by: actor.emp_id,
      category: dto.category,
      priority: dto.priority,
      assigned_team: dto.assigned_team || 'Unassigned',
      status: 'OPEN',
      description: dto.description || '',
      created_date: new Date().toISOString().split('T')[0],
      updated_date: new Date().toISOString().split('T')[0],
      comments: [],
    };
    this.dataStore.getCriticalEscalations().push(escalation);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Support issue escalated',
      company_id: dto.company_id,
      details: `Raised a ${dto.priority} priority ${dto.category} escalation.`,
    });
    return this.enrich(escalation);
  }

  assign(id: string, dto: AssignEscalationDto, actor: Actor) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.assigned_team = dto.assigned_team;
    if (escalation.status === 'OPEN') escalation.status = 'IN_PROGRESS';
    this.touch(escalation);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Escalation assigned',
      company_id: escalation.company_id,
      details: `Assigned to ${dto.assigned_team}.`,
    });
    return this.enrich(escalation);
  }

  updatePriority(id: string, dto: UpdatePriorityDto, actor: Actor) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.priority = dto.priority;
    this.touch(escalation);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Escalation priority changed',
      company_id: escalation.company_id,
      details: `Priority set to ${dto.priority}.`,
    });
    return this.enrich(escalation);
  }

  resolve(id: string, dto: ResolveEscalationDto, actor: Actor) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.status = 'RESOLVED';
    if (dto.resolution_notes) escalation.comments.push({ author: actor.emp_name, message: dto.resolution_notes, timestamp: new Date().toISOString() });
    this.touch(escalation);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Escalation resolved',
      company_id: escalation.company_id,
      details: 'Marked as resolved.',
    });
    return this.enrich(escalation);
  }

  escalate(id: string, dto: EscalateDto, actor: Actor) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.status = 'ESCALATED';
    escalation.priority = 'Critical';
    if (dto.note) escalation.comments.push({ author: actor.emp_name, message: dto.note, timestamp: new Date().toISOString() });
    this.touch(escalation);
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue escalated',
      company_id: escalation.company_id,
      details: 'Escalated further with Critical priority.',
    });
    return this.enrich(escalation);
  }

  addComment(id: string, dto: AddCommentDto, actor: Actor) {
    const escalation = this.dataStore.getCriticalEscalations().find((e) => e.issue_id === id);
    if (!escalation) throw new NotFoundException('Escalation not found');
    escalation.comments.push({ author: actor.emp_name, message: dto.message, timestamp: new Date().toISOString() });
    this.touch(escalation);
    return this.enrich(escalation);
  }
}
