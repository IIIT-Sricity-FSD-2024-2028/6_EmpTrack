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

// leave_type values -> the labels/badges the leave form uses.
export const LEAVE_TYPES = {
  CASUAL: { label: 'Vacation', badge: 'vacation' },
  SICK: { label: 'Sick Leave', badge: 'sick-leave' },
  UNPAID: { label: 'Personal Leave', badge: 'personal' },
};

// The original pages assume 22 working days per month.
export const WORKING_DAYS_PER_MONTH = 22;
