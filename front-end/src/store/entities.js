// Backend resource -> repository -> slice (one slice per entity).
// Pages that show the same entity read the same slice.
import {
  attendanceRepository as attendance,
  employeeRepository as employees,
  escalationRepository as escalations,
  issueRepository as issues,
  leaveRepository as leaves,
  notificationRepository as notifications,
  taskRepository as tasks,
  teamRepository as teams,
  workLogRepository as worklogs,
  companyRepository as companies,
  paymentRepository as payments,
  platformOverviewRepository as platformOverview,
  ticketRepository as tickets,
  activityLogRepository as activityLogs,
  criticalEscalationRepository as criticalEscalations,
  platformSettingsRepository as platformSettings,
  registrationRepository as registrations,
  subscriptionRepository as subscriptions,
} from '../services/repositories';
import { createEntitySlice } from './entitySlice';
import { confirmSession } from './workSessionSlice';

export const employeesEntity = createEntitySlice({
  name: 'employees',
  idKey: 'emp_id',
  queries: {
    fetchAll: employees.getAll,
    fetchTeam: employees.getTeam,
    fetchById: employees.getById,
    fetchPlatformTeam: employees.getPlatformTeam,
    fetchPlatformAdmins: employees.getPlatformAdmins,
  },
  mutations: {
    create: { kind: 'create', run: employees.create },
    update: { kind: 'update', run: employees.update },
    remove: { kind: 'delete', run: employees.delete, id: (empId) => empId },
    updatePassword: { kind: 'action', run: employees.updatePassword },
    changePasswordPlatform: { kind: 'action', run: employees.changePasswordPlatform },
    changePasswordTeamLead: { kind: 'action', run: employees.changePasswordTeamLead },
    createPlatformMember: { kind: 'create', run: employees.createPlatformMember },
    updatePlatformMember: { kind: 'update', run: employees.updatePlatformMember },
    // Lists are filtered by status server-side, so refetch them.
    updatePlatformMemberStatus: { kind: 'update', run: employees.updatePlatformMemberStatus, refetch: true },
    createPlatformAdmin: { kind: 'create', run: employees.createPlatformAdmin },
    updatePlatformAdmin: { kind: 'update', run: employees.updatePlatformAdmin },
    updatePlatformAdminStatus: { kind: 'update', run: employees.updatePlatformAdminStatus, refetch: true },
  },
});

export const tasksEntity = createEntitySlice({
  name: 'tasks',
  idKey: 'task_id',
  queries: { fetchForUser: tasks.getForUser, fetchForTeam: tasks.getForTeam, fetchForUsers: tasks.getForUsers },
  mutations: {
    create: { kind: 'create', run: tasks.create },
    updateProgress: { kind: 'update', run: tasks.updateProgress },
    update: { kind: 'update', run: tasks.update },
    remove: { kind: 'delete', run: tasks.delete, id: (taskId) => taskId },
    reassign: { kind: 'update', run: tasks.reassign },
  },
  invalidatedBy: [confirmSession],
});

export const attendanceEntity = createEntitySlice({
  name: 'attendance',
  idKey: 'attendance_id',
  queries: { fetchForUser: attendance.getForUser, fetchForUsers: attendance.getForUsers, fetchForTeam: attendance.getForTeam },
  mutations: {
    checkIn: { kind: 'create', run: attendance.checkIn },
    checkOut: { kind: 'update', run: attendance.checkOut },
  },
});

export const leavesEntity = createEntitySlice({
  name: 'leaves',
  idKey: 'leave_id',
  queries: { fetchAll: leaves.getAll, fetchReviewQueue: leaves.getReviewQueue, fetchForUser: leaves.getForUser, fetchForTeam: leaves.getForTeam },
  mutations: {
    create: { kind: 'create', run: leaves.create },
    updateStatus: { kind: 'update', run: leaves.updateStatus, refetch: true },
    updateTeamStatus: { kind: 'update', run: leaves.updateTeamStatus, refetch: true },
  },
});

export const worklogsEntity = createEntitySlice({
  name: 'worklogs',
  idKey: 'worklog_id',
  queries: { fetchForUser: worklogs.getForUser },
  mutations: { create: { kind: 'create', run: worklogs.create } },
  invalidatedBy: [confirmSession],
});

export const notificationsEntity = createEntitySlice({
  name: 'notifications',
  idKey: 'id',
  queries: { fetchForUser: notifications.getForUser, fetchForTeamLead: notifications.getForTeamLead, fetchForPlatform: notifications.getForPlatform },
  mutations: { create: { kind: 'create', run: notifications.create } },
});

