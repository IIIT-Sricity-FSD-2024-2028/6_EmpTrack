// HR data access. The original HR pages mostly rendered hard-coded demo data;
// these read the same information from the backend endpoints HR is allowed to use
// (the backend scopes employees to the HR user's own company via x-actor-id).
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';
import { getAttendanceForUser } from './attendanceService';

export { updateUserPassword } from './employeeService';
export { getNotificationsForUser as getNotifications } from './notificationService';

export const getEmployees = () => api.get('/employees');
export const getLeaves = () => api.get('/leaves');
/** Pending leaves routed to HR (emergency leaves, Team Lead leaves) in this HR user's company. */
export const getLeaveReviewQueue = () => api.get('/leaves/review-queue');
export const getIssues = () => api.get('/issues');
export const getEscalations = () => api.get('/escalations');

/** status: 'APPROVED' | 'REJECTED' */
export function updateLeaveStatus(leaveId, status, approverId, rejectReason) {
  const body = { status, approved_by_id: approverId };
  if (rejectReason) body.reject_reason = rejectReason;
  return api.patch(`/leaves/${leaveId}/status`, body);
}

export const rejectEscalation = (id) => api.patch(`/escalations/${id}/reject`);
export const generateEscalationReport = (id) => api.post(`/escalations/${id}/report`);

/** Tasks assigned to any of the given employees (GET /tasks is team-lead scoped). */
export async function getTasksFor(employees) {
  const lists = await Promise.all(employees.map((e) => api.get(`/tasks/user/${e.emp_id}`)));
  return lists.flat();
}

/** Attendance records for many employees, each tagged with emp_id. */
export async function getAttendanceFor(employees) {
  const lists = await Promise.all(employees.map((e) => getAttendanceForUser(e.emp_id)));
  return lists.flatMap((list, i) => list.map((a) => ({ ...a, emp_id: a.emp_id || employees[i].emp_id })));
}

// ---- settings (no backend endpoint: kept in this browser) ----
const SETTINGS_KEY = 'empTrack_hr_settings';

export const DEFAULT_HR_SETTINGS = {
  general: { companyName: 'EmpTrack Inc.', hoursPerDay: 8, daysPerWeek: 5 },
  attendance: { minProgress: 70, lateThreshold: 15, autoMark: true, dailySummary: true },
  notifications: { taskAssignments: true, issueEscalations: true, leaveRequests: true, weeklyPerformance: false },
  email: { smtpServer: 'smtp.mailtrap.io', smtpPort: 2525, fromEmail: 'no-reply@emptrack.com', fromName: 'EmpTrack System' },
  security: { twoFactor: false, sessionTimeout: true, minLength: true, mixedCase: true, number: true, special: false },
};

export function getHrSettings() {
  const saved = readStorage(SETTINGS_KEY, {});
  return Object.fromEntries(Object.entries(DEFAULT_HR_SETTINGS).map(([k, v]) => [k, { ...v, ...saved[k] }]));
}

export function saveHrSettings(section, values) {
  const saved = readStorage(SETTINGS_KEY, {});
  writeStorage(SETTINGS_KEY, { ...saved, [section]: values });
}
