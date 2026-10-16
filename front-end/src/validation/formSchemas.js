// Validation schemas for every form in the app, keyed by form. Kept together so
// the rules can be reviewed (and unit-tested, see formSchemas.test.js) in one place;
// each form imports its own schema. Field rules mirror the backend DTO for the
// endpoint the form submits to.
import {
  LIMITS,
  date,
  dateTime,
  differsFrom,
  email,
  file,
  list,
  matches,
  notBefore,
  number,
  oneOf,
  passwordInput,
  personName,
  phone,
  strongPassword,
  text,
  time,
} from '../utils/validation';

const MB = 1024 * 1024;

// ---- shared ------------------------------------------------------------------

/** pages/public/Login.jsx -> POST /auth/login */
export const loginSchema = {
  email: email('Email'),
  password: passwordInput('Password'),
};

/** Change-password cards (current / next / confirm) -> PATCH /employees/:id/password */
export const changePasswordSchema = {
  current: passwordInput('Current password'),
  next: [strongPassword('New password'), differsFrom('current', 'New password must be different from the current password.')],
  confirm: [passwordInput('Password confirmation'), matches('next', 'Passwords do not match.')],
};

/** components/calendar/Calendar.jsx add-event form -> POST /calendar/events */
export const calendarEventSchema = {
  title: text('Event title', { min: 2, max: 80 }),
  time: time('Time', { required: false }),
  type: oneOf('Event type', ['PERSONAL', 'MEETING']),
  description: text('Description', { required: false, max: LIMITS.COMMENT_MAX, multiline: true }),
};

// ---- Employee portal ---------------------------------------------------------

/** pages/employee/LeaveRequest.jsx -> POST /leaves */
export const leaveRequestSchema = {
  type: oneOf('Leave type', ['CASUAL', 'SICK', 'UNPAID', 'EMERGENCY'], { message: 'Select a leave type.' }),
  start: date('Start date'),
  end: [date('End date'), notBefore('start', 'End date must be on or after the start date.')],
  reason: text('Reason', { min: 3, max: LIMITS.REASON_MAX, multiline: true }),
};

/** Attachments picked on the Raise Issue / Resolve Issue screens (names only are kept). */
export const ISSUE_ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.log', '.doc', '.docx'];
const issueAttachments = file('Attachments', { extensions: ISSUE_ATTACHMENT_EXTENSIONS, maxBytes: 10 * MB, maxFiles: 5 });

