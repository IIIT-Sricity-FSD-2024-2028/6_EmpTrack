import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MockDataService } from '../data/mock-data.service';
import { WorkflowPersistenceService } from '../data/workflow-persistence.service';
import { CreateWorkLogDto } from './dto/worklog.dto';
import { assertCanAccessEmployee, todayKey } from '../common/utils/access-scope.util';

@Injectable()
export class WorkLogService {
  constructor(private readonly dataStore: MockDataService, private readonly persistence: WorkflowPersistenceService) {
    this.persistence.seedWorkLogs(this.dataStore.getWorkLogs());
    this.dataStore.setWorkLogs(this.persistence.getWorkLogs());
  }

  getWorkLogsForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.persistence.getWorkLogsForEmployee(empId);
  }

  createWorkLog(createDto: CreateWorkLogDto, actorId: string) {
    if (createDto.emp_id && createDto.emp_id !== actorId) {
      throw new ForbiddenException('You can only log work for yourself.');
    }
    const start = Date.parse(createDto.start_time);
    const end = Date.parse(createDto.end_time);
    if (isNaN(start) || isNaN(end)) {
      throw new BadRequestException('start_time and end_time must be valid date-times.');
    }
    if (end <= start) {
      throw new BadRequestException('End time must be after the start time.');
    }
    if (!(createDto.hours_spent > 0 && createDto.hours_spent <= 24)) {
      throw new BadRequestException('hours_spent must be more than 0 and at most 24.');
    }
    // Work must be logged against a persisted task assigned to the authenticated user.
    const task = this.dataStore.getTasks().find(t => t.task_id === createDto.task_id);
    if (!task) {
      throw new BadRequestException('Work can only be logged against an existing task.');
    }
    if (task.assigned_to !== actorId) {
      throw new ForbiddenException('You can only log work against tasks assigned to you.');
    }
    if (task.status === 'COMPLETED') {
      throw new BadRequestException('Work cannot be logged against a completed task.');
    }
    const elapsedHours = Math.floor((end - start) / 3_600_000);
    if (elapsedHours < 1 || elapsedHours > 24 || elapsedHours !== Number(createDto.hours_spent)) {
      throw new BadRequestException('Hours spent must match the whole hours between the start and end times (1 to 24 hours).');
    }

    const newLog = {
        worklog_id: 'WL-' + randomUUID(),
        ...createDto,
        emp_id: actorId,
        task_title: task.task_title,
        log_date: todayKey()
    };
    this.persistence.createWorkLog(newLog);
    this.dataStore.getWorkLogs().push(newLog);
    return newLog;
  }
}
