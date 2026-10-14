// Company Admin endpoints (converted from the original js/store.js).
// Paths and request bodies are unchanged; the backend scopes every call to the
// admin's own company via the x-actor-id header.
import api from './api';

export { updateUserPassword } from './employeeService';
export { getNotificationsForUser as getNotifications } from './notificationService';

// ---- employees ----
export const getEmployees = () => api.get('/employees');
/** data: { name, email, phone, password, confirmPassword, department_id, team_id } */
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (empId, data) => api.patch(`/employees/${empId}`, data);
export const deleteEmployee = (empId) => api.delete(`/employees/${empId}`);

// ---- teams ----
export const getTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);
/** data: { name, email, phone, password, confirmPassword } */
export const createTeamLead = (teamId, data) => api.post(`/teams/${teamId}/lead`, data);

// ---- issues raised to the Platform Admin ----
/** data: { title, description, priority, category? } */
export const raiseCompanyIssue = (data) => api.post('/company/tickets', data);

// ---- billing ----
export const getMySubscription = () => api.get('/payments/subscription');
export const getMyPaymentHistory = () => api.get('/payments/history');
/** data: { companyId, subscriptionId } */
export const completeMockPayment = (data) => api.post('/payments/mock/complete', data);
