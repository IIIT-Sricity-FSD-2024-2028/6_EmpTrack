// Every form's schema: a valid submission passes, and each listed change breaks
// exactly the field it targets.
import { describe, expect, it } from 'vitest';
import * as s from './formSchemas';
import { todayKey, validateForm } from '../utils/validation';

const DAY = 24 * 60 * 60 * 1000;
const day = (offset) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
const LONG = (n) => 'a'.repeat(n);
const file = (name, size = 10) => new File([new Uint8Array(size)], name);
const STRONG = 'Valid@123';

const account = { name: "Śrīnivās O'Neil", email: 'meera@example.com', phone: '+91 98765 43210', password: STRONG, confirmPassword: STRONG };

// [form, schema, valid values, [[field, patch], ...]]
const FORMS = [
  ['Login', s.loginSchema, { email: 'emp@emptrack.com', password: 'x' }, [
    ['email', { email: '' }], ['email', { email: 'emp@' }], ['password', { password: '' }],
  ]],
  ['Change password', s.changePasswordSchema, { current: 'Old@1234', next: STRONG, confirm: STRONG }, [
    ['current', { current: '' }], ['next', { next: 'weakpass', confirm: 'weakpass' }], ['next', { next: 'Old@1234', confirm: 'Old@1234' }],
    ['confirm', { confirm: 'Other@123' }], ['next', { next: `Aa1@${LONG(61)}`, confirm: `Aa1@${LONG(61)}` }],
  ]],
  ['Calendar event', s.calendarEventSchema, { title: 'Dentist', time: '09:30', type: 'PERSONAL', description: '' }, [
    ['title', { title: '   ' }], ['title', { title: LONG(81) }], ['time', { time: '25:00' }], ['type', { type: 'PARTY' }],
    ['description', { description: LONG(1001) }],
  ]],
  ['Leave request', s.leaveRequestSchema, { type: 'SICK', start: day(5), end: day(5), reason: 'Flu' }, [
    ['type', { type: '' }], ['type', { type: 'FOREVER' }], ['start', { start: '2026-02-30' }], ['end', { end: day(4) }],
    ['reason', { reason: '   ' }], ['reason', { reason: LONG(501) }],
  ]],
  ['Raise issue', s.raiseIssueSchema(['Bug', 'Other'], ['TK001']), { type: 'Bug', priority: 'High', relatedTask: '', title: 'VPN drops', description: 'It disconnects every ten minutes.', attachments: [] }, [
    ['type', { type: 'Gossip' }], ['priority', { priority: 'Urgent' }], ['relatedTask', { relatedTask: 'TK999' }], ['title', { title: 'ab' }],
    ['title', { title: LONG(151) }], ['description', { description: 'short' }], ['attachments', { attachments: [file('virus.exe')] }],
    ['attachments', { attachments: [file('big.png', 11 * 1024 * 1024)] }],
  ]],
  ['Update task', s.updateTaskSchema, { progress: '50', status: 'IN_PROGRESS' }, [
    ['progress', { progress: '101' }], ['status', { status: 'DONE' }], ['status', { status: 'NOT_STARTED' }],
    ['status', { progress: '100', status: 'IN_PROGRESS' }],
  ]],
  ['Work log', s.workLogSchema(['TK001']), { taskId: 'TK001', start: '2026-03-28T09:00', end: '2026-03-28T11:00', description: 'Built the header.' }, [
    ['taskId', { taskId: '' }], ['start', { start: 'yesterday' }], ['end', { end: '2026-03-28T08:00' }],
    ['end', { end: '2026-03-28T09:30' }], ['end', { end: '2026-03-29T10:00' }], ['description', { description: 'abc' }],
  ]],
  ['Team Lead task (create)', s.teamLeadTaskSchema(['EM001'], { isNew: true }), { assigned_to: 'EM001', task_title: 'Write docs', est_hours: '4', deadline: todayKey(), priority: 'Medium', task_description: '' }, [
    ['assigned_to', { assigned_to: 'EM999' }], ['task_title', { task_title: 'ab' }], ['est_hours', { est_hours: '0' }],
    ['est_hours', { est_hours: '1001' }], ['est_hours', { est_hours: '4.25' }], ['deadline', { deadline: day(-1) }], ['priority', { priority: 'P1' }],
  ]],
  ['Team Lead task (edit)', s.teamLeadTaskSchema(['EM001'], { isNew: false }), { assigned_to: 'EM001', task_title: 'Write docs', est_hours: '4', deadline: day(-30), priority: 'HIGH', status: 'BLOCKED', task_description: '' }, [
    ['status', { status: 'DONE' }], ['task_description', { task_description: LONG(2001) }],
  ]],
  ['Assign issue', s.assignIssueSchema(['ISS-1'], ['T1'], { assigneeRequired: true }), { issueId: 'ISS-1', type: 'Hardware', teamId: 'T1', assignee: 'EM001', priority: 'High', deadline: todayKey(), notes: 'Please replace the fan.' }, [
    ['issueId', { issueId: '' }], ['teamId', { teamId: 'T9' }], ['assignee', { assignee: '' }], ['deadline', { deadline: day(-1) }],
    ['notes', { notes: 'too short' }],
  ]],
  ['Resolve issue', s.resolveIssueSchema(['ISS-1'], ['Bug Fix']), { issueId: 'ISS-1', type: 'Bug Fix', hours: '2.5', rootCause: 'Config typo in env.', actions: 'Fixed and redeployed.', preventive: '', files: [] }, [
    ['type', { type: 'Magic' }], ['hours', { hours: '0' }], ['hours', { hours: '201' }], ['rootCause', { rootCause: 'typo' }],
    ['actions', { actions: '' }], ['files', { files: [file('payload.exe')] }],
  ]],
  ['Escalate to HR', s.escalateToHrSchema(['Conflict', 'Personal'], ['Low', 'High'], ['EM001']), { category: 'Conflict', priority: 'High', employee: 'EM001', personal: false, title: 'Team conflict', description: 'Repeated disagreements in stand-ups this week.' }, [
    ['category', { category: '' }], ['priority', { priority: 'Urgent' }], ['employee', { employee: '' }], ['employee', { employee: 'EM999' }],
    ['title', { title: 'Hey' }], ['description', { description: 'Too short' }], ['description', { description: LONG(1801) }],
  ]],
  ['Escalation action (warn)', s.escalationActionSchema('warn', { memberIds: [] }), { value: 'Please update your task today.' }, [['value', { value: 'hi' }]]],
  ['Escalation action (extend)', s.escalationActionSchema('extend', { currentDeadline: day(3), memberIds: [] }), { value: day(5) }, [
    ['value', { value: day(2) }], ['value', { value: day(-1) }], ['value', { value: '' }],
  ]],
  ['Escalation action (reassign)', s.escalationActionSchema('reassign', { memberIds: ['EM002'] }), { value: 'EM002' }, [['value', { value: 'EM001' }]]],
  ['Reject leave', s.rejectLeaveSchema, { reason: 'Critical release week.' }, [['reason', { reason: 'no' }], ['reason', { reason: LONG(501) }]]],
  ['Team Lead profile', s.teamLeadProfileSchema, { phone: '', address: '', experience: '6 years', skills: 'React, Node' }, [
    ['phone', { phone: '12' }], ['address', { address: 'abc' }], ['experience', { experience: LONG(51) }], ['skills', { skills: LONG(51) }],
  ]],
  ['Create team', s.createTeamSchema, { team_name: 'Platform' }, [['team_name', { team_name: ' ' }], ['team_name', { team_name: LONG(61) }]]],
  ['Add employee', s.addEmployeeSchema(['Engineering'], ['T1']), { ...account, department_id: 'Engineering', team_id: 'T1' }, [
    ['name', { name: 'J0hn' }], ['email', { email: 'x@' }], ['phone', { phone: 'abcdefghij' }], ['password', { password: 'password', confirmPassword: 'password' }],
    ['confirmPassword', { confirmPassword: 'Other@123' }], ['department_id', { department_id: 'Space' }], ['team_id', { team_id: '' }],
  ]],
  ['Edit employee', s.editEmployeeSchema(['Engineering']), { emp_name: 'Jane Smith', email: 'jane@emptrack.com', phone: '4445556666', department_id: 'Engineering', status: 'ACTIVE' }, [
    ['emp_name', { emp_name: '' }], ['status', { status: 'GOD_MODE' }], ['phone', { phone: '1' }],
  ]],
  ['Raise company ticket', s.raiseCompanyTicketSchema, { priority: 'MEDIUM', category: '', title: 'Payroll export', description: 'Export fails with a timeout.' }, [
    ['priority', { priority: 'URGENT' }], ['category', { category: 'x' }], ['title', { title: 'Hi' }], ['description', { description: 'broken' }],
  ]],
  ['HR settings - general', s.hrSettingsSchemas.general, { companyName: 'Acme', hoursPerDay: '8', daysPerWeek: '5' }, [
    ['companyName', { companyName: '' }], ['hoursPerDay', { hoursPerDay: '25' }], ['hoursPerDay', { hoursPerDay: '7.5' }], ['daysPerWeek', { daysPerWeek: '0' }],
  ]],
  ['HR settings - attendance', s.hrSettingsSchemas.attendance, { minProgress: '80', lateThreshold: '15' }, [
    ['minProgress', { minProgress: '101' }], ['lateThreshold', { lateThreshold: '-5' }],
  ]],
  ['HR settings - email', s.hrSettingsSchemas.email, { smtpServer: 'smtp.acme.com', smtpPort: '587', fromEmail: 'hr@acme.com', fromName: 'Acme HR' }, [
    ['smtpServer', { smtpServer: 'not a host!' }], ['smtpPort', { smtpPort: '70000' }], ['fromEmail', { fromEmail: 'hr@' }], ['fromName', { fromName: '' }],
  ]],
  ['Create Company Admin (PA)', s.createCompanyAdminSchema(['C001']), { ...account, companyId: 'C001', status: 'ACTIVE' }, [
    ['companyId', { companyId: '' }], ['status', { status: 'BANNED' }], ['phone', { phone: '+91 12345 67890' }],
  ]],
  ['Team member (create)', s.teamMemberSchema({ isCreate: true }), { name: 'Ravi Teja', email: 'ravi@emptrack.com', phone: '9000012345', specialization: '' }, [
    ['phone', { phone: '' }], ['name', { name: 'R' }], ['specialization', { specialization: LONG(101) }],
  ]],
  ['Team member (edit)', s.teamMemberSchema({ isCreate: false }), { name: 'Ravi Teja', email: 'ravi@emptrack.com', phone: '', specialization: '' }, [['email', { email: '' }]]],
  ['Platform ticket actions', s.platformTicketActionSchema(['ST001']), { assignee: 'ST001', reason: 'Workload balancing', verifyNote: '', rejectNote: 'Logs still show errors.', comment: 'Looking into it.' }, [
    ['assignee', { assignee: '' }], ['reason', { reason: 'no' }], ['rejectNote', { rejectNote: '' }], ['comment', { comment: '  ' }],
  ]],
  ['Create company (SA)', s.createCompanySchema(['PLAN-BASIC'], ['PA001']), {
    company_name: 'Nilgiri Software', company_email: 'contact@nilgiri.in', phone: '+91 98765 43210', industry: 'IT', address: '12 MG Road',
    subscription_plan_id: 'PLAN-BASIC', status: 'ACTIVE', admin_name: 'Asha Rao', admin_email: 'asha@nilgiri.in', admin_phone: '9876543210',
    admin_password: STRONG, admin_confirm_password: STRONG, platform_admin_id: 'PA001',
  }, [
    ['company_name', { company_name: '   ' }], ['company_email', { company_email: 'contact@' }], ['address', { address: 'abc' }],
    ['subscription_plan_id', { subscription_plan_id: 'PLAN-NOPE' }], ['admin_password', { admin_password: 'weak', admin_confirm_password: 'weak' }],
    ['admin_confirm_password', { admin_confirm_password: 'Other@123' }], ['platform_admin_id', { platform_admin_id: '' }],
  ]],
  ['Edit company (SA)', s.editCompanySchema(['PLAN-BASIC']), { company_name: 'Acme', company_email: 'a@acme.com', phone: '1234567890', industry: 'IT', address: '123 Innovation Drive', subscription_plan_id: 'PLAN-BASIC' }, [
    ['company_name', { company_name: '' }], ['phone', { phone: 'phone' }],
  ]],
  ['Reassign Platform Admin', s.reassignPlatformAdminSchema(['PA001']), { platform_admin_id: 'PA001' }, [['platform_admin_id', { platform_admin_id: 'PA003' }]]],
  ['Create Platform Admin', s.createPlatformAdminSchema, { ...account, status: 'ACTIVE' }, [['status', { status: 'PENDING' }]]],
  ['Edit Platform Admin', s.editPlatformAdminSchema, { name: 'Anjali Sharma', email: 'anjali@emptrack.com', phone: '' }, [['name', { name: '' }], ['phone', { phone: '123' }]]],
  ['Subscription plan', s.planSchema, { name: 'Starter', price: '0', billing_cycle: 'ANNUAL', max_employees: '', features: 'Attendance, Leave' }, [
    ['name', { name: 'A' }], ['price', { price: '-1' }], ['price', { price: '1.999' }], ['price', { price: 'abc' }], ['billing_cycle', { billing_cycle: 'WEEKLY' }],
    ['max_employees', { max_employees: '0' }], ['max_employees', { max_employees: '2.5' }], ['features', { features: LONG(101) }],
  ]],
  ['Critical escalation', s.createEscalationSchema(['C001']), { company_id: 'C001', category: 'Billing', priority: 'High', assigned_team: 'Unassigned', description: '' }, [
    ['company_id', { company_id: '' }], ['category', { category: 'Gossip' }], ['priority', { priority: 'URGENT' }], ['assigned_team', { assigned_team: 'Ninjas' }],
  ]],
  ['Escalation comment', s.escalationCommentSchema, { comment: 'Following up.', note: '' }, [['comment', { comment: '' }], ['note', { note: LONG(1001) }]]],
  ['Platform settings', s.platformSettingsSchemas.platform, { platform_name: 'EmpTrack', support_email: 'support@emptrack.com', default_currency: 'INR', timezone: 'Asia/Kolkata' }, [
    ['platform_name', { platform_name: '' }], ['default_currency', { default_currency: 'RUPEE' }], ['timezone', { timezone: 'Mars/Olympus' }],
  ]],
  ['Security settings', s.platformSettingsSchemas.security, { passwordMinLength: '8', sessionTimeoutMinutes: '60', invitationExpiryHours: '72' }, [
    ['passwordMinLength', { passwordMinLength: '6' }], ['sessionTimeoutMinutes', { sessionTimeoutMinutes: '4' }], ['invitationExpiryHours', { invitationExpiryHours: '1000' }],
  ]],
  ['Date range (analytics)', s.dateRangeSchema({ fromRequired: true }), { from: day(-30), to: day(0) }, [['from', { from: '' }], ['to', { to: day(-31) }]]],
  ['Support ticket', s.supportTicketSchema({ statuses: ['OPEN', 'IN_PROGRESS'], categories: ['Billing'], dialog: 'reopen' }), {
    status: 'OPEN', priority: 'LOW', category: 'Billing', message: 'Hi there', note: 'Internal', escalationNote: '', dialogText: '', attachment: null,
  }, [
    ['status', { status: 'CLOSED' }], ['category', { category: 'Nonsense' }], ['message', { message: '' }], ['dialogText', { dialogText: LONG(501) }],
    ['attachment', { attachment: file('script.js') }],
  ]],
  ['Technical issue', s.technicalIssueSchema({ currentStatus: 'OPEN' }), {
    status: 'IN_PROGRESS', progress: '50', progressNote: '', resolution: 'Restarted the stuck worker.', submitNote: '', comment: 'Done', note: 'Root cause found', attachKind: 'LOG', pendingFile: file('app.log'),
  }, [
    ['status', { status: 'CLOSED' }], ['progress', { progress: '150' }], ['resolution', { resolution: 'fixed' }], ['note', { note: '' }],
    ['pendingFile', { pendingFile: null }], ['pendingFile', { pendingFile: file('shot.svg') }], ['pendingFile', { pendingFile: file('big.png', 6 * 1024 * 1024) }],
    ['attachKind', { attachKind: 'VIDEO' }],
  ]],
  ['Company registration details', s.companyDetailsSchema, {
    legal_name: 'Globex Pvt Ltd', business_type: 'PRIVATE_LIMITED', registration_number: 'U72200KA2015PTC123456', gstin: '29AAGCB7383J1Z4',
    company_email: 'a@globex.com', phone: '9876543210', address: '12 MG Road, Bengaluru', country: 'India', state: 'Karnataka', website: '',
  }, [
    ['legal_name', { legal_name: 'G' }], ['business_type', { business_type: 'TRUST' }], ['registration_number', { registration_number: '' }],
    ['registration_number', { registration_number: 'AAB-1234' }], ['registration_number', { business_type: 'LLP', registration_number: 'U72200KA2015PTC123456' }],
    ['gstin', { gstin: '29AAGCB7383J1' }], ['gstin', { country: 'Singapore', registration_number: '' }], ['company_email', { company_email: 'nope' }],
    ['phone', { phone: '12' }], ['address', { address: 'short' }], ['state', { state: '' }], ['website', { website: 'globex.com' }],
  ]],
  ['Company registration details (no CIN needed)', s.companyDetailsSchema, {
    legal_name: 'Ravi Stores', business_type: 'SOLE_PROPRIETORSHIP', registration_number: '', gstin: '',
    company_email: 'r@stores.com', phone: '9876543210', address: '1 Market Street, Pune', country: 'India', state: 'Maharashtra', website: 'https://stores.com',
  }, [['country', { country: '' }]]],
  ['Company registration admin', s.registrationAdminSchema, {
    admin_name: 'Priya Nair', admin_email: 'priya@globex.com', designation: 'Director', password: STRONG, confirm_password: STRONG, accept_terms: true,
  }, [
    ['admin_name', { admin_name: '1234' }], ['admin_name', { admin_name: 'administrator' }], ['admin_email', { admin_email: 'x' }],
    ['designation', { designation: '' }], ['designation', { designation: '@@' }], ['designation', { designation: '1234' }],
    ['password', { password: 'weakpass', confirm_password: 'weakpass' }], ['confirm_password', { confirm_password: 'Other@123' }], ['accept_terms', { accept_terms: false }],
  ]],
  ['Approve registration', s.approveRegistrationSchema(['PLAN-PRO'], ['PA001']), { platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' }, [
    ['platform_admin_id', { platform_admin_id: 'PA999' }], ['subscription_plan_id', { subscription_plan_id: '' }],
  ]],
  ['Reject registration', s.rejectRegistrationSchema, { reason: 'The certificate is unreadable.' }, [['reason', { reason: 'bad' }]]],
];

