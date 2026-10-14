// Support Member data access (converted from the original js/store.js).
//
// Calls the backend's /support-member/* endpoints when VITE_API_URL is set,
// otherwise the in-browser demo (platformDemoBackend.js). The backend scopes
// every request to the caller's Platform Admin via the x-actor-id header.
import api from './api';
import { demo } from './platformDemoBackend';
import { IS_DEMO } from './platformAdminService';

export { IS_DEMO, changePassword, getNotifications } from './platformAdminService';

const base = (id) => `/support-member/tickets/${id}`;

export function getStats() {
  return IS_DEMO ? demo.supportStats() : api.get('/support-member/stats');
}

export function getCategories() {
  return IS_DEMO ? demo.categories() : api.get('/support-member/categories');
}

/**
 * filters: { assignedTo: 'me' | 'unassigned', status, priority, category, search, escalatedOnly }
 * 'all' values are accepted and ignored by the backend.
 */
export function getTickets(filters = {}) {
  if (IS_DEMO) return demo.smTickets(filters);
  const { escalatedOnly, ...rest } = filters;
  return api.get('/support-member/tickets', { params: { ...rest, escalatedOnly: escalatedOnly ? 'true' : undefined } });
}

export function getTicket(id) {
  return IS_DEMO ? demo.smTicket(id) : api.get(base(id));
}

export function claimTicket(id) {
  return IS_DEMO ? demo.claim(id) : api.patch(`${base(id)}/claim`);
}

export function changeStatus(id, status) {
  return IS_DEMO ? demo.changeStatus(id, status) : api.patch(`${base(id)}/status`, { status });
}

/** priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' */
export function changePriority(id, priority) {
  return IS_DEMO ? demo.changePriority(id, priority) : api.patch(`${base(id)}/priority`, { priority });
}

export function changeCategory(id, category) {
  return IS_DEMO ? demo.changeCategory(id, category) : api.patch(`${base(id)}/category`, { category });
}

export function resolveTicket(id, resolutionNotes) {
  return IS_DEMO ? demo.smResolve(id, resolutionNotes) : api.patch(`${base(id)}/resolve`, { resolution_notes: resolutionNotes });
}

export function reopenTicket(id, reason) {
  return IS_DEMO ? demo.reopen(id, reason) : api.patch(`${base(id)}/reopen`, { reason });
}

export function closeTicket(id) {
  return IS_DEMO ? demo.close(id) : api.patch(`${base(id)}/close`);
}

/** Customer-facing reply (visible to the Company Admin). */
export function addMessage(id, message) {
  return IS_DEMO ? demo.smComment(id, message) : api.post(`${base(id)}/comments`, { message });
}

/** Internal note - never visible to the Company Admin. */
export function addInternalNote(id, message) {
  return IS_DEMO ? demo.addInternalNote(id, message) : api.post(`${base(id)}/internal-notes`, { message });
}

/** Creates a linked technical issue for the Platform Admin's Technical Team. */
export function escalateToTechnicalTeam(id, note) {
  return IS_DEMO ? demo.escalateToTechnical(id, note) : api.patch(`${base(id)}/escalate-technical`, { note });
}

export function escalateToPlatformAdmin(id, note) {
  return IS_DEMO ? demo.escalateToPlatformAdmin(id, note) : api.patch(`${base(id)}/escalate-platform-admin`, { note });
}

export function getLinkedTechnicalTicket(id) {
  return IS_DEMO ? demo.linkedTechnicalTicket(id) : api.get(`/support-member/technical-issues/${id}`);
}

export function getCompanySummary(companyId) {
  return IS_DEMO ? demo.companySummary(companyId) : api.get(`/support-member/companies/${companyId}`);
}
