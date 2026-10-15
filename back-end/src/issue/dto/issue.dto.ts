import { ArrayMaxSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import {
  BooleanField,
  DateField,
  EnumField,
  IdField,
  LIMITS,
  Nested,
  NumberField,
  TextField,
  TextListField,
} from '../../common/validation/validators';
import { PRIORITY_VALUES } from '../../common/validation/enums';

export const ISSUE_STATUSES = ['Open', 'Pending', 'In Progress', 'Resolved'];

export class CreateIssueDto {
  // Optional and only accepted when it matches the caller - the raiser is always the
  // logged-in employee (see IssueService.createIssue).
  @IdField('Employee ID', { optional: true })
  emp_id?: string;

  @TextField('Issue title', { min: 3, max: LIMITS.TITLE_MAX })
  title: string;

  // Free text: the employee and Team Lead screens offer different type lists, and
  // existing issues carry older labels ("Hardware Issue", "Process Blocker"...).
  @TextField('Issue type', { min: 2, max: LIMITS.SHORT_TEXT_MAX })
  type: string;

  @EnumField('Priority', PRIORITY_VALUES, { caseInsensitive: true })
  priority: string;

  @IdField('Related task', { optional: true })
  related_task?: string;

  @TextField('Description', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true })
  description: string;
}

/** What the Team Lead "Resolve Issue" screen records. */
export class IssueResolutionDto {
  @TextField('Resolution type', { min: 2, max: LIMITS.SHORT_TEXT_MAX }) type: string;
  @NumberField('Time spent', { min: 0.5, max: 200 }) time_spent: number;
  @TextField('Root cause', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }) root_cause: string;
  @TextField('Actions taken', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }) actions_taken: string;
  @TextField('Preventive measures', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true }) preventive_measures?: string;
  @BooleanField('Follow-up required', { optional: true }) followup_required?: boolean;
  @TextListField('Evidence', { optional: true, maxItems: 20, maxLength: 255 }) evidence?: string[];
  @IdField('Resolved by', { optional: true }) resolved_by?: string;
}

export class IssueUpdateEntryDto {
  @TextField('Update sender', { max: LIMITS.NAME_MAX }) sender: string;
  @TextField('Update time', { max: 40 }) time: string;
  @TextField('Update message', { max: LIMITS.COMMENT_MAX, multiline: true }) message: string;
}

// The fields the Team Lead assign/resolve screens send. Anything else (emp_id,
// issue_id, raised_date...) is stripped by the global ValidationPipe whitelist.
export class UpdateIssueDto {
  @EnumField('Status', ISSUE_STATUSES, { optional: 'partial' }) status?: string;
  @TextField('Issue type', { min: 2, max: LIMITS.SHORT_TEXT_MAX, optional: 'partial' }) type?: string;
  @EnumField('Priority', PRIORITY_VALUES, { optional: 'partial', caseInsensitive: true }) priority?: string;
  // The assignee's display name or "Unassigned".
  @TextField('Assignee', { max: LIMITS.NAME_MAX, optional: 'partial' }) assigned_to?: string;
  @TextField('Assigned team', { max: LIMITS.NAME_MAX, optional: true }) assigned_team?: string;
  @DateField('Deadline', { optional: true }) deadline?: string;
  @TextField('Assignment notes', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true }) assignment_notes?: string;
  @DateField('Resolved date', { optional: true }) resolved_date?: string;

  @IsOptional()
  @ValidateNested()
  @Nested(() => IssueResolutionDto)
  resolution?: IssueResolutionDto;

  @IsOptional()
  @IsArray({ message: 'Updates must be a list.' })
  @ArrayMaxSize(200, { message: 'Too many updates.' })
  @ValidateNested({ each: true })
  @Nested(() => IssueUpdateEntryDto)
  updates?: IssueUpdateEntryDto[];
}
