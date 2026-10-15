import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { createValidationPipe } from './../src/common/validation/validators';
import { SessionService } from './../src/auth/session.service';
import { MockDataService } from './../src/data/mock-data.service';

// Field-level validation of every endpoint that creates or updates data. Each
// rejected request must answer 400 with the failing field in `errors`, and must
// leave the in-memory data store exactly as it was.

const DAY_MS = 24 * 60 * 60 * 1000;
const dateKey = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY_MS).toISOString().split('T')[0];
const STRONG = 'Valid@1234';
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a0a40000000049454e44ae426082', 'hex');
const dataUrl = (buf: Buffer, mime = 'image/png') => `data:${mime};base64,${buf.toString('base64')}`;

let app: INestApplication<App>;
let http: () => any;
let store: MockDataService;
const tokens: Record<string, string> = {};
const as = (empId: string) => ({ Authorization: `Bearer ${tokens[empId]}` });
const snapshot = () => JSON.stringify(store.data);
// Set up in beforeAll: a team that can take employees, and an open issue owned by TT001.
let teamId = '';
let tmIssue = '';
// Placeholders keep the case table (built before beforeAll) pointing at those records.
const tm = (action: string) => `/technical-member/issues/${tmIssue || '{TM}'}/${action}`;
const resolve = (text: string) => text.replace(/\{TM\}/g, tmIssue).replace(/\{TEAM\}/g, teamId);

beforeAll(async () => {
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'emptrack-uploads-'));
  const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  await app.init();
  http = () => request(app.getHttpServer());
  store = app.get(MockDataService);
  const sessions = app.get(SessionService);
  for (const id of ['EM001', 'EM002', 'TL001', 'HR001', 'AD001', 'SA001', 'PA001', 'ST001', 'TT001']) {
    tokens[id] = sessions.create(id).token;
  }
  const team = await http().post('/teams').set(as('AD001')).send({ team_name: 'Validation Team' }).expect(201);
  teamId = team.body.team_id ?? team.body.team?.team_id;
  await http().post(`/teams/${teamId}/lead`).set(as('AD001'))
    .send({ name: 'Kavya Rao', email: `kavya.${Date.now()}@emp.com`, phone: '9876501234', password: STRONG, confirmPassword: STRONG }).expect(201);
  const issues = await http().get('/technical-member/issues').set(as('TT001')).expect(200);
  const list = Array.isArray(issues.body) ? issues.body : issues.body.data || issues.body.issues || [];
  tmIssue = list.find((i: any) => ['OPEN', 'IN_PROGRESS'].includes(i.status))?.ticket_id;
  expect(tmIssue).toBeTruthy();
});

afterAll(async () => {
  await app.close();
});

type Method = 'post' | 'patch';

/** Sends the request, expects a 400 naming `field` (if given), and no data change. */
async function rejected(method: Method, url: string, who: string, body: object, field?: string) {
  url = resolve(url);
  body = JSON.parse(resolve(JSON.stringify(body)));
  const before = snapshot();
  const res = await http()[method](url).set(as(who)).send(body);
  expect({ url, field, status: res.status, body: res.body }).toEqual(expect.objectContaining({ status: 400 }));
  if (field) expect(Object.keys(res.body.errors || {})).toContain(field);
  expect(res.body.stack).toBeUndefined();
  expect(snapshot()).toBe(before);
  return res;
}

