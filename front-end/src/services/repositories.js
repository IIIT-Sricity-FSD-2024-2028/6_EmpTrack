// One repository per backend resource. Each wraps the existing service module
// (which already talks to the backend through the shared api.js client: bearer
// token, JSON, ApiError) and exposes only operations the backend supports.
// Functions resolve the service export at call time, so tests can vi.mock a
// service with just the functions they need.
// "(demo-aware)": goes through teamLeadService, which calls the same endpoint, or its
// in-browser demo dataset when VITE_API_URL is empty (existing Team Lead demo mode).
import * as attendance from './attendanceService';
import * as company from './companyAdminService';
import * as employee from './employeeService';
import * as hr from './hrService';
import * as issue from './issueService';
import * as leave from './leaveService';
import * as notification from './notificationService';
import * as pa from './platformAdminService';
import * as sa from './superAdminService';
import * as sm from './supportMemberService';
import * as tm from './technicalMemberService';
import * as task from './taskService';
import * as teamLead from './teamLeadService';
import * as worklog from './worklogService';
import api from './api';

// /employees  (no backend endpoint lists employees by team for HR; scoping is server-side)
export const employeeRepository = {
  getAll: () => company.getEmployees(), // GET /employees
  getTeam: () => teamLead.getTeamMembers(), // GET /employees (scoped to the team lead's reports server-side)
  getById: (empId) => employee.getUserById(empId), // GET /employees/:id
  create: (data) => company.createEmployee(data), // POST /employees
  update: ({ empId, data }) => company.updateEmployee(empId, data), // PATCH /employees/:id
  delete: (empId) => company.deleteEmployee(empId), // DELETE /employees/:id
  // Support/technical team members are employee accounts (emp_id); role picks /support-team or /technical-team.
  getPlatformTeam: ({ role, filters }) => pa.getTeam(role, filters), // GET /<team>?status=&search= (demo-aware)
  createPlatformMember: ({ role, data }) => pa.createTeamMember(role, data), // POST /<team>
  updatePlatformMember: ({ role, id, data }) => pa.updateTeamMember(role, id, data), // PATCH /<team>/:id
  updatePlatformMemberStatus: ({ role, id, status }) => pa.updateTeamMemberStatus(role, id, status), // PATCH /<team>/:id/status
  // Platform Admins are employee accounts too (Super Admin only).
  getPlatformAdmins: (filters) => sa.getPlatformAdmins(filters), // GET /platform-admins?status=&search=
  createPlatformAdmin: (data) => sa.createPlatformAdmin(data), // POST /platform-admins -> { platformAdmin }
  updatePlatformAdmin: ({ id, data }) => sa.updatePlatformAdmin(id, data), // PATCH /platform-admins/:id
  updatePlatformAdminStatus: ({ id, status }) => sa.updatePlatformAdminStatus(id, status), // PATCH /platform-admins/:id/status
  // Demo-aware password changes: PATCH /employees/:id/password with a backend; in demo
  // mode they only verify the current password. Both resolve { saved: boolean }.
  changePasswordPlatform: ({ empId, currentPassword, newPassword, confirmPassword }) =>
    pa.changePassword(empId, currentPassword, newPassword, confirmPassword), // Platform Admin + Support Member
  changePasswordTeamLead: ({ empId, currentPassword, newPassword, confirmPassword }) =>
    teamLead.changePassword(empId, currentPassword, newPassword, confirmPassword),
  updatePassword: ({ empId, currentPassword, newPassword, confirmPassword }) =>
    employee.updateUserPassword(empId, currentPassword, newPassword, confirmPassword), // PATCH /employees/:id/password
};

// /tasks
export const taskRepository = {
  getForTeam: (tlId) => teamLead.getTeamTasks(tlId), // GET /tasks?managerId= (+ hours from work logs)
  getForUser: (empId) => task.getTasksForUser(empId), // GET /tasks/user/:empId
  // No company-wide endpoint for HR: one GET /tasks/user/:empId per id (hrService.getTasksFor).
  getForUsers: (empIds) => hr.getTasksFor(empIds.map((emp_id) => ({ emp_id }))),
  create: (data) => teamLead.createTask(data), // POST /tasks
  updateProgress: ({ taskId, status, progress }) => task.updateTaskStatus(taskId, status, progress), // PATCH /tasks/:id (assignee)
  update: ({ taskId, changes }) => teamLead.updateTask(taskId, changes), // PATCH /tasks/:id (team lead)
  delete: (taskId) => teamLead.deleteTask(taskId), // DELETE /tasks/:id
  // No backend endpoint (UpdateTaskDto has no assigned_to): rejects unless in demo mode.
  reassign: ({ taskId, empId }) => teamLead.reassignTask(taskId, empId),
};

