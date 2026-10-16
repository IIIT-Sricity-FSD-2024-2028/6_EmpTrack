import { EnumField, IdField, LIMITS, TextField } from '../../common/validation/validators';
import { PRIORITY_VALUES } from '../../common/validation/enums';

export class CreateEscalationDto {
  // What the escalation is about: a Team Lead category ("Conflict", "Workload"...)
  // or a record type ("ATTENDANCE").
  @TextField('Escalation category', { min: 2, max: 50 })
  reference_type: string;

  @IdField('Reference')
  reference_id: string;

  @IdField('Issue', { optional: true })
  issue_id?: string;

  // Optional and only accepted when it matches the caller (see EscalationService).
  @IdField('Escalated from', { optional: true })
  escalated_from?: string;

  // An employee id or a department such as "HR".
  @IdField('Escalated to')
  escalated_to: string;

  @TextField('Escalation reason', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true })
  escalation_reason: string;

  @EnumField('Priority', PRIORITY_VALUES, { optional: true, caseInsensitive: true })
  priority?: string;
}