/** pages/employee/RaiseIssue.jsx -> POST /issues */
export const raiseIssueSchema = (issueTypes, taskIds) => ({
  type: oneOf('Issue type', issueTypes),
  priority: oneOf('Priority', ['Low', 'Medium', 'High']),
  relatedTask: oneOf('Related task', taskIds, { required: false }),
  title: text('Issue title', { min: 3, max: LIMITS.TITLE_MAX }),
  description: text('Description', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  attachments: issueAttachments,
});

/** pages/employee/UpdateTask.jsx -> PATCH /tasks/:id (status, progress) */
export const updateTaskSchema = {
  progress: number('Progress', { min: 0, max: 100, integer: true }),
  status: [
    oneOf('Status', ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']),
    (status, v) => (status === 'NOT_STARTED' && Number(v.progress) > 0 ? 'A task with progress cannot be "Not Started".' : ''),
    (status, v) => (Number(v.progress) === 100 && status !== 'COMPLETED' ? 'Set the status to Completed at 100% progress.' : ''),
  ],
  hoursSpent: number('Hours spent', { min: 0.5, max: 24, maxDecimals: 2 }),
  notes: text('Update notes', { required: false, max: LIMITS.COMMENT_MAX, multiline: true }),
};

/** Whole hours between two datetime-local values (the Work Logs page records whole hours). */
export const wholeHoursBetween = (start, end) => Math.floor((Date.parse(end) - Date.parse(start)) / 3_600_000);

/** pages/employee/WorkLogs.jsx -> POST /worklogs */
export const workLogSchema = (taskIds) => ({
  taskId: oneOf('Task', taskIds, { message: 'Select the task you worked on.' }),
  start: dateTime('Start time'),
  end: [
    dateTime('End time'),
    notBefore('start', 'End time must be after the start time.', { strict: true }),
    (end, v) => {
      const hours = wholeHoursBetween(v.start, end);
      if (Number.isNaN(hours) || Date.parse(end) <= Date.parse(v.start)) return '';
      if (hours < 1) return 'Log at least 1 full hour (hours are recorded in whole hours).';
      return hours > 24 ? 'A single work log can cover at most 24 hours.' : '';
    },
  ],
  description: text('Work description', { min: 5, max: LIMITS.COMMENT_MAX, multiline: true }),
});

// ---- Team Lead portal --------------------------------------------------------

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
/** Priority select: compared case-insensitively ("Medium" from the UI, "HIGH" in seed data). */
export const priority = (label = 'Priority') => (value) =>
  !value ? `Select a ${label.toLowerCase()}.` : PRIORITIES.includes(String(value).toUpperCase()) ? '' : `Select a valid ${label.toLowerCase()}.`;

/** pages/teamlead/Tasks.jsx create / edit -> POST /tasks, PATCH /tasks/:id */
export const teamLeadTaskSchema = (memberIds, { isNew }) => ({
  assigned_to: oneOf('Team member', memberIds, { message: 'Select a team member.' }),
  task_title: text('Task title', { min: 3, max: LIMITS.TITLE_MAX }),
  est_hours: number('Estimated hours', { min: 0.5, max: 1000, maxDecimals: 1 }),
  deadline: date('Deadline', { notPast: isNew }),
  priority: priority(),
  ...(isNew ? {} : { status: oneOf('Status', ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']) }),
  task_description: text('Description', { required: false, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
});

/** pages/teamlead/AssignIssue.jsx -> PATCH /issues/:id */
export const assignIssueSchema = (issueIds, teamIds, { assigneeRequired }) => ({
  issueId: oneOf('Issue', issueIds, { message: 'Select the issue to assign.' }),
  type: text('Issue type', { min: 2, max: LIMITS.SHORT_TEXT_MAX }),
  teamId: oneOf('Team', teamIds, { message: 'Select a team.' }),
  assignee: (value) => (assigneeRequired && !value ? 'Select who will handle it.' : ''),
  priority: priority(),
  deadline: date('Resolution deadline', { notPast: true }),
  notes: text('Assignment notes', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
});

export const RESOLUTION_EVIDENCE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.log', '.diff', '.patch'];
/** Evidence files on the Resolve Issue screen (only their names are recorded). */
export const resolutionEvidence = file('Evidence', { extensions: RESOLUTION_EVIDENCE_EXTENSIONS, maxBytes: 5 * MB, maxFiles: 20 });

/** pages/teamlead/ResolveIssue.jsx -> PATCH /issues/:id { resolution } */
export const resolveIssueSchema = (issueIds, resolutionTypes) => ({
  issueId: oneOf('Issue', issueIds, { message: 'Select the issue to resolve.' }),
  type: oneOf('Resolution type', resolutionTypes, { message: 'Select how it was resolved.' }),
  hours: number('Time spent', { min: 0.5, max: 200, maxDecimals: 1 }),
  rootCause: text('Root cause', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  actions: text('Actions taken', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  preventive: text('Preventive measures', { required: false, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  files: resolutionEvidence,
});

/** pages/teamlead/EscalateToHR.jsx -> POST /escalations (reason = "title: description") */
export const escalateToHrSchema = (categories, priorities, memberIds) => ({
  category: oneOf('Category', categories, { message: 'Choose a category.' }),
  priority: oneOf('Priority', priorities, { message: 'Choose a priority.' }),
  employee: (value, v) => {
    if (v.personal || v.category === 'Personal') return '';
    if (!value) return 'Select the related employee, or mark this as a personal issue.';
    return memberIds.includes(value) ? '' : 'Select a valid team member.';
  },
  title: text('Issue title', { min: 5, max: LIMITS.TITLE_MAX }),
  description: text('Description', { min: 20, max: 1800, multiline: true }),
});

/** pages/teamlead/Escalations.jsx action dialog (warn / extend / reassign). */
export const escalationActionSchema = (kind, { currentDeadline, memberIds }) => ({
  value:
    kind === 'warn'
      ? text('Message', { min: 10, max: LIMITS.REASON_MAX, multiline: true })
      : kind === 'extend'
        ? [date('New deadline', { notPast: true }), (value) => (currentDeadline && value <= currentDeadline ? 'The new deadline must be later than the current one.' : '')]
        : oneOf('Team member', memberIds, { message: 'Select a team member.' }),
});

/** pages/teamlead/Leave.jsx reject dialog -> PATCH /leaves/:id/status */
export const rejectLeaveSchema = {
  reason: text('Reason for rejection', { min: 5, max: LIMITS.REASON_MAX, multiline: true }),
};

/** pages/teamlead/Profile.jsx edit profile (saved locally). */
export const teamLeadProfileSchema = {
  phone: phone('Phone number', { required: false }),
  address: text('Address', { required: false, min: 5, max: 200, multiline: true }),
  experience: text('Experience', { required: false, max: 50 }),
  skills: list('Skills', { maxItems: 30, maxLength: 50 }),
};

// ---- accounts (Company Admin / Super Admin / Platform Admin) -----------------

/** New-account fields shared by every "create user" form. */
export const newAccountSchema = {
  name: personName('Full name'),
  email: email('Email'),
  phone: phone('Phone number'),
  password: strongPassword('Password'),
  confirmPassword: [passwordInput('Password confirmation'), matches('password', 'Passwords do not match.')],
};

/** Profile edits of an existing account (name / email / phone). */
export const editAccountSchema = {
  name: personName('Full name'),
  email: email('Email'),
  phone: phone('Phone number'),
};

/** Company Admin "Create Team" -> POST /teams */
export const createTeamSchema = { team_name: text('Team name', { min: 2, max: 60 }) };

/** Company Admin "Add New Employee" -> POST /employees */
export const addEmployeeSchema = (departments, teamIds) => ({
  ...newAccountSchema,
  department_id: oneOf('Department', departments, { message: 'Select a department.' }),
  team_id: oneOf('Team', teamIds, { message: 'Select a team that has a Team Lead.' }),
});

/** Company Admin inline employee edit -> PATCH /employees/:id */
export const editEmployeeSchema = (departments) => ({
  emp_name: personName('Name'),
  email: email('Email'),
  phone: phone('Phone number'),
  department_id: oneOf('Department', departments),
  status: oneOf('Status', ['ACTIVE', 'INACTIVE']),
});

/** pages/company-admin/CaRaiseIssue.jsx -> POST /company/tickets */
export const raiseCompanyTicketSchema = {
  priority: oneOf('Priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: text('Category', { required: false, min: 2, max: LIMITS.SHORT_TEXT_MAX }),
  title: text('Issue title', { min: 5, max: LIMITS.TITLE_MAX }),
  description: text('Description', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
};

// ---- HR portal ---------------------------------------------------------------

const HOSTNAME = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/** pages/hr/HrSettings.jsx (saved in this browser). One schema per settings card. */
export const hrSettingsSchemas = {
  general: {
    companyName: text('Company name', { min: 2, max: 120 }),
    hoursPerDay: number('Working hours per day', { min: 1, max: 24, integer: true }),
    daysPerWeek: number('Working days per week', { min: 1, max: 7, integer: true }),
  },
  attendance: {
    minProgress: number('Minimum progress', { min: 1, max: 100, integer: true }),
    lateThreshold: number('Late check-in threshold', { min: 0, max: 240, integer: true }),
  },
  email: {
    smtpServer: [text('SMTP server', { max: 253 }), (v) => (!v || HOSTNAME.test(String(v).trim()) ? '' : 'SMTP server must be a host name such as smtp.company.com.')],
    smtpPort: number('SMTP port', { min: 1, max: 65535, integer: true }),
    fromEmail: email('From email'),
    fromName: text('From name', { min: 2, max: LIMITS.NAME_MAX }),
  },
};

// ---- Platform Admin portal ---------------------------------------------------

/** pages/platform-admin/MyCompanies.jsx -> POST /companies/:id/admins */
export const createCompanyAdminSchema = (companyIds) => ({
  ...newAccountSchema,
  companyId: oneOf('Company', companyIds, { message: 'Select a company.' }),
  status: oneOf('Status', ['ACTIVE', 'INACTIVE']),
});

/** Support / Technical team member add & edit -> POST/PATCH /support-team, /technical-team */
export const teamMemberSchema = ({ isCreate }) => ({
  name: personName('Name'),
  email: email('Email'),
  phone: phone('Phone number', { required: isCreate }),
  specialization: text('Specialization', { required: false, max: LIMITS.SHORT_TEXT_MAX }),
});

/** Platform Admin ticket panel (support tickets / technical issues). Each button checks its own fields. */
export const platformTicketActionSchema = (memberIds) => ({
  assignee: oneOf('Team member', memberIds, { message: 'Select a team member first.' }),
  reason: text('Reassignment reason', { min: 5, max: LIMITS.REASON_MAX }),
  verifyNote: text('Note', { required: false, max: LIMITS.COMMENT_MAX, multiline: true }),
  rejectNote: (value) => text('Rework note', { min: 5, max: LIMITS.REASON_MAX, multiline: true })(value),
  comment: text('Comment', { max: LIMITS.DESCRIPTION_MAX, multiline: true }),
});

// ---- Super Admin portal ------------------------------------------------------

const companyFields = (planIds) => ({
  company_name: text('Company name', { min: 2, max: 120 }),
  company_email: email('Company email'),
  phone: phone('Phone number'),
  industry: text('Industry', { min: 2, max: LIMITS.SHORT_TEXT_MAX }),
  address: text('Address', { min: 5, max: LIMITS.ADDRESS_MAX }),
  subscription_plan_id: oneOf('Subscription plan', planIds, { message: 'Select a subscription plan.' }),
});

/** pages/super-admin/SaCompanies.jsx "Create Company" -> POST /companies */
export const createCompanySchema = (planIds, platformAdminIds) => ({
  ...companyFields(planIds),
  status: oneOf('Company status', ['ACTIVE', 'INACTIVE']),
  admin_name: personName('Admin name'),
  admin_email: email('Admin email'),
  admin_phone: phone('Admin phone'),
  admin_password: strongPassword('Admin password'),
  admin_confirm_password: [passwordInput('Password confirmation'), matches('admin_password', 'Admin password and confirmation do not match.')],
  platform_admin_id: oneOf('Platform Admin', platformAdminIds, { message: 'Select an active Platform Admin.' }),
});

/** pages/super-admin/SaCompanies.jsx "Edit Company" -> PATCH /companies/:id */
export const editCompanySchema = (planIds) => companyFields(planIds);

/** pages/super-admin/SaCompanies.jsx "Reassign Platform Admin" -> PATCH /companies/:id/reassign */
export const reassignPlatformAdminSchema = (platformAdminIds) => ({
  platform_admin_id: oneOf('Platform Admin', platformAdminIds, { message: 'Select an active Platform Admin.' }),
});

/** pages/super-admin/SaPlatformAdmins.jsx -> POST /platform-admins */
export const createPlatformAdminSchema = { ...newAccountSchema, status: oneOf('Status', ['ACTIVE', 'INACTIVE']) };

/** pages/super-admin/SaPlatformAdmins.jsx edit -> PATCH /platform-admins/:id (phone optional, as before) */
export const editPlatformAdminSchema = { ...editAccountSchema, phone: phone('Phone number', { required: false }) };

/** pages/super-admin/SaSubscriptions.jsx create / edit -> POST/PATCH /subscriptions */
export const planSchema = {
  name: text('Plan name', { min: 2, max: 60 }),
  price: number('Price', { min: 0, max: 1000000, maxDecimals: 2 }),
  billing_cycle: oneOf('Billing cycle', ['MONTHLY', 'ANNUAL']),
  max_employees: number('Max employees', { min: 1, max: 1000000, integer: true, required: false }),
  features: list('Features', { maxItems: 30, maxLength: LIMITS.SHORT_TEXT_MAX }),
};

/** pages/super-admin/SaEscalations.jsx "Raise Critical Escalation" -> POST /critical-escalations */
export const createEscalationSchema = (companyIds) => ({
  company_id: oneOf('Company', companyIds, { message: 'Select a company.' }),
  category: oneOf('Category', ['Technical', 'Billing', 'Support', 'Security', 'Other']),
  priority: oneOf('Priority', ['Low', 'Medium', 'High', 'Critical']),
  assigned_team: oneOf('Assigned team', ['Support Team', 'Technical Team', 'Unassigned']),
  description: text('Description', { required: false, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
});

/** Escalation detail panel: comment (required to post) / note sent with resolve or escalate. */
export const escalationCommentSchema = {
  comment: text('Comment', { max: LIMITS.COMMENT_MAX, multiline: true }),
  note: (value) => text('Note', { required: false, max: LIMITS.COMMENT_MAX, multiline: true })(value),
};

const isTimeZone = (value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: String(value) });
    return true;
  } catch {
    return false;
  }
};

/** pages/super-admin/SaSettings.jsx -> PATCH /platform-settings */
export const platformSettingsSchemas = {
  platform: {
    platform_name: text('Platform name', { min: 2, max: 60 }),
    support_email: email('Support email'),
    default_currency: [text('Default currency', { max: 3 }), (v) => (!v || /^[A-Za-z]{3}$/.test(String(v).trim()) ? '' : 'Default currency must be a 3-letter ISO code such as USD or INR.')],
    timezone: [text('Timezone', { max: 64 }), (v) => (!v || isTimeZone(String(v).trim()) ? '' : 'Timezone must be a valid IANA time zone such as Asia/Kolkata.')],
  },
  security: {
    passwordMinLength: number('Minimum password length', { min: 8, max: 32, integer: true }),
    sessionTimeoutMinutes: number('Session timeout', { min: 5, max: 1440, integer: true }),
    invitationExpiryHours: number('Invitation expiry', { min: 1, max: 720, integer: true }),
  },
};

/** Custom date range on Analytics (sent to the API) and the Revenue table filter. */
export const dateRangeSchema = ({ fromRequired = false } = {}) => ({
  from: date('From date', { required: fromRequired }),
  to: [date('To date', { required: false }), notBefore('from', 'To date must be on or after the from date.')],
});

// ---- Support Member portal ---------------------------------------------------

export const SUPPORT_ATTACHMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

/** pages/support-member/components/SupportTicketModal.jsx. Each button checks its own fields. */
export const supportTicketSchema = ({ statuses, categories, dialog }) => ({
  status: oneOf('Status', statuses),
  priority: oneOf('Priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: oneOf('Category', categories),
  message: text('Response', { max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  note: text('Internal note', { max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  escalationNote: (value) => text('Escalation note', { required: false, max: LIMITS.COMMENT_MAX, multiline: true })(value),
  dialogText: text(dialog === 'reopen' ? 'Reason' : 'Resolution note', { required: false, max: dialog === 'reopen' ? LIMITS.REASON_MAX : LIMITS.DESCRIPTION_MAX, multiline: true }),
  attachment: file('Attachment', { extensions: SUPPORT_ATTACHMENT_EXTENSIONS, maxBytes: 10 * MB }),
});

// ---- Technical Member portal -------------------------------------------------

/** Same list as the backend (technical-member.dto.ts ATTACHMENT_EXTENSIONS). */
export const TECHNICAL_ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt', '.log'];

/** pages/technical-member/components/useIssueDetail.jsx. Each button checks its own fields. */
export const technicalIssueSchema = ({ currentStatus }) => ({
  status: oneOf('Status', [...new Set(['OPEN', 'IN_PROGRESS', currentStatus].filter(Boolean))]),
  progress: number('Progress', { min: 0, max: 100, integer: true }),
  progressNote: text('Progress note', { required: false, max: LIMITS.COMMENT_MAX }),
  resolution: text('Resolution notes', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  submitNote: text('Note', { required: false, max: LIMITS.COMMENT_MAX, multiline: true }),
  comment: text('Message', { max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  note: text('Technical note', { max: LIMITS.DESCRIPTION_MAX, multiline: true }),
  attachKind: oneOf('Attachment type', ['SCREENSHOT', 'LOG', 'OTHER']),
  pendingFile: file('Attachment', { extensions: TECHNICAL_ATTACHMENT_EXTENSIONS, maxBytes: 5 * MB, required: true }),
});
