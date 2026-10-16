import { DateField, EnumField, IdField, LIMITS, NumberField, NumericField, TextField } from '../../common/validation/validators';

export const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
// Compared case-insensitively - the Team Lead UI sends 'Medium', seed data uses 'HIGH'.
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const MAX_EST_HOURS = 1000;

export class CreateTaskDto {
  @IdField('Client request', { optional: true })
  client_request_id?: string;

  @TextField('Task title', { min: 3, max: LIMITS.TITLE_MAX })
  task_title: string;

  @IdField('Allocation', { optional: true })
  allocation_id?: string;

  @IdField('Assignee')
  assigned_to: string;

  @TextField('Description', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true })
  task_description?: string;

  @EnumField('Priority', TASK_PRIORITIES, { caseInsensitive: true })
  priority: string;

  // Not in the past - checked in TaskService against the server's date.
  @DateField('Deadline')
  deadline: string;

  // The Team Lead form sends this from a number input (number or numeric string);
  // converted in TaskService.
  @NumericField('Estimated hours', { min: 0.5, max: MAX_EST_HOURS, optional: true })
  est_hours?: string | number;
}

export class UpdateTaskDto {
  @EnumField('Status', TASK_STATUSES, { optional: 'partial' })
  status?: string;

  @NumberField('Progress', { min: 0, max: 100, integer: true, optional: 'partial' })
  progress_percentage?: number;

  @TextField('Task title', { min: 3, max: LIMITS.TITLE_MAX, optional: 'partial' })
  task_title?: string;

  @EnumField('Priority', TASK_PRIORITIES, { optional: 'partial', caseInsensitive: true })
  priority?: string;

  @DateField('Deadline', { optional: 'partial' })
  deadline?: string;

  @TextField('Description', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true })
  task_description?: string;
}
