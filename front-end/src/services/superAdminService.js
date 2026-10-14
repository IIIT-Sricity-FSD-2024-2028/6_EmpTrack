// Super Admin endpoints (converted from the original js/store.js).
// Paths, query parameters and request bodies are unchanged; the backend
// authorizes them by the Role / x-actor-* headers that api.js sends.
import api from './api';

// Original _rangeQuery: an explicit from/to wins over a preset range.
function rangeParams(range, from, to) {
  return { from, to, range: from ? undefined : range };
}

// ---- Analytics / dashboard ----
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getCompanyGrowth = (range, from, to) =>
  api.get('/analytics/company-growth', { params: rangeParams(range, from, to) });
export const getEmployeeGrowth = (range, from, to) =>
  api.get('/analytics/employee-growth', { params: rangeParams(range, from, to) });
export const getSubscriptionDistribution = () => api.get('/analytics/subscription-distribution');
export const getPlatformActivitySummary = (range, from, to) =>
  api.get('/analytics/platform-activity', { params: rangeParams(range, from, to) });

// ---- Activity logs ----
export const getActivityLogs = ({ userId, action, companyId } = {}) =>
  api.get('/activity-logs', { params: { userId, action, companyId } });

// ---- Companies ----
export const getCompanies = ({ platformAdminId, status, search } = {}) =>
  api.get('/companies', { params: { platformAdminId, status, search } });
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.patch(`/companies/${id}`, data);
export const updateCompanyStatus = (id, status) => api.patch(`/companies/${id}/status`, { status });
export const reassignCompanyPlatformAdmin = (id, platform_admin_id) =>
  api.patch(`/companies/${id}/reassign`, { platform_admin_id });
export const createCompanyAdmin = (companyId, data) => api.post(`/companies/${companyId}/admins`, data);

// ---- Platform admins ----
export const getPlatformAdmins = ({ status, search } = {}) =>
  api.get('/platform-admins', { params: { status, search } });
export const getActivePlatformAdminCount = () => api.get('/platform-admins/active-count');
export const getPlatformAdminActivity = (id) => api.get(`/platform-admins/${id}/activity`);
export const createPlatformAdmin = (data) => api.post('/platform-admins', data);
export const updatePlatformAdmin = (id, data) => api.patch(`/platform-admins/${id}`, data);
export const updatePlatformAdminStatus = (id, status) => api.patch(`/platform-admins/${id}/status`, { status });

// ---- Subscription plans ----
export const getSubscriptionPlans = () => api.get('/subscriptions');
export const getCompaniesForPlan = (id) => api.get(`/subscriptions/${id}/companies`);
export const createSubscriptionPlan = (data) => api.post('/subscriptions', data);
export const updateSubscriptionPlan = (id, data) => api.patch(`/subscriptions/${id}`, data);
export const updateSubscriptionPlanStatus = (id, status) => api.patch(`/subscriptions/${id}/status`, { status });

// ---- Revenue ----
export const getRevenueSummary = () => api.get('/revenue/summary');
export const getRevenueByPlan = () => api.get('/revenue/by-plan');
export const getRevenueByCompany = () => api.get('/revenue/by-company');
export const getRevenueByPlatformAdmin = () => api.get('/revenue/by-platform-admin');
export const getRevenueTransactions = ({ companyId, status, platformAdminId, search } = {}) =>
  api.get('/revenue/transactions', { params: { companyId, status, platformAdminId, search } });

// ---- Critical escalations ----
export const getCriticalEscalations = ({ status, priority, companyId } = {}) =>
  api.get('/critical-escalations', { params: { status, priority, companyId } });
export const getCriticalEscalationById = (id) => api.get(`/critical-escalations/${id}`);
export const createCriticalEscalation = (data) => api.post('/critical-escalations', data);
export const updateCriticalEscalationPriority = (id, priority) =>
  api.patch(`/critical-escalations/${id}/priority`, { priority });
export const assignCriticalEscalation = (id, assigned_team) =>
  api.patch(`/critical-escalations/${id}/assign`, { assigned_team });
export const resolveCriticalEscalation = (id, resolution_notes) =>
  api.patch(`/critical-escalations/${id}/resolve`, { resolution_notes });
export const escalateCriticalEscalation = (id, note) => api.patch(`/critical-escalations/${id}/escalate`, { note });
export const addCriticalEscalationComment = (id, message) =>
  api.post(`/critical-escalations/${id}/comments`, { message });

// ---- Platform settings ----
export const getPlatformSettings = () => api.get('/platform-settings');
export const updatePlatformSettings = (data) => api.patch('/platform-settings', data);

// ---- Own account ----
export const updateUserPassword = (empId, currentPassword, newPassword, confirmPassword) =>
  api.patch(`/employees/${empId}/password`, { currentPassword, newPassword, confirmPassword });
