import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateWorkLogDto } from './dto/worklog.dto';
import { assertCanAccessEmployee, todayKey } from '../common/utils/access-scope.util';

@Injectable()
export class WorkLogService {
  constructor(private readonly dataStore: MockDataService) {}

  getWorkLogsForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.dataStore.getWorkLogs().filter(wl => wl.emp_id === empId);
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
    // Work can only be logged against your own tasks. Ids not on the server (tasks the
    // UI keeps locally) are let through as before.
    const task = this.dataStore.getTasks().find(t => t.task_id === createDto.task_id);
    if (task && task.assigned_to !== actorId) {
      throw new ForbiddenException('You can only log work against tasks assigned to you.');
    }

    const newLog = {
        worklog_id: 'WL-' + Date.now(),
        ...createDto,
        emp_id: actorId,
        log_date: todayKey()
    };
    this.dataStore.getWorkLogs().push(newLog);
    return newLog;
  }
}
