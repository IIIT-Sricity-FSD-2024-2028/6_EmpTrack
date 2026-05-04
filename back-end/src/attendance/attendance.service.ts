import { Injectable, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { MarkAttendanceDto, CheckOutDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly dataStore: MockDataService) {}

  getAttendanceForUser(empId: string) {
    return this.dataStore.getAttendance().filter(a => a.emp_id === empId);
  }

  markAttendance(markDto: MarkAttendanceDto) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.dataStore.getAttendance().find(a => a.emp_id === markDto.empId && a.attendance_date === today);
    if (existing) {
      throw new BadRequestException("Attendance already marked for today.");
    }
    const newRecord = {
      attendance_id: 'A' + Date.now(),
      emp_id: markDto.empId,
      attendance_date: today,
      attendance_mode: markDto.mode || "OFFICE",
      check_in_time: markDto.checkInTime,
      check_out_time: null,
      screen_time: null,
      status: "PRESENT" 
    };
    this.dataStore.getAttendance().push(newRecord);
    return newRecord;
  }

  markCheckOut(checkOutDto: CheckOutDto) {
    const today = new Date().toISOString().split('T')[0];
    const record = this.dataStore.getAttendance().find(a => a.emp_id === checkOutDto.empId && a.attendance_date === today);
    if (!record || record.check_out_time) {
        throw new BadRequestException("Cannot check out.");
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    record.check_out_time = `${hours}:${minutes}`;

    const [inH, inM] = record.check_in_time.split(':').map(Number);
    const [outH, outM] = record.check_out_time.split(':').map(Number);
    let diffHrs = (outH + outM / 60) - (inH + inM / 60);
    if (diffHrs < 0) diffHrs = 0;

    record.hours_spent = diffHrs.toFixed(1);
    return record;
  }
}
