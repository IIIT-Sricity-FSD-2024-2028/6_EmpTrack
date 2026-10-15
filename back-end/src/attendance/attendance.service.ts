import { Injectable, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { MarkAttendanceDto, CheckOutDto } from './dto/attendance.dto';
import { assertCanAccessEmployee, todayKey } from '../common/utils/access-scope.util';

// HH:mm on the server clock - used for both check-in and check-out.
const clockTime = (d = new Date()) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

@Injectable()
export class AttendanceService {
  constructor(private readonly dataStore: MockDataService) {}

  getAttendanceForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.dataStore.getAttendance().filter(a => a.emp_id === empId);
  }

  private assertSelf(empId: string | undefined, actorId: string) {
    if (empId && empId !== actorId) {
      throw new ForbiddenException('You can only record your own attendance.');
    }
  }

  markAttendance(markDto: MarkAttendanceDto, actorId: string) {
    this.assertSelf(markDto.empId, actorId);
    const today = todayKey();
    const existing = this.dataStore.getAttendance().find(a => a.emp_id === actorId && a.attendance_date === today);
    if (existing) {
      throw new ConflictException("Attendance already marked for today.");
    }
    const newRecord = {
      attendance_id: 'A' + Date.now(),
      emp_id: actorId,
      attendance_date: today,
      attendance_mode: markDto.mode || "OFFICE",
      check_in_time: clockTime(),
      check_out_time: null,
      screen_time: null,
      hours_spent: 0,
      status: "PRESENT"
    };
    this.dataStore.getAttendance().push(newRecord);
    return newRecord;
  }

  markCheckOut(checkOutDto: CheckOutDto, actorId: string) {
    this.assertSelf(checkOutDto.empId, actorId);
    const today = todayKey();
    const record = this.dataStore.getAttendance().find(a => a.emp_id === actorId && a.attendance_date === today);
    if (!record || !record.check_in_time) {
        throw new BadRequestException("You have not checked in today.");
    }
    if (record.check_out_time) {
        throw new ConflictException("You have already checked out today.");
    }

    record.check_out_time = clockTime();

    const [inH, inM] = record.check_in_time.split(':').map(Number);
    const [outH, outM] = record.check_out_time.split(':').map(Number);
    let diffHrs = (outH + outM / 60) - (inH + inM / 60);
    if (!Number.isFinite(diffHrs) || diffHrs < 0) diffHrs = 0;

    record.hours_spent = Math.round(diffHrs * 10) / 10;
    return record;
  }
}
