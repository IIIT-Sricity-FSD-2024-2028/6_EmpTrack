import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { NotificationService } from '../notification/notification.service';
import { CreateLeaveDto, EMERGENCY_LEAVE, UpdateLeaveStatusDto } from './dto/leave.dto';
import { Actor, accessibleEmployeeIds, assertCanAccessEmployee, canAccessEmployee, getActor, isDateKey, todayKey } from '../common/utils/access-scope.util';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = ['PENDING', 'APPROVED'];
const TYPE_LABELS: Record<string, string> = { CASUAL: 'casual', SICK: 'sick', UNPAID: 'personal', EMERGENCY: 'emergency' };

// Who reviews a leave request. HR is a company-wide queue (approver_id null - any
// active HR of the applicant's company may decide); a Team Lead route names the one
// Team Lead who may decide.
type Route = { routed_to: 'HR' | 'TEAMLEAD'; approver_id: string | null };

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly dataStore: MockDataService,
    private readonly notificationService: NotificationService,
  ) {}

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

  // Pending requests the caller may decide right now: HR -> the company's HR queue
  // (emergency leaves, and Team Lead / Company Admin leaves); Team Lead -> ordinary
  // leaves routed to them. Same rule as updateLeaveStatus.
  getReviewQueue(actorId: string) {
    const actor = getActor(this.dataStore, actorId);
    return this.dataStore.getLeaves().filter(l => l.status === 'PENDING' && this.canDecide(actor, l));
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

    // Resolved before anything is stored, so a request is never saved without a reviewer.
    const applicant = getActor(this.dataStore, actorId);
    const route = this.resolveRoute(applicant, createDto.leave_type);

    const days = Math.round((Date.parse(end_date) - Date.parse(start_date)) / DAY_MS) + 1;
    const newLeave = {
        leave_id: 'L' + Date.now(),
        emp_id: actorId,
        start_date,
        end_date,
        days: String(days),
        leave_type: createDto.leave_type,
        reason: createDto.reason.trim(),
        routed_to: route.routed_to,
        approver_id: route.approver_id,
        status: 'PENDING',
        applied_date: todayKey(),
        approved_date: null,
        approved_by: null,
        reject_reason: null
    };
    this.dataStore.getLeaves().push(newLeave);

    const label = TYPE_LABELS[newLeave.leave_type] || newLeave.leave_type.toLowerCase();
    const reviewers = route.routed_to === 'HR' ? this.hrReviewers(applicant).map(h => h.emp_id) : [route.approver_id];
    for (const reviewer of reviewers) {
      this.notify({
        employee_id: reviewer,
        message: `${applicant.emp_name} requested ${label} leave (${start_date} to ${end_date}) - awaiting your review.`,
        type: newLeave.leave_type === EMERGENCY_LEAVE ? 'warning' : 'info',
        link: route.routed_to === 'HR' ? '/hr/dashboard' : '/teamlead/leave',
      }, applicant.emp_id);
    }
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

    // Only the reviewer the request was routed to may decide it.
    if (!this.canDecide(actor, leave)) {
      const route = this.routeOf(leave);
      throw new ForbiddenException(
        route.routed_to === 'HR'
          ? (leave.leave_type === EMERGENCY_LEAVE ? 'Emergency leave requests can only be reviewed by HR.' : 'This leave request can only be reviewed by HR.')
          : 'Only the assigned Team Lead can review this leave request.',
      );
    }

    leave.status = updateDto.status;
    leave.approved_by = actor.emp_id;
    leave.approved_date = todayKey();
    leave.reject_reason = updateDto.status === 'REJECTED' ? (updateDto.reject_reason?.trim() || null) : null;

    const outcome = leave.status === 'APPROVED' ? 'approved' : 'rejected';
    this.notify({
      employee_id: leave.emp_id,
      message: `Your leave request ${leave.leave_id} (${leave.start_date} to ${leave.end_date}) was ${outcome} by ${actor.emp_name}.` +
        (leave.reject_reason ? ` Reason: ${leave.reject_reason}` : ''),
      type: leave.status === 'APPROVED' ? 'success' : 'warning',
      link: '/employee/leave-request',
    }, actor.emp_id);
    return leave;
  }

  // Emergency leave -> the company's HR queue. Anything else -> the applicant's Team
  // Lead (manager_id). Team Leads and Company Admins have no Team Lead above them, so
  // all of their leaves go to HR. Never falls back to a different role: with no
  // eligible reviewer the request is refused.
  private resolveRoute(applicant: Actor, leaveType: string): Route {
    if (leaveType === EMERGENCY_LEAVE || applicant.role !== 'EMPLOYEE') {
      if (this.hrReviewers(applicant).length === 0) {
        throw new UnprocessableEntityException('No active HR reviewer is available in your company to review this request. Please contact your Company Admin.');
      }
      return { routed_to: 'HR', approver_id: null };
    }
    const lead = this.dataStore.getEmployees().find(e => e.emp_id === applicant.manager_id);
    if (!lead || lead.role !== 'TEAMLEAD' || lead.status !== 'ACTIVE' || lead.companyId !== applicant.companyId) {
      throw new UnprocessableEntityException('You have no active Team Lead assigned, so this request cannot be routed. Please contact HR to get a Team Lead assigned.');
    }
    return { routed_to: 'TEAMLEAD', approver_id: lead.emp_id };
  }

  // Records saved before routing existed carry no routed_to; derive it the same way
  // resolveRoute would, from the leave type and the applicant's role / Team Lead.
  private routeOf(leave: any): Route {
    if (leave.routed_to) return { routed_to: leave.routed_to, approver_id: leave.approver_id ?? null };
    const applicant = this.dataStore.getEmployees().find(e => e.emp_id === leave.emp_id);
    if (leave.leave_type === EMERGENCY_LEAVE || applicant?.role !== 'EMPLOYEE') return { routed_to: 'HR', approver_id: null };
    return { routed_to: 'TEAMLEAD', approver_id: applicant?.manager_id ?? null };
  }

  private canDecide(actor: Actor, leave: any): boolean {
    if (leave.emp_id === actor.emp_id) return false;
    const applicant = this.dataStore.getEmployees().find(e => e.emp_id === leave.emp_id);
    if (!canAccessEmployee(actor, applicant)) return false;
    const route = this.routeOf(leave);
    if (route.routed_to === 'HR') return actor.role === 'HR';
    return actor.role === 'TEAMLEAD' && actor.emp_id === route.approver_id;
  }

  private hrReviewers(applicant: Actor) {
    return this.dataStore.getEmployees().filter(e =>
      e.role === 'HR' && e.status === 'ACTIVE' && e.companyId === applicant.companyId && e.emp_id !== applicant.emp_id,
    );
  }

  // The leave change is already stored; a failed notification must not turn it into an
  // error response (the client would retry and hit the overlap check).
  private notify(payload: { employee_id: string; message: string; type: string; link: string }, sentBy: string) {
    try {
      this.notificationService.createNotification(payload, sentBy);
    } catch (err) {
      this.logger.warn(`Leave notification to ${payload.employee_id} failed: ${err}`);
    }
  }
}
