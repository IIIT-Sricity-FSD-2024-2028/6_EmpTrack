// Technical Member endpoints (converted from the original js/store.js).
// Paths, query parameters and request bodies are unchanged.
import api from './api';

export const getTechnicalMemberStats = () => api.get('/technical-member/stats');
export const getTechnicalMemberRecentUpdates = (limit = 10) =>
  api.get('/technical-member/recent-updates', { params: { limit } });

/** filters: { status, priority, search, scope: 'active' | 'history' } */
export const getMyTechnicalIssues = ({ status, priority, search, scope } = {}) =>
  api.get('/technical-member/issues', { params: { status, priority, search, scope } });
export const getMyTechnicalIssueById = (id) => api.get(`/technical-member/issues/${id}`);

export const updateMyIssueStatus = (id, status) => api.patch(`/technical-member/issues/${id}/status`, { status });
export const updateMyIssueProgress = (id, progress_percentage, note) =>
  api.patch(`/technical-member/issues/${id}/progress`, { progress_percentage, note });
export const resolveMyIssue = (id, resolution_notes) =>
  api.patch(`/technical-member/issues/${id}/resolve`, { resolution_notes });
export const submitMyIssueForVerification = (id, note) =>
  api.patch(`/technical-member/issues/${id}/submit-verification`, { note });
export const addMyIssueComment = (id, message) => api.post(`/technical-member/issues/${id}/comments`, { message });
export const addMyIssueWorkNote = (id, message) => api.post(`/technical-member/issues/${id}/notes`, { message });

/** attachment: { file_name, file_type, file_size, kind, data_url } */
export const uploadMyIssueAttachment = (id, attachment) =>
  api.post(`/technical-member/issues/${id}/attachments`, attachment);
export const getMyIssueAttachment = (id, attachmentId) =>
  api.get(`/technical-member/issues/${id}/attachments/${attachmentId}`);
export const deleteMyIssueAttachment = (id, attachmentId) =>
  api.delete(`/technical-member/issues/${id}/attachments/${attachmentId}`);

export const updateUserPassword = (empId, currentPassword, newPassword, confirmPassword) =>
  api.patch(`/employees/${empId}/password`, { currentPassword, newPassword, confirmPassword });
