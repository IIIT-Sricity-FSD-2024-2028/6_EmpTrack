import { EnumField, IdField, TextField } from '../../common/validation/validators';

export const ATTENDANCE_MODES = ['OFFICE', 'REMOTE'];

// The employee is always the logged-in caller; empId is accepted only when it matches
// (see AttendanceService) so existing clients that still send it keep working.
export class MarkAttendanceDto {
  @IdField('Employee ID', { optional: true })
  empId?: string;

  // Ignored - check-in is stamped with the server clock, the same clock check-out
  // uses, so the two can't disagree and a client can't backdate its arrival.
  @TextField('Check-in time', { optional: true, max: 40 })
  checkInTime?: string;

  @EnumField('Attendance mode', ATTENDANCE_MODES, { optional: true })
  mode?: string;
}

export class CheckOutDto {
  @IdField('Employee ID', { optional: true })
  empId?: string;
}