// ---- valid payloads (each case below breaks exactly one field) ------------
const company = () => ({
  company_name: 'Nilgiri Software',
  company_email: 'contact@nilgiri.example',
  phone: '+91 98765 43210',
  industry: 'Information Technology',
  address: '12 MG Road, Bengaluru',
  subscription_plan_id: 'PLAN-BASIC',
  platform_admin_id: 'PA001',
  admin_name: "Śrīnivās O'Neil-Kumar",
  admin_email: `admin.${Date.now()}@nilgiri.example`,
  admin_phone: '9876543210',
  admin_password: STRONG,
  admin_confirm_password: STRONG,
});
const employee = () => ({
  name: 'Ananya Iyer',
  email: `ananya.${Date.now()}@emp.com`,
  phone: '9876543210',
  password: STRONG,
  confirmPassword: STRONG,
  department_id: 'D02',
  team_id: teamId || '{TEAM}',
});
const account = () => ({ name: 'Meera Nair', email: `meera.${Date.now()}@emptrack.com`, phone: '9000012345', password: STRONG, confirmPassword: STRONG });
const leave = () => ({ leave_type: 'CASUAL', reason: 'Family function', start_date: dateKey(120), end_date: dateKey(121) });
const issue = () => ({ title: 'VPN keeps dropping', type: 'Technical Issue / Bug', priority: 'High', description: 'The VPN disconnects every ten minutes.' });
const task = () => ({ assigned_to: 'EM001', task_title: 'Write API docs', priority: 'Medium', deadline: dateKey(10), est_hours: 4 });
const worklog = () => ({
  task_id: 'TK001',
  task_title: 'Create Frontend Layout',
  start_time: `${dateKey(-1)}T09:00`,
  end_time: `${dateKey(-1)}T11:00`,
  hours_spent: 2,
  description: 'Built the header component.',
});
const plan = () => ({ name: 'Starter', price: 19.99, billing_cycle: 'MONTHLY', max_employees: 25, features: ['Attendance Tracking'] });

const long = (n: number) => 'a'.repeat(n);

