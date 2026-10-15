import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateTaskDto, UpdateTaskDto, TASK_PRIORITIES } from './dto/task.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, canAccessEmployee, getActor, isDateKey, todayKey } from '../common/utils/access-scope.util';

// Fields an assignee may change on their own task; managers may change everything in
// UpdateTaskDto.
const ASSIGNEE_FIELDS = ['status', 'progress_percentage'];

function assertPriority(priority: string) {
  if (!TASK_PRIORITIES.includes(String(priority).toUpperCase())) {
    throw new BadRequestException(`priority must be one of: ${TASK_PRIORITIES.join(', ')}`);
  }
}

@Injectable()
export class TaskService {
  constructor(private readonly dataStore: MockDataService) {}

  getTasksForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.dataStore.getTasks().filter(t => t.assigned_to === empId);
  }

  // Tasks of a manager's direct reports, restricted to employees the caller may see
  // (a Team Lead can only ever get their own team, see TaskController).
  getAllTasksForManager(managerId: string, actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    const teamIds = this.dataStore.getEmployees()
      .filter(m => m.manager_id === managerId && visible.has(m.emp_id))
      .map(m => m.emp_id);
    return this.dataStore.getTasks().filter(t => teamIds.includes(t.assigned_to));
  }

  createTask(createDto: CreateTaskDto, actorId: string) {
    const { actor, target } = assertCanAccessEmployee(this.dataStore, actorId, createDto.assigned_to);
    if (target.emp_id === actor.emp_id) {
      throw new BadRequestException('You cannot assign a task to yourself.');
    }
    if (target.status && target.status !== 'ACTIVE') {
      throw new BadRequestException('Tasks can only be assigned to active employees.');
    }
    if (!createDto.task_title.trim()) throw new BadRequestException('task_title should not be empty');
    assertPriority(createDto.priority);
    if (!isDateKey(createDto.deadline)) {
      throw new BadRequestException('deadline must be a valid date in YYYY-MM-DD format.');
    }
    if (createDto.deadline < todayKey()) {
      throw new BadRequestException('Deadline cannot be in the past.');
    }
    let estHours: number | undefined;
    if (createDto.est_hours !== undefined && createDto.est_hours !== '') {
      estHours = Number(createDto.est_hours);
      if (!Number.isFinite(estHours) || estHours <= 0) {
        throw new BadRequestException('est_hours must be a number greater than 0.');
      }
    }

    const newTask = {
      task_id: 'TK' + Date.now(),
      ...createDto,
      task_title: createDto.task_title.trim(),
      ...(estHours !== undefined ? { est_hours: estHours } : {}),
      assigned_by: actor.emp_id,
      status: 'NOT_STARTED',
      progress_percentage: 0,
      updated_date: todayKey(),
      warning_sent: false
    };
    this.dataStore.getTasks().push(newTask);
    return newTask;
  }

  updateTask(taskId: string, updateDto: UpdateTaskDto, actorId: string) {
    const task = this.dataStore.getTasks().find(t => t.task_id === taskId);
    if (!task) throw new NotFoundException('Task not found');

    const actor = getActor(this.dataStore, actorId);
    const assignee = this.dataStore.getEmployees().find(e => e.emp_id === task.assigned_to);
    const isAssignee = task.assigned_to === actor.emp_id;
    const isManager = !isAssignee && ['TEAMLEAD', 'COMPANY_ADMIN'].includes(actor.role) && canAccessEmployee(actor, assignee);
    if (!isAssignee && !isManager) {
      throw new ForbiddenException('You cannot modify this task.');
    }

    const changes: Record<string, any> = Object.fromEntries(Object.entries(updateDto).filter(([, v]) => v !== undefined));
    if (isAssignee) {
      const disallowed = Object.keys(changes).filter(k => !ASSIGNEE_FIELDS.includes(k));
      if (disallowed.length) {
        throw new ForbiddenException(`You can only update the status and progress of your own task (not: ${disallowed.join(', ')}).`);
      }
    }
    if (changes.priority !== undefined) assertPriority(changes.priority);
    if (changes.deadline !== undefined && !isDateKey(changes.deadline)) {
      throw new BadRequestException('deadline must be a valid date in YYYY-MM-DD format.');
    }
    if (changes.task_title !== undefined) changes.task_title = changes.task_title.trim();
    // A completed task is always 100% done (same rule the Team Lead UI applies).
    if (changes.status === 'COMPLETED') changes.progress_percentage = 100;

    Object.assign(task, changes);
    task.updated_date = todayKey();
    return task;
  }
}