// /attendance (no update/delete endpoints)
export const attendanceRepository = {
  getForUser: (empId) => attendance.getAttendanceForUser(empId), // GET /attendance/user/:empId
  // No company-wide endpoint: one GET /attendance/user/:empId per id, records tagged with emp_id.
  getForUsers: (empIds) => hr.getAttendanceFor(empIds.map((emp_id) => ({ emp_id }))),
  getForTeam: (empIds) => teamLead.getTeamAttendance(empIds.map((emp_id) => ({ emp_id }))), // (demo-aware)
  checkIn: ({ empId, checkInTime, mode }) => attendance.markAttendance(empId, checkInTime, mode), // POST /attendance/check-in
  checkOut: (empId) => attendance.markCheckOut(empId), // POST /attendance/check-out
};

// /leaves (no delete endpoint)
export const leaveRepository = {
  getAll: () => hr.getLeaves(), // GET /leaves
  getReviewQueue: () => hr.getLeaveReviewQueue(), // GET /leaves/review-queue
  getForUser: (empId) => leave.getLeavesForUser(empId), // GET /leaves/user/:empId
  getForTeam: (empIds) => teamLead.getTeamLeaves(empIds), // GET /leaves, kept to the given team members
  create: (data) => leave.createLeave(data), // POST /leaves
  updateStatus: ({ leaveId, status, approverId, rejectReason }) =>
    hr.updateLeaveStatus(leaveId, status, approverId, rejectReason), // PATCH /leaves/:id/status
  updateTeamStatus: ({ leaveId, status, approverId, rejectReason }) =>
    teamLead.updateLeaveStatus(leaveId, status, approverId, rejectReason), // PATCH /leaves/:id/status (demo-aware)
};

// /worklogs (no update/delete endpoints)
export const workLogRepository = {
  getForUser: (empId) => worklog.getWorkLogsForUser(empId), // GET /worklogs/user/:empId
  create: (data) => worklog.createWorkLog(data), // POST /worklogs
};

// /worklogs/timer/*
export const workSessionRepository = {
  getActive: () => worklog.getActiveWorkSession(), // GET /worklogs/timer/active
  start: (taskId) => worklog.startWorkSession(taskId), // POST /worklogs/timer/start
  stop: (sessionId) => worklog.stopWorkSession(sessionId), // POST /worklogs/timer/:id/stop
  confirm: ({ sessionId, description }) => worklog.confirmWorkSession(sessionId, description), // POST /worklogs/timer/:id/confirm
};

// /notifications (read-only for clients except POST)
export const notificationRepository = {
  getForUser: (empId) => notification.getNotificationsForUser(empId), // GET /notifications/user/:empId
  getForTeamLead: (empId) => teamLead.getNotifications(empId), // (demo-aware)
  getForPlatform: (empId) => pa.getNotifications(empId), // GET /notifications/user/:empId; platform demo-aware
  create: ({ empId, message, type }) => teamLead.sendNotification(empId, message, type), // POST /notifications
};

// /issues (no delete endpoint)
export const issueRepository = {
  getAll: () => hr.getIssues(), // GET /issues
  getForUser: (empId) => issue.getIssuesForUser(empId), // GET /issues/user/:empId
  create: (data) => issue.createIssue(data), // POST /issues
  update: ({ issueId, data }) => api.patch(`/issues/${issueId}`, data), // PATCH /issues/:id
  getForTeam: () => teamLead.getIssues(), // GET /issues (demo-aware)
  updateForTeam: ({ issueId, changes }) => teamLead.updateIssue(issueId, changes), // PATCH /issues/:id (demo-aware)
};

// /teams
export const teamRepository = {
  getAll: () => company.getTeams(), // GET /teams
  getForTeamLead: () => teamLead.getTeams(), // GET /teams (demo-aware)
  create: (data) => company.createTeam(data), // POST /teams
  assignLead: ({ teamId, data }) => company.createTeamLead(teamId, data), // POST /teams/:id/lead
};

