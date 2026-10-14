// Platform Admin data access (converted from the original js/store.js).
//
// With VITE_API_URL set, every call goes to the backend endpoint the original
// platform_admin pages used. With it empty (the default; same rule as mock login
// in authService) calls go to the in-browser demo (platformDemoBackend.js), which
// follows the same service rules but only saves to this browser.
import config from '../config/config';
import api from './api';
import { updateUserPassword } from './employeeService';
import { getNotificationsForUser } from './notificationService';
import { demo } from './platformDemoBackend';

export const IS_DEMO = !config.apiUrl;
const DEMO_PASSWORD = 'Password@123'; // authService mock password

// Ticket type -> backend resource. Support tickets and technical issues share
// one workflow; only the path (and the technical verification step) differ.
const TICKET_PATHS = { SUPPORT: '/support-tickets', TECHNICAL: '/technical-issues' };
const TEAM_PATHS = { SUPPORT_MEMBER: '/support-team', TECHNICAL_MEMBER: '/technical-team' };

// ---- dashboard ----
export function getDashboardSummary() {
  return IS_DEMO ? demo.dashboardSummary() : api.get('/platform-dashboard/summary');
}

// ---- companies ----
/** Companies assigned to this Platform Admin (the backend scopes by x-actor-id). */
export function getMyCompanies() {
  return IS_DEMO ? demo.companies() : api.get('/companies');
}

/** data: { name, email, phone, password, confirmPassword, status } */
export function createCompanyAdmin(companyId, data) {
  return IS_DEMO ? demo.createCompanyAdmin(companyId, data) : api.post(`/companies/${companyId}/admins`, data);
}

// ---- payments ----
export function getPayments(filters = {}) {
  return IS_DEMO ? demo.payments(filters) : api.get('/payments/platform-admin', { params: filters });
}

export function getPaymentSummary() {
  return IS_DEMO ? demo.paymentSummary() : api.get('/payments/platform-admin/summary');
}

// ---- teams (role: 'SUPPORT_MEMBER' | 'TECHNICAL_MEMBER') ----
export function getTeam(role, filters = {}) {
  return IS_DEMO ? demo.teamList(role, filters) : api.get(TEAM_PATHS[role], { params: filters });
}

/** data: { name, email, phone, specialization } */
export function createTeamMember(role, data) {
  return IS_DEMO ? demo.teamCreate(role, data) : api.post(TEAM_PATHS[role], data);
}

export function updateTeamMember(role, id, data) {
  return IS_DEMO ? demo.teamUpdate(role, id, data) : api.patch(`${TEAM_PATHS[role]}/${id}`, data);
}

/** status: 'ACTIVE' | 'INACTIVE' */
export function updateTeamMemberStatus(role, id, status) {
  return IS_DEMO ? demo.teamUpdateStatus(role, id, status) : api.patch(`${TEAM_PATHS[role]}/${id}/status`, { status });
}

/** { technical: [...members], support: [...members] } */
export function getTeamWorkload() {
  return IS_DEMO ? demo.workload() : api.get('/platform-team/workload');
}

// ---- tickets (type: 'SUPPORT' | 'TECHNICAL') ----
export function getTickets(type, filters = {}) {
  return IS_DEMO ? demo.paTickets(type, filters) : api.get(TICKET_PATHS[type], { params: filters });
}

export function getTicket(type, id) {
  return IS_DEMO ? demo.paTicket(type, id) : api.get(`${TICKET_PATHS[type]}/${id}`);
}

export function assignTicket(type, id, assignedTo) {
  return IS_DEMO ? demo.assign(type, id, assignedTo) : api.patch(`${TICKET_PATHS[type]}/${id}/assign`, { assigned_to: assignedTo });
}

export function reassignTicket(type, id, assignedTo, reason) {
  return IS_DEMO
    ? demo.reassign(type, id, assignedTo, reason)
    : api.patch(`${TICKET_PATHS[type]}/${id}/reassign`, { assigned_to: assignedTo, reason });
}

export function resolveTicket(type, id, resolutionNotes) {
  return IS_DEMO
    ? demo.paResolve(type, id, resolutionNotes)
    : api.patch(`${TICKET_PATHS[type]}/${id}/resolve`, { resolution_notes: resolutionNotes });
}

/** Escalates to the Super Admin (opens a critical escalation). */
export function escalateTicket(type, id, note) {
  return IS_DEMO ? demo.escalateToSuperAdmin(type, id, note) : api.patch(`${TICKET_PATHS[type]}/${id}/escalate`, { note });
}

export function addTicketComment(type, id, message) {
  return IS_DEMO ? demo.paComment(type, id, message) : api.post(`${TICKET_PATHS[type]}/${id}/comments`, { message });
}

/** Signs off a technical issue the Technical Member submitted for verification (closes it). */
export function verifyTechnicalIssue(id, note) {
  return IS_DEMO ? demo.verifyResolution(id, note) : api.patch(`/technical-issues/${id}/verify`, { note });
}

/** Returns a technical issue to the Technical Member for rework. */
export function rejectTechnicalIssueVerification(id, reason) {
  return IS_DEMO ? demo.rejectResolution(id, reason) : api.patch(`/technical-issues/${id}/reject-verification`, { reason });
}

// ---- notifications / account (shared with the Support Member portal) ----
export function getNotifications(empId) {
  return IS_DEMO ? demo.notificationsFor(empId) : getNotificationsForUser(empId);
}

/** Resolves { saved: boolean }; in demo mode the password is checked but cannot be changed. */
export async function changePassword(empId, currentPassword, newPassword, confirmPassword) {
  if (!IS_DEMO) {
    await updateUserPassword(empId, currentPassword, newPassword, confirmPassword);
    return { saved: true };
  }
  if (currentPassword !== DEMO_PASSWORD) throw new Error('Current password is incorrect.');
  return { saved: false };
}
