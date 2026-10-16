import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Absolute URL of an employee page: empPath('tasks') -> /employee/tasks */
export const empPath = (page) => `${getRoleBasePath(ROLES.EMPLOYEE)}/${page}`;

// Status -> badge mappings used by the employee pages (same rules as the
// original js/views/employee/*.js files).

export function taskBadge(status = '') {
  const s = status.toUpperCase();
  if (s === 'IN PROGRESS' || s === 'IN_PROGRESS') return 'in-progress';
  if (s === 'COMPLETED') return 'completed';
  return 'not-started';
}

export function issuePriorityBadge(priority) {
  if (priority === 'High') return 'high';
  if (priority === 'Medium') return 'medium';
  return 'low';
}

export function issueStatusBadge(status) {
  if (status === 'In Progress') return 'in-progress';
  if (status === 'Resolved') return 'completed';
  return 'open';
}

export function leaveStatusBadge(status) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

// Yearly leave allowance shown on the Leave Request page. The backend has no leave
// policy/balance endpoint yet, so this is the page's own figure (the value the
// original page displayed); used/pending/remaining are computed from real records.
export const ANNUAL_LEAVE_ALLOWANCE = 24;

/**
 * Leave balance for `year` from the employee's leave records.
 * used = APPROVED days, pending = PENDING days; REJECTED requests count for nothing,
 * and a pending request never reduces the remaining balance until it is approved.
 */
export function leaveBalance(leaves = [], year = new Date().getFullYear(), allowance = ANNUAL_LEAVE_ALLOWANCE) {
  const daysOf = (status) =>
    leaves
      .filter((l) => l.status === status && String(l.start_date || '').startsWith(`${year}-`))
      .reduce((sum, l) => sum + (Number(l.days) > 0 ? Number(l.days) : 0), 0);
  const used = daysOf('APPROVED');
  const pending = daysOf('PENDING');
  return { total: allowance, used, pending, remaining: Math.max(0, allowance - used) };
}

/**
 * Profile performance cards from the employee's own tasks, attendance and work logs.
 * Attendance rate counts working days only (weekends/holidays are not opportunities).
 */
export function performanceFrom({ tasks = [], attendance = [], worklogs = [] } = {}) {
  const statusOf = (t) => String(t.status || '').toUpperCase().replace(' ', '_');
  const completed = tasks.filter((t) => statusOf(t) === 'COMPLETED').length;
  const active = tasks.filter((t) => statusOf(t) === 'IN_PROGRESS').length;
  const workdays = attendance.filter((a) => a.status !== 'WEEKEND' && a.status !== 'HOLIDAY');
  const present = workdays.filter((a) => a.status === 'PRESENT').length;
  const hours = worklogs.reduce((sum, w) => sum + (Number(w.hours_spent) || 0), 0);
  return [
    { label: 'Tasks Completed', value: String(completed) },
    { label: 'Tasks In Progress', value: String(active) },
    { label: 'Attendance Rate', value: workdays.length ? `${Math.round((present / workdays.length) * 100)}%` : 'N/A' },
    { label: 'Hours Logged', value: String(Math.round(hours * 10) / 10) },
  ];
}

// leave_type values -> the labels/badges the leave form uses.
export const LEAVE_TYPES = {
  CASUAL: { label: 'Vacation', badge: 'vacation' },
  SICK: { label: 'Sick Leave', badge: 'sick-leave' },
  UNPAID: { label: 'Personal Leave', badge: 'personal' },
  EMERGENCY: { label: 'Emergency Leave', badge: 'emergency' },
};

// Emergency leave is reviewed by HR, every other type by the employee's Team Lead.
// The backend applies this rule itself; the form only uses it to tell the employee.
export const EMERGENCY_LEAVE = 'EMERGENCY';
export const leaveReviewer = (leaveType) => (leaveType === EMERGENCY_LEAVE ? 'HR' : 'your Team Lead');

// The original pages assume 22 working days per month.
export const WORKING_DAYS_PER_MONTH = 22;