// /escalations
const withEscalationId = (e) => ({ escalation_id: e.id, ...e });
export const escalationRepository = {
  getAll: () => hr.getEscalations(), // GET /escalations
  // GET /escalations/mine, reshaped by teamLeadService ({ id, title, ... }); id copied to escalation_id.
  getMine: async () => (await teamLead.getHrEscalations()).map(withEscalationId),
  escalateToHr: async ({ escalation, actorId }) => withEscalationId(await teamLead.escalateToHr(escalation, actorId)), // POST /escalations
  reject: (id) => hr.rejectEscalation(id), // PATCH /escalations/:id/reject
  generateReport: (id) => hr.generateEscalationReport(id), // POST /escalations/:id/report
};

// ---- Platform Admin (platformAdminService: backend, or its in-browser demo when VITE_API_URL is empty) ----

// /companies (scoped server-side to the caller's assigned companies)
export const companyRepository = {
  getMine: () => pa.getMyCompanies(), // GET /companies
  createAdmin: ({ companyId, data }) => pa.createCompanyAdmin(companyId, data), // POST /companies/:id/admins
  // Super Admin (platform-wide; no demo mode):
  getAll: (filters) => sa.getCompanies(filters), // GET /companies?platformAdminId=&status=&search=
  getForPlan: (planId) => sa.getCompaniesForPlan(planId), // GET /subscriptions/:id/companies
  create: (data) => sa.createCompany(data), // POST /companies -> { company }
  update: ({ id, data }) => sa.updateCompany(id, data), // PATCH /companies/:id
  updateStatus: ({ id, status }) => sa.updateCompanyStatus(id, status), // PATCH /companies/:id/status
  reassign: ({ id, platformAdminId }) => sa.reassignCompanyPlatformAdmin(id, platformAdminId), // PATCH /companies/:id/reassign
  createAdminAsSuperAdmin: ({ companyId, data }) => sa.createCompanyAdmin(companyId, data), // POST /companies/:id/admins
  // Support Member: a limited company summary (no contact/billing details), scoped server-side.
  getSupportSummary: (companyId) => sm.getCompanySummary(companyId), // GET /support-member/companies/:id
};

// /payments/platform-admin (read-only for Platform Admins)
export const paymentRepository = {
  getForPlatformAdmin: (filters) => pa.getPayments(filters), // GET /payments/platform-admin?companyId=&status=&search=
  getSummary: () => pa.getPaymentSummary(), // GET /payments/platform-admin/summary
  getRevenueTransactions: (filters) => sa.getRevenueTransactions(filters), // GET /revenue/transactions (Super Admin)
  // Company Admin billing (scoped server-side to the admin's own company)
  getMySubscription: () => company.getMySubscription(), // GET /payments/subscription (billing status, not a plan record)
  getMyHistory: () => company.getMyPaymentHistory(), // GET /payments/history
  completeMockPayment: (data) => company.completeMockPayment(data), // POST /payments/mock/complete -> receipt
};