describe('company registration administrator name and designation rules', () => {
  it.each(['Li', 'Anne-Marie', "O'Connor", '\u0905\u0928\u0928\u094d\u092f\u093e \u0936\u0930\u094d\u092e\u093e', '\u674e\u96f7', 'A'.repeat(100)])('accepts valid administrator name %s', (admin_name) => {
    expect(validateForm(s.registrationAdminSchema, { admin_name, designation: 'Director' })).not.toHaveProperty('admin_name');
  });

  it.each(['', '   ', '12345', '@@@', '!!!', '###', 'administrator', 'A'.repeat(101)])('rejects invalid administrator name %s', (admin_name) => {
    expect(validateForm(s.registrationAdminSchema, { admin_name, designation: 'Director' })).toHaveProperty('admin_name');
  });

  it.each(['HR', 'HR Manager', 'Company Administrator', 'Chief Executive Officer', 'Co-Founder', 'Director', 'R&D Manager', "People Officer's Manager", 'Sr. HR Manager', 'Level 2 Manager', 'A'.repeat(80)])('accepts valid designation %s', (designation) => {
    expect(validateForm(s.registrationAdminSchema, { admin_name: 'Anne-Marie', designation })).not.toHaveProperty('designation');
  });

  it.each(['', '   ', '@@', '!!!', '###', '12345', 'A', 'A'.repeat(81)])('rejects invalid designation %s', (designation) => {
    expect(validateForm(s.registrationAdminSchema, { admin_name: 'Anne-Marie', designation })).toHaveProperty('designation');
  });
});

describe.each(FORMS)('%s form', (_name, schema, valid, invalid) => {
  it('accepts a valid submission', () => {
    expect(validateForm(schema, valid)).toEqual({});
  });

  it.each(invalid.map(([field, patch]) => [field, JSON.stringify(patch, (k, v) => (v instanceof File ? `File(${v.name})` : v)), patch]))(
    'rejects %s for %s',
    (field, _label, patch) => {
      const errors = validateForm(schema, { ...valid, ...patch });
      expect(Object.keys(errors)).toContain(field);
      expect(errors[field]).toEqual(expect.any(String));
    },
  );
});

it('covers every exported schema', () => {
  const tested = new Set(FORMS.map(([, schema]) => schema));
  const exported = Object.entries(s).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((r) => typeof r === 'function' || Array.isArray(r)));
  // Factories are called per form above; plain schema objects must appear directly (or via a parent group).
  const groups = [s.hrSettingsSchemas, s.platformSettingsSchemas];
  const untested = exported.filter(([, v]) => !tested.has(v) && !groups.includes(v));
  expect(untested.map(([name]) => name)).toEqual(['newAccountSchema', 'editAccountSchema']);
});