describe('field validation (each case: 400, field named, nothing changed)', () => {
  const cases: [string, Method, string, string, object, string][] = [
    // auth
    ['login: malformed email', 'post', '/auth/login', 'EM001', { email: 'emp@', password: 'x' }, 'email'],
    ['login: email with spaces', 'post', '/auth/login', 'EM001', { email: 'emp @emp.com', password: 'x' }, 'email'],
    ['login: missing password', 'post', '/auth/login', 'EM001', { email: 'emp@emp.com' }, 'password'],
    // attendance
    ['check-in: unknown mode', 'post', '/attendance/check-in', 'EM002', { mode: 'MOON' }, 'mode'],
    // calendar
    ['event: whitespace title', 'post', '/calendar/events', 'EM001', { title: '   ', date: dateKey(3) }, 'title'],
    ['event: impossible date', 'post', '/calendar/events', 'EM001', { title: 'Dentist', date: '2026-02-30' }, 'date'],
    ['event: invalid time', 'post', '/calendar/events', 'EM001', { title: 'Dentist', date: dateKey(3), time: '25:61' }, 'time'],
    ['event: unknown type', 'post', '/calendar/events', 'EM001', { title: 'Dentist', date: dateKey(3), type: 'PARTY' }, 'type'],
    ['event: title too long', 'post', '/calendar/events', 'EM001', { title: long(151), date: dateKey(3) }, 'title'],
    ['company event: unknown role', 'post', '/calendar/company-events', 'HR001', { title: 'Town hall', date: dateKey(3), visible_to_roles: ['GOD'] }, 'visible_to_roles'],
    // companies
    ['company: whitespace name', 'post', '/companies', 'SA001', { ...company(), company_name: '   ' }, 'company_name'],
    ['company: invalid email', 'post', '/companies', 'SA001', { ...company(), company_email: 'contact@' }, 'company_email'],
    ['company: alphabetic phone', 'post', '/companies', 'SA001', { ...company(), phone: '98765abcde' }, 'phone'],
    ['company: short +91 phone', 'post', '/companies', 'SA001', { ...company(), phone: '+91 12345 6789' }, 'phone'],
    ['company: too few digits', 'post', '/companies', 'SA001', { ...company(), phone: '12345' }, 'phone'],
    ['company: address too short', 'post', '/companies', 'SA001', { ...company(), address: 'abc' }, 'address'],
    ['company: unknown status', 'post', '/companies', 'SA001', { ...company(), status: 'DELETED' }, 'status'],
    ['company: weak admin password', 'post', '/companies', 'SA001', { ...company(), admin_password: 'password', admin_confirm_password: 'password' }, 'admin_password'],
    ['company: admin name with markup', 'post', '/companies', 'SA001', { ...company(), admin_name: '<script>x</script>' }, 'admin_name'],
    ['company: control characters', 'post', '/companies', 'SA001', { ...company(), industry: 'IT\u0000\u0007' }, 'industry'],
    ['company update: blank name', 'patch', '/companies/C001', 'SA001', { company_name: '' }, 'company_name'],
    ['company status: unknown value', 'patch', '/companies/C001/status', 'SA001', { status: 'DELETED' }, 'status'],
    ['company reassign: bad id', 'patch', '/companies/C001/reassign', 'SA001', { platform_admin_id: '../PA001' }, 'platform_admin_id'],
    ['company admin: bad phone', 'post', '/companies/C001/admins', 'SA001', { ...account(), phone: 'phone' }, 'phone'],
    ['company admin update: bad email', 'patch', '/companies/C001/admins/AD001', 'SA001', { email: 'nope' }, 'email'],
    ['company admin status: unknown', 'patch', '/companies/C001/admins/AD001/status', 'SA001', { status: 'BANNED' }, 'status'],
    // critical escalations
    ['critical escalation: unknown category', 'post', '/critical-escalations', 'SA001', { company_id: 'C001', category: 'Gossip', priority: 'High' }, 'category'],
    ['critical escalation: unknown priority', 'post', '/critical-escalations', 'SA001', { company_id: 'C001', category: 'Billing', priority: 'Urgent' }, 'priority'],
    ['critical escalation: unknown team', 'patch', '/critical-escalations/CESC-001/assign', 'SA001', { assigned_team: 'Ninjas' }, 'assigned_team'],
    ['critical escalation: blank comment', 'post', '/critical-escalations/CESC-001/comments', 'SA001', { message: '  ' }, 'message'],
    // employees
    ['employee: digits in name', 'post', '/employees', 'AD001', { ...employee(), name: 'J0hn' }, 'name'],
    ['employee: name too long', 'post', '/employees', 'AD001', { ...employee(), name: long(101) }, 'name'],
    ['employee: bad department id', 'post', '/employees', 'AD001', { ...employee(), department_id: '../D02' }, 'department_id'],
    ['employee: weak password', 'post', '/employees', 'AD001', { ...employee(), password: 'abc12345', confirmPassword: 'abc12345' }, 'password'],
    ['employee update: blank name', 'patch', '/employees/EM002', 'AD001', { emp_name: '   ' }, 'emp_name'],
    ['employee update: bad phone', 'patch', '/employees/EM002', 'AD001', { phone: '1' }, 'phone'],
    ['password: weak new password', 'patch', '/employees/EM001/password', 'EM001', { currentPassword: 'Password@123', newPassword: 'weakpass', confirmPassword: 'weakpass' }, 'newPassword'],
    ['password: over-long new password', 'patch', '/employees/EM001/password', 'EM001', { currentPassword: 'Password@123', newPassword: `Aa1@${long(70)}` }, 'newPassword'],
    // escalations
    ['escalation: reason too short', 'post', '/escalations', 'HR001', { reference_type: 'Workload', reference_id: 'EM001', escalated_to: 'HR', escalation_reason: 'help' }, 'escalation_reason'],
    // invitations
    ['invitation: weak password', 'post', '/invitations/any-token/accept', 'EM001', { password: 'short' }, 'password'],
    // issues
    ['issue: whitespace title', 'post', '/issues', 'EM001', { ...issue(), title: '   ' }, 'title'],
    ['issue: description too short', 'post', '/issues', 'EM001', { ...issue(), description: 'broken' }, 'description'],
    ['issue: unknown priority', 'post', '/issues', 'EM001', { ...issue(), priority: 'Urgent' }, 'priority'],
    ['issue update: unknown status', 'patch', '/issues/ISS-001', 'TL001', { status: 'Done' }, 'status'],
    ['issue update: bad deadline', 'patch', '/issues/ISS-001', 'TL001', { deadline: 'soon' }, 'deadline'],
    ['issue update: non-numeric time spent', 'patch', '/issues/ISS-001', 'TL001', { resolution: { type: 'Fixed', time_spent: 'abc', root_cause: 'A config typo.', actions_taken: 'Fixed the config.' } }, 'resolution.time_spent'],
    ['issue update: malformed update entry', 'patch', '/issues/ISS-001', 'TL001', { updates: [{ sender: 'TL001' }] }, 'updates.0.message'],
    // leaves
    ['leave: end before start', 'post', '/leaves', 'EM002', { ...leave(), start_date: dateKey(130), end_date: dateKey(129) }, 'end_date'],
    ['leave: malformed date', 'post', '/leaves', 'EM002', { ...leave(), start_date: '31/12/2026' }, 'start_date'],
    ['leave: whitespace reason', 'post', '/leaves', 'EM002', { ...leave(), reason: '    ' }, 'reason'],
    ['leave: unknown type', 'post', '/leaves', 'EM002', { ...leave(), leave_type: 'FOREVER' }, 'leave_type'],
    ['leave decision: reason too short', 'patch', '/leaves/LR-015/status', 'TL001', { status: 'REJECTED', reject_reason: 'no' }, 'reject_reason'],
    // notifications
    ['notification: script link', 'post', '/notifications', 'TL001', { employee_id: 'EM001', message: 'Hi', link: 'javascript:alert(1)' }, 'link'],
    ['notification: off-site link', 'post', '/notifications', 'TL001', { employee_id: 'EM001', message: 'Hi', link: '//evil.example' }, 'link'],
    ['notification: empty message', 'post', '/notifications', 'TL001', { employee_id: 'EM001', message: '' }, 'message'],
    // payments
    ['payment: bad company id', 'post', '/payments/mock/complete', 'AD001', { companyId: 'C001; drop' }, 'companyId'],
    // platform admins
    ['platform admin: bad email', 'post', '/platform-admins', 'SA001', { ...account(), email: 'meera@' }, 'email'],
    ['platform admin update: blank phone', 'patch', '/platform-admins/PA002', 'SA001', { phone: '' }, 'phone'],
    ['platform admin status: unknown', 'patch', '/platform-admins/PA002/status', 'SA001', { status: 'PENDING' }, 'status'],
    // platform settings
    ['settings: currency format', 'patch', '/platform-settings', 'SA001', { default_currency: 'usd1' }, 'default_currency'],
    ['settings: unknown timezone', 'patch', '/platform-settings', 'SA001', { timezone: 'Mars/Olympus' }, 'timezone'],
    ['settings: password length below policy', 'patch', '/platform-settings', 'SA001', { security_settings: { passwordMinLength: 4 } }, 'security_settings.passwordMinLength'],
    ['settings: non-boolean toggle', 'patch', '/platform-settings', 'SA001', { notification_settings: { weeklyDigest: 'yes' } }, 'notification_settings.weeklyDigest'],
    // platform team
    ['support member: bad phone', 'post', '/support-team', 'PA001', { name: 'Ravi Teja', email: `ravi.${Date.now()}@emptrack.com`, phone: '+91 55555 55555' }, 'phone'],
    ['technical member: name too short', 'post', '/technical-team', 'PA001', { name: 'R', email: `r.${Date.now()}@emptrack.com`, phone: '9000012345' }, 'name'],
    ['team member status: unknown', 'patch', '/support-team/ST001/status', 'PA001', { status: 'GONE' }, 'status'],
    // tickets
    ['raise ticket: short title', 'post', '/company/tickets', 'AD001', { title: 'Hi', description: 'Payroll export is failing again.' }, 'title'],
    ['raise ticket: unknown type', 'post', '/company/tickets', 'AD001', { title: 'Payroll export', description: 'Payroll export is failing again.', ticket_type: 'HACK' }, 'ticket_type'],
    ['reassign: missing reason', 'patch', '/support-tickets/TIX-004/reassign', 'PA001', { assigned_to: 'ST001', reason: '' }, 'reason'],
    ['assign: blank assignee', 'patch', '/technical-issues/TIX-001/assign', 'PA001', { assigned_to: '' }, 'assigned_to'],
    ['ticket comment: blank', 'post', '/support-tickets/TIX-004/comments', 'PA001', { message: ' ' }, 'message'],
    ['support status: unknown', 'patch', '/support-member/tickets/TIX-005/status', 'ST001', { status: 'DONE' }, 'status'],
    ['support priority: unknown', 'patch', '/support-member/tickets/TIX-005/priority', 'ST001', { priority: 'P0' }, 'priority'],
    ['support internal note: blank', 'post', '/support-member/tickets/TIX-005/internal-notes', 'ST001', { message: '' }, 'message'],
    // subscriptions
    ['plan: negative price', 'post', '/subscriptions', 'SA001', { ...plan(), price: -1 }, 'price'],
    ['plan: price as text', 'post', '/subscriptions', 'SA001', { ...plan(), price: '19.99' }, 'price'],
    ['plan: three decimals', 'post', '/subscriptions', 'SA001', { ...plan(), price: 1.999 }, 'price'],
    ['plan: unknown billing cycle', 'post', '/subscriptions', 'SA001', { ...plan(), billing_cycle: 'WEEKLY' }, 'billing_cycle'],
    ['plan: fractional max employees', 'post', '/subscriptions', 'SA001', { ...plan(), max_employees: 2.5 }, 'max_employees'],
    ['plan: zero max employees', 'post', '/subscriptions', 'SA001', { ...plan(), max_employees: 0 }, 'max_employees'],
    ['plan: blank feature', 'post', '/subscriptions', 'SA001', { ...plan(), features: ['Leave', ' '] }, 'features'],
    ['plan status: unknown', 'patch', '/subscriptions/PLAN-BASIC/status', 'SA001', { status: 'ARCHIVED' }, 'status'],
    // tasks
    ['task: short title', 'post', '/tasks', 'TL001', { ...task(), task_title: 'ab' }, 'task_title'],
    ['task: unknown priority', 'post', '/tasks', 'TL001', { ...task(), priority: 'P1' }, 'priority'],
    ['task: malformed deadline', 'post', '/tasks', 'TL001', { ...task(), deadline: '2026-13-01' }, 'deadline'],
    ['task: non-numeric hours', 'post', '/tasks', 'TL001', { ...task(), est_hours: '4abc' }, 'est_hours'],
    ['task: negative hours', 'post', '/tasks', 'TL001', { ...task(), est_hours: -2 }, 'est_hours'],
    ['task: too many hours', 'post', '/tasks', 'TL001', { ...task(), est_hours: 1001 }, 'est_hours'],
    ['task update: progress over 100', 'patch', '/tasks/TK001', 'EM001', { progress_percentage: 150 }, 'progress_percentage'],
    ['task update: fractional progress', 'patch', '/tasks/TK001', 'EM001', { progress_percentage: 50.5 }, 'progress_percentage'],
    ['task update: unknown status', 'patch', '/tasks/TK001', 'EM001', { status: 'DONE' }, 'status'],
    // teams
    ['team: blank name', 'post', '/teams', 'AD001', { team_name: ' ' }, 'team_name'],
    // technical member
    ['tm status: not allowed', 'patch', tm('status'), 'TT001', { status: 'CLOSED' }, 'status'],
    ['tm progress: over 100', 'patch', tm('progress'), 'TT001', { progress_percentage: 101 }, 'progress_percentage'],
    ['tm note: blank', 'post', tm('notes'), 'TT001', { message: '' }, 'message'],
    ['tm attachment: path in file name', 'post', tm('attachments'), 'TT001', { file_name: '../../etc/passwd.txt', data_url: dataUrl(Buffer.from('hi'), 'text/plain') }, 'file_name'],
    ['tm attachment: not a data URL', 'post', tm('attachments'), 'TT001', { file_name: 'a.png', data_url: 'http://evil.example/a.png' }, 'data_url'],
    ['tm attachment: missing contents', 'post', tm('attachments'), 'TT001', { file_name: 'a.png' }, 'data_url'],
    ['tm resolve: notes too short', 'patch', tm('resolve'), 'TT001', { resolution_notes: 'fixed' }, 'resolution_notes'],
    // worklogs
    ['worklog: end before start', 'post', '/worklogs', 'EM001', { ...worklog(), end_time: `${dateKey(-1)}T08:00` }, 'end_time'],
    ['worklog: malformed start', 'post', '/worklogs', 'EM001', { ...worklog(), start_time: 'yesterday 9am' }, 'start_time'],
    ['worklog: hours over 24', 'post', '/worklogs', 'EM001', { ...worklog(), hours_spent: 25 }, 'hours_spent'],
    ['worklog: hours as text', 'post', '/worklogs', 'EM001', { ...worklog(), hours_spent: 'two' }, 'hours_spent'],
    ['worklog: blank description', 'post', '/worklogs', 'EM001', { ...worklog(), description: '' }, 'description'],
  ];

  it.each(cases)('%s', (_name, method, url, who, body, field) => rejected(method, url, who, body, field));
});