// /support-tickets and /technical-issues share one workflow and one ticket_id space; `type` picks the path.
export const ticketRepository = {
  getAll: ({ type, filters }) => pa.getTickets(type, filters), // GET /<tickets>?status=&priority=
  getById: ({ type, id }) => pa.getTicket(type, id), // GET /<tickets>/:id
  assign: ({ type, id, assignedTo }) => pa.assignTicket(type, id, assignedTo), // PATCH /<tickets>/:id/assign
  reassign: ({ type, id, assignedTo, reason }) => pa.reassignTicket(type, id, assignedTo, reason), // PATCH /<tickets>/:id/reassign
  resolve: ({ type, id, notes }) => pa.resolveTicket(type, id, notes), // PATCH /<tickets>/:id/resolve
  escalate: ({ type, id, note }) => pa.escalateTicket(type, id, note), // PATCH /<tickets>/:id/escalate
  comment: ({ type, id, message }) => pa.addTicketComment(type, id, message), // POST /<tickets>/:id/comments
  verify: ({ id, note }) => pa.verifyTechnicalIssue(id, note), // PATCH /technical-issues/:id/verify
  rejectVerification: ({ id, reason }) => pa.rejectTechnicalIssueVerification(id, reason), // PATCH /technical-issues/:id/reject-verification
  // Support Member (supportMemberService, demo-aware): the same SUPPORT tickets through /support-member/tickets,
  // scoped server-side to the member's Platform Admin.
  getSupportQueue: (filters) => sm.getTickets(filters), // GET /support-member/tickets?assignedTo=&status=&priority=&category=&search=&escalatedOnly=
  getSupportById: (id) => sm.getTicket(id), // GET /support-member/tickets/:id
  getSupportCategories: () => sm.getCategories(), // GET /support-member/categories (string list)
  getLinkedTechnical: (id) => sm.getLinkedTechnicalTicket(id), // GET /support-member/technical-issues/:id
  claim: (id) => sm.claimTicket(id), // PATCH /support-member/tickets/:id/claim
  changeStatus: ({ id, status }) => sm.changeStatus(id, status), // PATCH .../:id/status
  changePriority: ({ id, priority }) => sm.changePriority(id, priority), // PATCH .../:id/priority
  changeCategory: ({ id, category }) => sm.changeCategory(id, category), // PATCH .../:id/category
  supportResolve: ({ id, notes }) => sm.resolveTicket(id, notes), // PATCH .../:id/resolve
  reopen: ({ id, reason }) => sm.reopenTicket(id, reason), // PATCH .../:id/reopen
  close: (id) => sm.closeTicket(id), // PATCH .../:id/close
  supportComment: ({ id, message }) => sm.addMessage(id, message), // POST .../:id/comments (customer-visible)
  addInternalNote: ({ id, message }) => sm.addInternalNote(id, message), // POST .../:id/internal-notes
  escalateToTechnical: ({ id, note }) => sm.escalateToTechnicalTeam(id, note), // PATCH .../:id/escalate-technical
  escalateToPlatformAdmin: ({ id, note }) => sm.escalateToPlatformAdmin(id, note), // PATCH .../:id/escalate-platform-admin
  // Company Admin: raise a SUPPORT ticket to the company's assigned Platform Admin.
  raiseCompanyTicket: (data) => company.raiseCompanyIssue(data), // POST /company/tickets
  // Technical Member (technicalMemberService): the same TECHNICAL tickets through /technical-member/issues,
  // limited server-side to issues assigned to the caller.
  getTechnicalAssigned: (filters) => tm.getMyTechnicalIssues(filters), // GET /technical-member/issues?status=&priority=&search=&scope=
  getTechnicalById: (id) => tm.getMyTechnicalIssueById(id), // GET /technical-member/issues/:id
  tmUpdateStatus: ({ id, status }) => tm.updateMyIssueStatus(id, status), // PATCH .../:id/status
  tmUpdateProgress: ({ id, progress, note }) => tm.updateMyIssueProgress(id, progress, note), // PATCH .../:id/progress
  tmResolve: ({ id, notes }) => tm.resolveMyIssue(id, notes), // PATCH .../:id/resolve
  tmSubmitVerification: ({ id, note }) => tm.submitMyIssueForVerification(id, note), // PATCH .../:id/submit-verification
  tmComment: ({ id, message }) => tm.addMyIssueComment(id, message), // POST .../:id/comments
  tmAddNote: ({ id, message }) => tm.addMyIssueWorkNote(id, message), // POST .../:id/notes
  tmUploadAttachment: ({ id, attachment }) => tm.uploadMyIssueAttachment(id, attachment), // POST .../:id/attachments -> metadata
  tmDeleteAttachment: ({ id, attachmentId }) => tm.deleteMyIssueAttachment(id, attachmentId), // DELETE .../:id/attachments/:aid
  // File contents (data_url) for a preview: a file payload, called directly, never stored in Redux.
  getTechnicalAttachment: ({ id, attachmentId }) => tm.getMyIssueAttachment(id, attachmentId), // GET .../:id/attachments/:aid
};

