import { EnumField, IdField, LIMITS, TextField } from '../../common/validation/validators';
import { PRIORITY_VALUES } from '../../common/validation/enums';

// Options offered by the Super Admin escalation form.
export const ESCALATION_CATEGORIES = ['Technical', 'Billing', 'Support', 'Security', 'Other'];
export const ESCALATION_TEAMS = ['Support Team', 'Technical Team', 'Unassigned'];

export class CreateCriticalEscalationDto {
  @IdField('Company') company_id: string;
  @EnumField('Category', ESCALATION_CATEGORIES) category: string;
  @EnumField('Priority', PRIORITY_VALUES, { caseInsensitive: true }) priority: string;
  @EnumField('Assigned team', ESCALATION_TEAMS, { optional: true }) assigned_team?: string;
  @TextField('Description', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true }) description?: string;
}

export class AssignEscalationDto {
  @EnumField('Assigned team', ESCALATION_TEAMS) assigned_team: string;
}

export class UpdatePriorityDto {
  @EnumField('Priority', PRIORITY_VALUES, { caseInsensitive: true }) priority: string;
}

export class ResolveEscalationDto {
  @TextField('Resolution notes', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true }) resolution_notes?: string;
}

export class EscalateDto {
  @TextField('Note', { optional: true, max: LIMITS.COMMENT_MAX, multiline: true }) note?: string;
}

export class AddCommentDto {
  @TextField('Comment', { max: LIMITS.COMMENT_MAX, multiline: true }) message: string;
}
