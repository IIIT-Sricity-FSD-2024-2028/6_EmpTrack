import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateHolidayDto, CreateCompanyEventDto } from './dto/calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly dataStore: MockDataService) {}

  // Resolves the calling employee and cross-checks their role against the
  // Role header, deriving companyId server-side rather than trusting a
  // client-supplied companyId directly. requesterEmpId is still a client-
  // supplied string (same trust class as every existing empId param in this
  // app, e.g. LeaveService.getLeavesForUser) - this is a known, accepted
  // limitation given the app has no real auth (see project plan notes).
  private resolveRequester(requesterEmpId: string, roleHeader?: string) {
    if (!requesterEmpId) throw new ForbiddenException('requesterEmpId is required');
    const employee = this.dataStore.getEmployees().find(e => e.emp_id === requesterEmpId);
    if (!employee) throw new NotFoundException('Requesting employee not found');
    if (roleHeader && employee.role !== roleHeader) {
      throw new ForbiddenException('Role header does not match requesting employee');
    }
    return employee;
  }

  private matchesMonth(dateStr: string, year?: string, month?: string) {
    if (!dateStr) return false;
    if (!year && !month) return true;
    const [y, m] = dateStr.split('-');
    if (year && y !== String(year)) return false;
    if (month && Number(m) !== Number(month)) return false;
    return true;
  }

  private teamMemberIds(managerId: string) {
    return this.dataStore.getEmployees().filter(e => e.manager_id === managerId).map(e => e.emp_id);
  }

  private holidaysFor(companyId: string, year?: string, month?: string) {
    return this.dataStore.getHolidays()
      .filter(h => h.companyId === companyId && this.matchesMonth(h.date, year, month))
      .map(h => ({ id: h.holiday_id, type: 'HOLIDAY', title: h.title, date: h.date, meta: {} }));
  }

  private companyEventsFor(companyId: string, role: string, year?: string, month?: string) {
    return this.dataStore.getCompanyEvents()
      .filter(e => e.companyId === companyId && this.matchesMonth(e.date, year, month))
      .filter(e => !e.visible_to_roles || e.visible_to_roles.includes('ALL') || e.visible_to_roles.includes(role))
      .map(e => ({ id: e.event_id, type: 'COMPANY_EVENT', title: e.title, date: e.date, meta: {} }));
  }

  private leaveEvents(empIds: string[], year?: string, month?: string) {
    return this.dataStore.getLeaves()
      .filter(l => empIds.includes(l.emp_id))
      .filter(l => this.matchesMonth(l.start_date, year, month) || this.matchesMonth(l.end_date, year, month))
      .map(l => ({
        id: l.leave_id,
        type: 'LEAVE',
        title: `${l.leave_type} Leave (${l.status})`,
        date: l.start_date,
        endDate: l.end_date,
        meta: { emp_id: l.emp_id, status: l.status, leave_type: l.leave_type }
      }));
  }

  private taskDeadlineEvents(empIds: string[], year?: string, month?: string) {
    return this.dataStore.getTasks()
      .filter(t => empIds.includes(t.assigned_to))
      .filter(t => this.matchesMonth(t.deadline, year, month))
      .map(t => ({
        id: t.task_id,
        type: 'TASK_DEADLINE',
        title: t.task_title,
        date: t.deadline,
        meta: { emp_id: t.assigned_to, status: t.status, priority: t.priority }
      }));
  }

  getHolidays(requesterEmpId: string, roleHeader: string, year?: string, month?: string) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    return this.holidaysFor(requester.companyId, year, month);
  }

  getCompanyEvents(requesterEmpId: string, roleHeader: string, year?: string, month?: string) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    return this.companyEventsFor(requester.companyId, requester.role, year, month);
  }

  createCompanyEvent(requesterEmpId: string, roleHeader: string, dto: CreateCompanyEventDto) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    const newEvent = {
      event_id: 'CE' + Date.now(),
      companyId: requester.companyId,
      title: dto.title,
      date: dto.date,
      visible_to_roles: dto.visible_to_roles || ['ALL']
    };
    this.dataStore.getCompanyEvents().push(newEvent);
    return newEvent;
  }

  // No target-employee parameter exists here by design: requesterEmpId is
  // both "who's asking" and "whose data", so an EMPLOYEE caller structurally
  // cannot request another employee's events.
  getMyCalendar(requesterEmpId: string, roleHeader: string, year?: string, month?: string) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    return [
      ...this.leaveEvents([requester.emp_id], year, month),
      ...this.taskDeadlineEvents([requester.emp_id], year, month),
      ...this.holidaysFor(requester.companyId, year, month)
    ];
  }

  getTeamCalendar(requesterEmpId: string, roleHeader: string, year?: string, month?: string) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    const teamIds = this.teamMemberIds(requester.emp_id)
      // defense-in-depth: team members should already share companyId by
      // construction, but never trust that implicitly
      .filter(id => this.dataStore.getEmployees().find(e => e.emp_id === id)?.companyId === requester.companyId);

    return [
      ...this.leaveEvents(teamIds, year, month),
      ...this.taskDeadlineEvents(teamIds, year, month),
      ...this.holidaysFor(requester.companyId, year, month),
      ...this.companyEventsFor(requester.companyId, requester.role, year, month)
    ];
  }

  getCompanyCalendar(requesterEmpId: string, roleHeader: string, year?: string, month?: string) {
    const requester = this.resolveRequester(requesterEmpId, roleHeader);
    const companyEmpIds = this.dataStore.getEmployees()
      .filter(e => e.companyId === requester.companyId)
      .map(e => e.emp_id);

    return [
      ...this.leaveEvents(companyEmpIds, year, month),
      ...this.taskDeadlineEvents(companyEmpIds, year, month),
      ...this.holidaysFor(requester.companyId, year, month),
      ...this.companyEventsFor(requester.companyId, requester.role, year, month)
    ];
  }
}
