import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MockDataService } from '../data/mock-data.service';
import { WorkflowPersistenceService } from '../data/workflow-persistence.service';
import { CreateWorkLogDto } from './dto/worklog.dto';
import { assertCanAccessEmployee, todayKey } from '../common/utils/access-scope.util';

@Injectable()
export class WorkLogService {
  private now = () => new Date();
  constructor(private readonly dataStore: MockDataService, private readonly persistence: WorkflowPersistenceService) {
    this.persistence.seedWorkLogs(this.dataStore.getWorkLogs());
    this.dataStore.setWorkLogs(this.persistence.getWorkLogs());
  }

  getWorkLogsForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.persistence.getWorkLogsForEmployee(empId);
  }

  getActiveWorkSession(actorId: string) {
    const session = this.persistence.getOpenWorkSession(actorId);
    if (!session) return null;
    if (session.status === 'ACTIVE') {
      const elapsed = this.now().getTime() - Date.parse(session.start_time);
      return { ...session, elapsed_ms: Math.max(0, elapsed) };
    }
    return session;
  }

  startWorkSession(taskId: string, actorId: string) {
    const actor = this.dataStore.getEmployees().find((employee) => employee.emp_id === actorId);
    if (!actor || actor.role !== 'EMPLOYEE') throw new ForbiddenException('Only employees can start a work session.');
    const task = this.dataStore.getTasks().find((item) => item.task_id === taskId);
    if (!task) throw new NotFoundException('Task not found.');
    if (task.assigned_to !== actorId) throw new ForbiddenException('You can only track tasks assigned to you.');
    if (task.status === 'COMPLETED') throw new BadRequestException('Work cannot be tracked on a completed task.');
    const startedAt = this.now().toISOString();
    return this.persistence.startWorkSession({
      session_id: `WS-${randomUUID()}`,
      employee_id: actorId,
      task_id: task.task_id,
      task_title: task.task_title,
      start_time: startedAt,
      created_at: startedAt,
      updated_at: startedAt,
    });
  }

  stopWorkSession(sessionId: string, actorId: string) {
    if (!this.persistence.getOpenWorkSession(actorId)) throw new NotFoundException('No active work session was found.');
    const stoppedAt = this.now().toISOString();
    const session = this.persistence.stopWorkSession(actorId, sessionId, stoppedAt);
    return { ...session, task_title: session.task_title };
  }

  confirmWorkSession(sessionId: string, description: string, actorId: string) {
    const session = this.persistence.getWorkSession(actorId, sessionId);
    if (!session) throw new NotFoundException('Stopped work session was not found.');
    if (session.status === 'ACTIVE') throw new BadRequestException('Stop the timer before saving its work description.');
    if (session.status === 'SAVED') return this.persistence.saveStoppedWorkSession(actorId, sessionId, description.trim(), null);
    const elapsedMs = Number(session.elapsed_ms);
    const hours = Math.round((elapsedMs / 3_600_000) * 10_000) / 10_000;
    const stopped = new Date(session.stop_time);
    const worklog = {
      worklog_id: `WL-${randomUUID()}`,
      emp_id: actorId,
      task_id: session.task_id,
      task_title: session.task_title,
      start_time: session.start_time,
      end_time: session.stop_time,
      hours_spent: hours,
      elapsed_ms: elapsedMs,
      description: description.trim(),
      log_date: stopped.toISOString().slice(0, 10),
      created_at: this.now().toISOString(),
      updated_at: this.now().toISOString(),
    };
    const saved = this.persistence.saveStoppedWorkSession(actorId, sessionId, description.trim(), worklog);
    return saved;
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
