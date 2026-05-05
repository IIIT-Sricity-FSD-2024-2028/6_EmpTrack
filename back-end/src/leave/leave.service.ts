import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly dataStore: MockDataService) {}

  getLeavesForUser(empId: string) {
    return this.dataStore.getLeaves().filter(l => l.emp_id === empId);
  }

  getAllLeaves() {
    return this.dataStore.getLeaves();
  }

  createLeave(createDto: CreateLeaveDto) {
    const newLeave = {
        leave_id: 'L' + Date.now(),
        emp_id: createDto.empId,
        start_date: createDto.start_date,
        end_date: createDto.end_date,
        days: createDto.days,
        leave_type: createDto.leave_type,
        reason: createDto.reason,
        status: 'PENDING',
        applied_date: new Date().toISOString().split('T')[0],
        approved_date: null,
        approved_by: null,
        reject_reason: null
    };
    this.dataStore.getLeaves().push(newLeave);
    return newLeave;
  }

  updateLeaveStatus(leaveId: string, updateDto: UpdateLeaveStatusDto) {
    const leave = this.dataStore.getLeaves().find(l => l.leave_id === leaveId);
    if (!leave) throw new NotFoundException('Leave not found');
    
    leave.status = updateDto.status;
    leave.approved_by = updateDto.approved_by_id;
    leave.approved_date = new Date().toISOString().split('T')[0];
    if (updateDto.reject_reason) {
        leave.reject_reason = updateDto.reject_reason;
    }
    return leave;
  }
}