export const issuesEntity = createEntitySlice({
  name: 'issues',
  idKey: 'issue_id',
  queries: { fetchAll: issues.getAll, fetchForUser: issues.getForUser, fetchForTeam: issues.getForTeam },
  mutations: {
    create: { kind: 'create', run: issues.create },
    update: { kind: 'update', run: issues.update },
    updateForTeam: { kind: 'update', run: issues.updateForTeam },
  },
});

export const teamsEntity = createEntitySlice({
  name: 'teams',
  idKey: 'team_id',
  queries: { fetchAll: teams.getAll, fetchForTeamLead: teams.getForTeamLead },
  mutations: {
    create: { kind: 'create', run: teams.create },
    assignLead: { kind: 'create', run: teams.assignLead },
  },
  // Team employee counts change when employees are added or removed.
  invalidatedBy: [employeesEntity.thunks.create, employeesEntity.thunks.remove],
});

export const escalationsEntity = createEntitySlice({
  name: 'escalations',
  idKey: 'escalation_id',
  queries: { fetchAll: escalations.getAll, fetchMine: escalations.getMine },
  mutations: {
    reject: { kind: 'update', run: escalations.reject },
    generateReport: { kind: 'action', run: escalations.generateReport },
    escalateToHr: { kind: 'create', run: escalations.escalateToHr },
  },
});

// Submitted company registrations; decisions are status changes, so the filtered lists refetch.
export const registrationsEntity = createEntitySlice({
  name: 'registrations',
  idKey: 'reference',
  queries: { fetchAll: registrations.getAll },
  mutations: {
    startReview: { kind: 'update', run: registrations.startReview, refetch: true },
    approve: { kind: 'update', run: registrations.approve, refetch: true },
    reject: { kind: 'update', run: registrations.reject, refetch: true },
  },
});

export const companiesEntity = createEntitySlice({
  name: 'companies',
  idKey: 'company_id',
  queries: {
    fetchMine: companies.getMine,
    fetchAll: companies.getAll,
    fetchForPlan: companies.getForPlan,
    fetchSupportSummary: companies.getSupportSummary,
  },
  mutations: {
    createAdmin: { kind: 'create', run: companies.createAdmin }, // admin counts change: refetch
    create: { kind: 'create', run: companies.create },
    update: { kind: 'update', run: companies.update },
    updateStatus: { kind: 'update', run: companies.updateStatus, refetch: true }, // lists are filtered by status
    reassign: { kind: 'update', run: companies.reassign },
    createAdminAsSuperAdmin: { kind: 'create', run: companies.createAdminAsSuperAdmin },
  },
  // Approving a registration creates a company.
  invalidatedBy: [registrationsEntity.thunks.approve],
});

export const subscriptionsEntity = createEntitySlice({
  name: 'subscriptions',
  idKey: 'plan_id',
  queries: { fetchAll: subscriptions.getAll },
  mutations: {
    create: { kind: 'create', run: subscriptions.create },
    update: { kind: 'update', run: subscriptions.update },
    updateStatus: { kind: 'update', run: subscriptions.updateStatus },
  },
});

export const activityLogsEntity = createEntitySlice({
  name: 'activityLogs',
  idKey: 'activity_id',
  queries: { fetchAll: activityLogs.getAll, fetchForPlatformAdmin: activityLogs.getForPlatformAdmin },
});

// Platform-level escalations raised to the Super Admin (/critical-escalations), a
// different backend resource from company HR escalations (escalations slice).
export const criticalEscalationsEntity = createEntitySlice({
  name: 'criticalEscalations',
  idKey: 'issue_id',
  queries: { fetchAll: criticalEscalations.getAll, fetchById: criticalEscalations.getById },
  mutations: {
    create: { kind: 'create', run: criticalEscalations.create },
    // Each returns the updated escalation; lists are filtered by status/priority, so refetch.
    ...Object.fromEntries(['updatePriority', 'assign', 'resolve', 'escalate', 'comment']
      .map((op) => [op, { kind: 'update', run: criticalEscalations[op], refetch: true }])),
  },
});

// One settings document: stored as the query value; a saved update refetches it.
export const platformSettingsEntity = createEntitySlice({
  name: 'platformSettings',
  idKey: 'id',
  queries: { fetch: platformSettings.get },
  mutations: { update: { kind: 'update', run: platformSettings.update } },
});

export const paymentsEntity = createEntitySlice({
  name: 'payments',
  idKey: 'transaction_id',
  queries: {
    fetchForPlatformAdmin: payments.getForPlatformAdmin,
    fetchSummary: payments.getSummary,
    fetchRevenueTransactions: payments.getRevenueTransactions,
    fetchMySubscription: payments.getMySubscription,
    fetchMyHistory: payments.getMyHistory,
  },
  // A completed payment adds a transaction and changes the billing status: refetch both.
  mutations: { completeMockPayment: { kind: 'create', run: payments.completeMockPayment } },
});

