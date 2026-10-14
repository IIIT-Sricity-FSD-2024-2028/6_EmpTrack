// Shared helpers for the HR pages.
import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Base URL of the portal ("/hr"), for in-page links. */
export const HR_BASE = getRoleBasePath(ROLES.HR);

/** Full working day used for the "work progress" percentage (hours / 8). */
export const WORK_DAY_HOURS = 8;

export const ROLE_NAMES = {
  EMPLOYEE: 'Employee',
  TEAMLEAD: 'Team Lead',
  HR: 'HR Manager',
  COMPANY_ADMIN: 'Company Admin',
};

/** Employees and team leads - the people HR tracks attendance / leave for. */
export const isStaff = (e) => e.role === 'EMPLOYEE' || e.role === 'TEAMLEAD';

/** Today as 'YYYY-MM-DD' in UTC (the format the backend stores dates in). */
export const todayKey = () => new Date().toISOString().split('T')[0];

/** True when an approved leave covers the given 'YYYY-MM-DD' date. */
export const isOnLeave = (leaves, empId, date) =>
  leaves.some((l) => l.emp_id === empId && l.status === 'APPROVED' && l.start_date <= date && l.end_date >= date);

/** 'Oct 13, 2026'; '-' when empty. */
export function shortDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Employees who joined in the current calendar month. */
export function joinedThisMonth(e, now = new Date()) {
  if (!e.date_of_joining) return false;
  const d = new Date(e.date_of_joining);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** Distinct, sorted department ids present in a list of employees. */
export const departmentsOf = (employees) => [...new Set(employees.map((e) => e.department_id).filter(Boolean))].sort();

/** Name lookup for ids (falls back to the id). */
export const nameOf = (employees, id) => employees.find((e) => e.emp_id === id)?.emp_name || id || '-';
