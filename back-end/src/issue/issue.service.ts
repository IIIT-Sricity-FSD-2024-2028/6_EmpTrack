import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { WorkflowPersistenceService } from '../data/workflow-persistence.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, getActor, todayKey } from '../common/utils/access-scope.util';

const ISSUE_MANAGER_ROLES = ['TEAMLEAD', 'HR', 'COMPANY_ADMIN'];

@Injectable()
export class IssueService {
  constructor(private readonly dataStore: MockDataService, private readonly persistence: WorkflowPersistenceService) {
    this.persistence.seedIssues(this.dataStore.getIssues());
  }

  getIssuesForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.persistence.getIssuesForEmployee(empId);
  }

  // Only issues raised by employees the caller may see (own company for HR/Company
  // Admin, own team for a Team Lead, just their own for an Employee).
  getAllIssues(actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    return this.persistence.getIssues().filter(i => visible.has(i.emp_id));
  }

  createIssue(createDto: CreateIssueDto, actorId: string) {
    if (createDto.emp_id && createDto.emp_id !== actorId) {
      throw new ForbiddenException('You can only raise issues as yourself.');
    }
    if (createDto.related_task) {
      const task = this.dataStore.getTasks().find(t => t.task_id === createDto.related_task);
      if (!task || task.assigned_to !== actorId) {
        throw new BadRequestException('The related task must be one of your own tasks.');
      }
    }
    const newIssue = {
        issue_id: 'ISS-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        ...createDto,
        emp_id: actorId,
        status: 'Open',
        assigned_to: 'Unassigned',
        raised_date: todayKey(),
        updates: []
    };
    this.persistence.createIssue(newIssue);
    this.dataStore.getIssues().push(newIssue);
    return newIssue;
  }

  updateIssue(id: string, updateData: UpdateIssueDto, actorId: string) {
    const issue = this.persistence.getIssue(id);
    if (!issue) throw new NotFoundException('Issue not found');

    const actor = getActor(this.dataStore, actorId);
    if (!ISSUE_MANAGER_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Only a Team Lead, HR or Company Admin can update issues.');
    }
    assertCanAccessEmployee(this.dataStore, actorId, issue.emp_id);

    const nextStatus = updateData.status;
    if (issue.status === 'Resolved' && Object.keys(updateData).length > 0) {
      throw new BadRequestException('Resolved issues cannot be modified.');
    }
    const allowedNextStatuses: Record<string, string[]> = {
      Open: ['Open', 'In Progress', 'Resolved'],
      Pending: ['Pending', 'In Progress', 'Resolved'],
      'In Progress': ['In Progress', 'Resolved'],
    };
    if (nextStatus && !allowedNextStatuses[issue.status]?.includes(nextStatus)) {
      throw new BadRequestException(`Issue cannot move from ${issue.status} to ${nextStatus}.`);
    }
    if (nextStatus === 'Resolved' && !updateData.resolution) {
      throw new BadRequestException('Resolution details are required to resolve an issue.');
    }
    if (updateData.resolution && nextStatus !== 'Resolved' && issue.status !== 'Resolved') {
      throw new BadRequestException('Resolution details can only be recorded when resolving an issue.');
    }

    const changes: Record<string, any> = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));
    if (changes.assigned_team) {
      const team = this.dataStore.getTeams().find((item) =>
        item.team_name === changes.assigned_team && item.team_lead_id === actorId && item.companyId === actor.companyId,
      );
      if (!team) throw new ForbiddenException('You may only assign issues to a team that you lead.');
    }
    if (changes.assigned_to && changes.assigned_to !== 'Unassigned') {
      const assignee = this.dataStore.getEmployees().find((employee) =>
        employee.emp_id === changes.assigned_to || employee.emp_name === changes.assigned_to,
      );
      if (!assignee || assignee.companyId !== actor.companyId || assignee.manager_id !== actorId) {
        throw new ForbiddenException('Issues may only be assigned to an active employee who reports to you.');
      }
      if (assignee.status && assignee.status !== 'ACTIVE') {
        throw new BadRequestException('Issues cannot be assigned to an inactive employee.');
      }
      if (changes.assigned_team) {
        const team = this.dataStore.getTeams().find((item) => item.team_name === changes.assigned_team);
        if (team?.team_id !== assignee.team_id) {
          throw new ForbiddenException('The selected assignee does not belong to the selected team.');
        }
      }
      changes.assigned_to = assignee.emp_name;
    }
    if (nextStatus === 'Resolved' && !changes.resolved_date) changes.resolved_date = todayKey();
    if (changes.resolution) changes.resolution = { ...changes.resolution, resolved_by: actor.emp_id };
    const updated = { ...issue, ...changes };
    this.persistence.saveIssue(updated);
    const memoryIssue = this.dataStore.getIssues().find(i => i.issue_id === id);
    if (memoryIssue) Object.assign(memoryIssue, updated);
    return updated;
  }
}
