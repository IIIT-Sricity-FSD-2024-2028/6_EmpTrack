import { DateField, EnumField, IdField, LIMITS, NotBeforeField, TextField } from '../../common/validation/validators';

export const LEAVE_TYPES = ['CASUAL', 'SICK', 'UNPAID'];
export const LEAVE_DECISIONS = ['APPROVED', 'REJECTED'];

export class CreateLeaveDto {
  // Optional and only accepted when it matches the caller - the applicant is always
  // the logged-in employee (see LeaveService.createLeave).
  @IdField('Employee ID', { optional: true })
  empId?: string;

  @DateField('Start date')
  start_date: string;

  @DateField('End date')
  @NotBeforeField('start_date', 'End date must be on or after the start date.')
  end_date: string;

  // Ignored - recomputed server-side from the dates. Kept so existing clients that
  // still send it pass validation.
  @TextField('Days', { optional: true, max: 4 })
  days?: string;

  @EnumField('Leave type', LEAVE_TYPES)
  leave_type: string;

  @TextField('Reason', { min: 3, max: LIMITS.REASON_MAX, multiline: true })
  reason: string;
}

export class UpdateLeaveStatusDto {
  @EnumField('Status', LEAVE_DECISIONS)
  status: string;

  // Ignored - the approver is always the logged-in caller. Kept optional so existing
  // clients that still send it pass validation.
  @IdField('Approver', { optional: true })
  approved_by_id?: string;

  // Optional: the dashboards' one-click reject sends none.
  @TextField('Rejection reason', { optional: true, min: 5, max: LIMITS.REASON_MAX, multiline: true })
  reject_reason?: string;
}
