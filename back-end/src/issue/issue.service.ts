import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, getActor, todayKey } from '../common/utils/access-scope.util';

const ISSUE_MANAGER_ROLES = ['TEAMLEAD', 'HR', 'COMPANY_ADMIN'];

@Injectable()
export class IssueService {
  constructor(private readonly dataStore: MockDataService) {}

  getIssuesForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.dataStore.getIssues().filter(i => i.emp_id === empId);
  }

  // Only issues raised by employees the caller may see (own company for HR/Company
  // Admin, own team for a Team Lead, just their own for an Employee).
  getAllIssues(actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    return this.dataStore.getIssues().filter(i => visible.has(i.emp_id));
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
        issue_id: 'ISS-' + Date.now(),
        ...createDto,
        emp_id: actorId,
        status: 'Open',
        assigned_to: 'Unassigned',
        raised_date: todayKey(),
        updates: []
    };
    this.dataStore.getIssues().push(newIssue);
    return newIssue;
  }

  updateIssue(id: string, updateData: UpdateIssueDto, actorId: string) {
    const issue = this.dataStore.getIssues().find(i => i.issue_id === id);
    if (!issue) throw new NotFoundException('Issue not found');

    const actor = getActor(this.dataStore, actorId);
    if (!ISSUE_MANAGER_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Only a Team Lead, HR or Company Admin can update issues.');
    }
    assertCanAccessEmployee(this.dataStore, actorId, issue.emp_id);

    const changes: Record<string, any> = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));
    if (changes.resolution) changes.resolution = { ...changes.resolution, resolved_by: actor.emp_id };
    Object.assign(issue, changes);
    return issue;
  }
}
