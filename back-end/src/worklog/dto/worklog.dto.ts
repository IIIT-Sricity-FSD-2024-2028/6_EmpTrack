import { DateTimeField, IdField, LIMITS, NotBeforeField, NumberField, TextField } from '../../common/validation/validators';

export class StartWorkSessionDto {
  @IdField('Task')
  task_id: string;
}

export class ConfirmWorkSessionDto {
  @TextField('Description', { min: 5, max: LIMITS.COMMENT_MAX, multiline: true })
  description: string;
}

export class CreateWorkLogDto {
  // Optional and only accepted when it matches the caller (see WorkLogService).
  @IdField('Employee ID', { optional: true })
  emp_id?: string;

  @IdField('Task')
  task_id: string;

  @TextField('Task title', { max: LIMITS.TITLE_MAX })
  task_title: string;

  @DateTimeField('Start time')
  start_time: string;

  @DateTimeField('End time')
  @NotBeforeField('start_time', 'End time must be after the start time.', { strict: true })
  end_time: string;

  // WorkLogService also requires it to be more than 0.
  @NumberField('Hours spent', { min: 0, max: 24 })
  hours_spent: number;

  @TextField('Description', { min: 5, max: LIMITS.COMMENT_MAX, multiline: true })
  description: string;
}
