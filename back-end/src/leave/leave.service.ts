import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/leave.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, getActor, isDateKey, todayKey } from '../common/utils/access-scope.util';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];

@Injectable()
export class LeaveService {
  constructor(private readonly dataStore: MockDataService) {}

  getLeavesForUser(empId: string, actorId: string) {
    assertCanAccessEmployee(this.dataStore, actorId, empId);
    return this.dataStore.getLeaves().filter(l => l.emp_id === empId);
  }

  // HR/Company Admin see their company's leaves, a Team Lead their direct reports'
  // (plus their own) - never another company's.
  getAllLeaves(actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    return this.dataStore.getLeaves().filter(l => visible.has(l.emp_id));
  }

  createLeave(createDto: CreateLeaveDto, actorId: string) {
    if (createDto.empId && createDto.empId !== actorId) {
      throw new ForbiddenException('You can only apply for leave for yourself.');
    }
    const { start_date, end_date } = createDto;
    if (!isDateKey(start_date) || !isDateKey(end_date)) {
      throw new BadRequestException('Dates must be valid calendar dates in YYYY-MM-DD format.');
    }
    if (end_date < start_date) {
      throw new BadRequestException('End date must be on or after the start date.');
    }
    if (!createDto.reason.trim()) {
      throw new BadRequestException('Please give a reason for the leave.');
    }

    // Blocks duplicate submissions and overlapping requests: any pending or approved
    // leave of the same employee that shares at least one day.
    const overlapping = this.dataStore.getLeaves().find(l =>
      l.emp_id === actorId &&
      ACTIVE_STATUSES.includes(l.status) &&
      l.start_date <= end_date && start_date <= l.end_date,
    );
    if (overlapping) {
      throw new ConflictException(`These dates overlap your ${overlapping.status.toLowerCase()} leave ${overlapping.leave_id} (${overlapping.start_date} to ${overlapping.end_date}).`);
    }

    const days = Math.round((Date.parse(end_date) - Date.parse(start_date)) / DAY_MS) + 1;
    const newLeave = {
        leave_id: 'L' + Date.now(),
        emp_id: actorId,
        start_date,
        end_date,
        days: String(days),
        leave_type: createDto.leave_type,
        reason: createDto.reason.trim(),
        status: 'PENDING',
        applied_date: todayKey(),
        approved_date: null,
        approved_by: null,
        reject_reason: null
    };
    this.dataStore.getLeaves().push(newLeave);
    return newLeave;
  }

  updateLeaveStatus(leaveId: string, updateDto: UpdateLeaveStatusDto, actorId: string) {
    const leave = this.dataStore.getLeaves().find(l => l.leave_id === leaveId);
    if (!leave) throw new NotFoundException('Leave not found');

    const actor = getActor(this.dataStore, actorId);
    if (leave.emp_id === actor.emp_id) {
      throw new ForbiddenException('You cannot approve or reject your own leave request.');
    }
    // Team Lead -> own direct reports only; HR/Company Admin -> own company only.
    assertCanAccessEmployee(this.dataStore, actorId, leave.emp_id);

    if (leave.status !== 'PENDING') {
      throw new ConflictException(`This leave request has already been ${String(leave.status).toLowerCase()}.`);
    }

    leave.status = updateDto.status;
    leave.approved_by = actor.emp_id;
    leave.approved_date = todayKey();
    leave.reject_reason = updateDto.status === 'REJECTED' ? (updateDto.reject_reason?.trim() || null) : null;
    return leave;
  }
}