// Support Member ticket workflow operations (see ticketsEntity / platformOverviewEntity).
const SUPPORT_TICKET_OPS = ['claim', 'changeStatus', 'changePriority', 'changeCategory', 'supportResolve', 'reopen', 'close',
  'supportComment', 'addInternalNote', 'escalateToTechnical', 'escalateToPlatformAdmin'];
// Technical Member issue operations. All but the attachment ones return the updated issue;
// upload returns attachment metadata and delete { removed }, so those refetch the issue lists.
const TECHNICAL_ISSUE_OPS = ['tmUpdateStatus', 'tmUpdateProgress', 'tmResolve', 'tmSubmitVerification', 'tmComment', 'tmAddNote',
  'tmUploadAttachment', 'tmDeleteAttachment'];

// Every workflow action returns the updated (enriched) ticket, which replaces the stored one.
export const ticketsEntity = createEntitySlice({
  name: 'tickets',
  idKey: 'ticket_id',
  queries: {
    fetchAll: tickets.getAll,
    fetchById: tickets.getById,
    fetchSupportQueue: tickets.getSupportQueue,
    fetchSupportById: tickets.getSupportById,
    fetchSupportCategories: tickets.getSupportCategories,
    fetchLinkedTechnical: tickets.getLinkedTechnical,
    fetchTechnicalAssigned: tickets.getTechnicalAssigned,
    fetchTechnicalById: tickets.getTechnicalById,
  },
  mutations: {
    raiseCompanyTicket: { kind: 'create', run: tickets.raiseCompanyTicket },
    ...Object.fromEntries(
      ['assign', 'reassign', 'resolve', 'escalate', 'comment', 'verify', 'rejectVerification'].map((op) => [op, { kind: 'update', run: tickets[op] }]),
    ),
    // Support Member workflow: each returns the updated ticket. The queues are filtered by
    // assignee/status server-side (and escalating creates a technical ticket), so lists refetch.
    ...Object.fromEntries(
      SUPPORT_TICKET_OPS.map((op) => [op, { kind: 'update', run: tickets[op], refetch: true }]),
    ),
    // Active/history queues are filtered by status server-side, so they refetch too.
    ...Object.fromEntries(
      TECHNICAL_ISSUE_OPS.map((op) => [op, { kind: 'update', run: tickets[op], refetch: true }]),
    ),
  },
});

// Backend-computed aggregates (no records): each query stores the response as its value.
export const platformOverviewEntity = createEntitySlice({
  name: 'platformOverview',
  idKey: 'id',
  queries: {
    fetchDashboardSummary: platformOverview.getDashboardSummary,
    fetchTeamWorkload: platformOverview.getTeamWorkload,
    fetchSupportStats: platformOverview.getSupportStats,
    fetchTechnicalStats: platformOverview.getTechnicalStats,
    fetchTechnicalRecentUpdates: platformOverview.getTechnicalRecentUpdates,
    // Super Admin analytics / revenue
    fetchAnalyticsOverview: platformOverview.getAnalyticsOverview,
    fetchCompanyGrowth: platformOverview.getCompanyGrowth,
    fetchEmployeeGrowth: platformOverview.getEmployeeGrowth,
    fetchSubscriptionDistribution: platformOverview.getSubscriptionDistribution,
    fetchPlatformActivity: platformOverview.getPlatformActivity,
    fetchActivePlatformAdminCount: platformOverview.getActivePlatformAdminCount,
    fetchRevenueSummary: platformOverview.getRevenueSummary,
    fetchRevenueByPlan: platformOverview.getRevenueByPlan,
    fetchRevenueByCompany: platformOverview.getRevenueByCompany,
    fetchRevenueByPlatformAdmin: platformOverview.getRevenueByPlatformAdmin,
  },
  // Support/technical stats and the activity feed are derived from tickets: refetch after the member changes one.
  invalidatedBy: [...SUPPORT_TICKET_OPS, ...TECHNICAL_ISSUE_OPS].map((op) => ticketsEntity.thunks[op]),
});

export const ENTITIES = [
  employeesEntity,
  tasksEntity,
  attendanceEntity,
  leavesEntity,
  worklogsEntity,
  notificationsEntity,
  issuesEntity,
  teamsEntity,
  escalationsEntity,
  companiesEntity,
  paymentsEntity,
  ticketsEntity,
  platformOverviewEntity,
  registrationsEntity,
  subscriptionsEntity,
  activityLogsEntity,
  criticalEscalationsEntity,
  platformSettingsEntity,
];