// Read-only aggregates computed by the backend.
export const platformOverviewRepository = {
  getDashboardSummary: () => pa.getDashboardSummary(), // GET /platform-dashboard/summary
  getTeamWorkload: () => pa.getTeamWorkload(), // GET /platform-team/workload
  getSupportStats: () => sm.getStats(), // GET /support-member/stats (demo-aware)
  getTechnicalStats: () => tm.getTechnicalMemberStats(), // GET /technical-member/stats
  getTechnicalRecentUpdates: (limit) => tm.getTechnicalMemberRecentUpdates(limit), // GET /technical-member/recent-updates?limit=
  // Super Admin analytics and revenue (range: { range, from, to })
  getAnalyticsOverview: () => sa.getAnalyticsOverview(), // GET /analytics/overview
  getCompanyGrowth: ({ range, from, to }) => sa.getCompanyGrowth(range, from, to), // GET /analytics/company-growth
  getEmployeeGrowth: ({ range, from, to }) => sa.getEmployeeGrowth(range, from, to), // GET /analytics/employee-growth
  getSubscriptionDistribution: () => sa.getSubscriptionDistribution(), // GET /analytics/subscription-distribution
  getPlatformActivity: ({ range, from, to }) => sa.getPlatformActivitySummary(range, from, to), // GET /analytics/platform-activity
  getActivePlatformAdminCount: () => sa.getActivePlatformAdminCount(), // GET /platform-admins/active-count
  getRevenueSummary: () => sa.getRevenueSummary(), // GET /revenue/summary
  getRevenueByPlan: () => sa.getRevenueByPlan(), // GET /revenue/by-plan
  getRevenueByCompany: () => sa.getRevenueByCompany(), // GET /revenue/by-company
  getRevenueByPlatformAdmin: () => sa.getRevenueByPlatformAdmin(), // GET /revenue/by-platform-admin
};

// ---- Super Admin (superAdminService; every route requires SUPER_ADMIN on the backend) ----

// /registration-reviews (submitted company registrations, keyed by reference)
export const registrationRepository = {
  getAll: (filters) => sa.getRegistrations(filters), // GET /registration-reviews?status=
  startReview: (reference) => sa.startRegistrationReview(reference), // POST /registration-reviews/:ref/start-review
  approve: ({ reference, data }) => sa.approveRegistration(reference, data), // POST /registration-reviews/:ref/approve
  reject: ({ reference, reason }) => sa.rejectRegistration(reference, reason), // POST /registration-reviews/:ref/reject
  // A file download (Blob), not application state: called directly, never stored in Redux.
  getDocument: ({ reference, docType }) => sa.getRegistrationDocument(reference, docType), // GET .../documents/:docType
};

// /subscriptions (plans)
export const subscriptionRepository = {
  getAll: () => sa.getSubscriptionPlans(), // GET /subscriptions
  create: (data) => sa.createSubscriptionPlan(data), // POST /subscriptions
  update: ({ id, data }) => sa.updateSubscriptionPlan(id, data), // PATCH /subscriptions/:id
  updateStatus: ({ id, status }) => sa.updateSubscriptionPlanStatus(id, status), // PATCH /subscriptions/:id/status
};

// /activity-logs (read-only)
export const activityLogRepository = {
  getAll: (filters) => sa.getActivityLogs(filters), // GET /activity-logs?userId=&action=&companyId=
  getForPlatformAdmin: (id) => sa.getPlatformAdminActivity(id), // GET /platform-admins/:id/activity
};

// /critical-escalations (keyed by issue_id)
export const criticalEscalationRepository = {
  getAll: (filters) => sa.getCriticalEscalations(filters), // GET /critical-escalations?status=&priority=&companyId=
  getById: (id) => sa.getCriticalEscalationById(id), // GET /critical-escalations/:id
  create: (data) => sa.createCriticalEscalation(data), // POST /critical-escalations
  updatePriority: ({ id, priority }) => sa.updateCriticalEscalationPriority(id, priority), // PATCH .../:id/priority
  assign: ({ id, team }) => sa.assignCriticalEscalation(id, team), // PATCH .../:id/assign
  resolve: ({ id, notes }) => sa.resolveCriticalEscalation(id, notes), // PATCH .../:id/resolve
  escalate: ({ id, note }) => sa.escalateCriticalEscalation(id, note), // PATCH .../:id/escalate
  comment: ({ id, message }) => sa.addCriticalEscalationComment(id, message), // POST .../:id/comments
};

// /platform-settings (one document)
export const platformSettingsRepository = {
  get: () => sa.getPlatformSettings(), // GET /platform-settings
  update: (data) => sa.updatePlatformSettings(data), // PATCH /platform-settings
};