describe('business rules and references (400, nothing changed)', () => {
  it('rejects an unknown subscription plan on company create and update', async () => {
    await rejected('post', '/companies', 'SA001', { ...company(), subscription_plan_id: 'PLAN-NOPE' });
    await rejected('patch', '/companies/C001', 'SA001', { subscription_plan_id: 'PLAN-NOPE' });
  });

  it('rejects mismatched password confirmation', () =>
    rejected('post', '/employees', 'AD001', { ...employee(), confirmPassword: 'Other@1234' }));

  it('rejects an escalation for a company that does not exist', () =>
    rejected('post', '/critical-escalations', 'SA001', { company_id: 'C999', category: 'Billing', priority: 'High' }));

  it("rejects linking an issue to another employee's task", () =>
    rejected('post', '/issues', 'EM001', { ...issue(), related_task: 'TK002' }));

  it('rejects a task deadline in the past', () => rejected('post', '/tasks', 'TL001', { ...task(), deadline: dateKey(-1) }));

  it('rejects an email already used by another account, ignoring case', async () => {
    await rejected('post', '/platform-admins', 'SA001', { ...account(), email: 'EMP@emp.com' });
    await rejected('patch', '/platform-admins/PA002', 'SA001', { email: 'Ravi.Platform@emptrack.com' });
    await rejected('patch', '/companies/C001/admins/AD001', 'SA001', { email: 'hr@emp.com' });
  });

  it('rejects a ticket category that is not configured', () =>
    rejected('patch', '/support-member/tickets/TIX-005/category', 'ST001', { category: 'Nonsense' }));

  it('rejects attachments whose bytes do not match the extension or declared size', async () => {
    await rejected('post', tm('attachments'), 'TT001', { file_name: 'shot.png', data_url: dataUrl(Buffer.from('<html>not a png</html>')) });
    await rejected('post', tm('attachments'), 'TT001', { file_name: 'run.exe', data_url: dataUrl(PNG) });
    await rejected('post', tm('attachments'), 'TT001', { file_name: 'shot.png', file_size: 1, data_url: dataUrl(PNG) });
  });

  it('rejects multipart uploads whose content does not match the extension', async () => {
    const before = snapshot();
    await http().post('/uploads/profile-image').set(as('EM001'))
      .attach('file', Buffer.from('MZ fake executable'), { filename: 'me.png', contentType: 'image/png' }).expect(400);
    expect(snapshot()).toBe(before);
  });

  it('rejects malformed query parameters', async () => {
    await http().get('/analytics/company-growth?from=garbage').set(as('SA001')).expect(400);
    await http().get(`/analytics/company-growth?from=${dateKey(0)}&to=${dateKey(-5)}`).set(as('SA001')).expect(400);
    await http().get('/analytics/company-growth?range=forever').set(as('SA001')).expect(400);
    await http().get('/calendar/holidays?month=13').set(as('EM001')).expect(400);
    await http().get('/calendar/holidays?year=abc').set(as('EM001')).expect(400);
    await http().get('/technical-member/work-progress?days=abc').set(as('TT001')).expect(400);
    await http().get('/technical-member/recent-updates?limit=1000').set(as('TT001')).expect(400);
  });
});

describe('authorization is checked independently of validation', () => {
  it('rejects requests without a token', () => http().post('/subscriptions').send(plan()).expect(401));

  it('rejects valid data from a role that may not use the endpoint', async () => {
    const before = snapshot();
    await http().post('/subscriptions').set(as('EM001')).send(plan()).expect(403);
    await http().patch('/platform-settings').set(as('AD001')).send({ platform_name: 'Hijacked' }).expect(403);
    await http().post('/employees').set(as('EM001')).send(employee()).expect(403);
    expect(snapshot()).toBe(before);
  });

  it('strips fields a DTO does not declare (no mass assignment)', async () => {
    const res = await http().patch('/employees/EM002').set(as('AD001'))
      .send({ phone: '9123456780', role: 'SUPER_ADMIN', companyId: 'C002', password: 'x' }).expect(200);
    expect(res.body.role).toBe('EMPLOYEE');
    expect(res.body.companyId).toBe('C001');
    const settings = await http().patch('/platform-settings').set(as('SA001'))
      .send({ role_permissions: { EMPLOYEE: ['Everything'] }, injected: true }).expect(200);
    expect(settings.body.role_permissions.EMPLOYEE).toBeUndefined();
    expect(settings.body.injected).toBeUndefined();
  });
});

describe('valid input and boundary values are accepted', () => {
  it('accepts an international name, +91 phone and trims surrounding spaces', async () => {
    const body = { ...company(), company_name: '  Nilgiri Software  ' };
    const res = await http().post('/companies').set(as('SA001')).send(body).expect(201);
    expect(res.body.company.company_name).toBe('Nilgiri Software');
    const admin = store.getEmployees().find((e) => e.email === body.admin_email);
    expect(admin.emp_name).toBe("Śrīnivās O'Neil-Kumar");
    expect(admin.password).not.toBe(STRONG);
  });

  it('accepts names at the 100-character limit', async () => {
    await http().post('/employees').set(as('AD001')).send({ ...employee(), name: `A${'b'.repeat(99)}` }).expect(201);
  });

  it('accepts titles at the 150-character limit', () =>
    http().post('/calendar/events').set(as('EM001')).send({ title: long(150), date: dateKey(3), time: '09:30', type: 'MEETING' }).expect(201));

  it('accepts a same-day leave and a short real reason', () =>
    http().post('/leaves').set(as('EM002')).send({ ...leave(), reason: 'Flu', start_date: dateKey(140), end_date: dateKey(140) }).expect(201));

  it('accepts numeric-string estimated hours and boundary plan values', async () => {
    await http().post('/tasks').set(as('TL001')).send({ ...task(), est_hours: '0.5', deadline: dateKey(0) }).expect(201);
    await http().post('/subscriptions').set(as('SA001')).send({ ...plan(), price: 0, max_employees: 1 }).expect(201);
  });

  it('accepts progress 0 and 100 and a 24-hour work log', async () => {
    await http().patch('/tasks/TK001').set(as('EM001')).send({ progress_percentage: 0 }).expect(200);
    await http().patch('/tasks/TK001').set(as('EM001')).send({ progress_percentage: 100 }).expect(200);
    await http().post('/worklogs').set(as('EM001'))
      .send({ ...worklog(), start_time: `${dateKey(-3)}T00:00`, end_time: `${dateKey(-2)}T00:00`, hours_spent: 24 }).expect(201);
  });

  it('stores a profile edit under emp_name (fixes name edits being lost)', async () => {
    const res = await http().patch('/platform-admins/PA002').set(as('SA001')).send({ name: 'Anjali S. Sharma' }).expect(200);
    expect(store.getEmployees().find((e) => e.emp_id === 'PA002').emp_name).toBe('Anjali S. Sharma');
    expect(res.body).toBeDefined();
  });

  it('accepts a real PNG attachment and records the verified type and size', async () => {
    const res = await http().post(tm('attachments')).set(as('TT001'))
      .send({ file_name: 'screen.png', file_type: 'application/x-forged', file_size: PNG.length, data_url: dataUrl(PNG, 'text/html') });
    expect(res.status).toBe(201);
    expect(res.body.file_type).toBe('image/png');
    expect(res.body.file_size).toBe(PNG.length);
  });

  it('accepts a partial settings update without wiping sibling settings', async () => {
    const res = await http().patch('/platform-settings').set(as('SA001'))
      .send({ default_currency: 'INR', timezone: 'Asia/Kolkata', security_settings: { sessionTimeoutMinutes: 30 } }).expect(200);
    expect(res.body.default_currency).toBe('INR');
    expect(res.body.security_settings.sessionTimeoutMinutes).toBe(30);
    expect(res.body.security_settings.passwordMinLength).toBe(8);
  });

  it('accepts a real PNG multipart upload', () =>
    http().post('/uploads/profile-image').set(as('EM001')).attach('file', PNG, { filename: 'me.png', contentType: 'image/png' }).expect(201));
});
