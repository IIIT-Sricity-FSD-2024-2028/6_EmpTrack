// DEMO DATA ONLY - not a backend.
// Seed dataset for the Platform Admin and Support Member portals while
// VITE_API_URL is empty (the same rule that makes authService fall back to mock
// users). platformDemoBackend.js copies it into localStorage on first use; with a
// backend configured this file is never read.
//
// Records are copied from the backend seed (back-end/src/data/mock-data.service.ts):
// companies, plans, payments, the platform/support/technical team, the platform
// tickets TIX-001..TIX-017, critical escalations and activity logs. Relative
// dates use the same isoDate/isoTime helpers so the dashboards stay current.

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (daysAgo = 0) => new Date(Date.now() - daysAgo * DAY_MS).toISOString().split('T')[0];
const isoTime = (daysAgo = 0, hour = 10) => {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const TICKET_DEFAULTS = {
  comments: [],
  reassign_log: [],
  internal_notes: [],
  progress_percentage: 0,
  verification_status: null,
  verification_note: null,
  verified_by: null,
  verified_by_name: null,
  verified_at: null,
  resolution_notes: null,
  escalated_team: null,
  linked_technical_ticket_id: null,
  linked_from_ticket_id: null,
  linked_escalation_id: null,
  resolved_date: null,
};

/** Same guarantee as MockDataService.normalizeTicket: every workflow field exists. */
export function normalizeTicket(ticket) {
  return { ...TICKET_DEFAULTS, ...ticket };
}

const KIRAN = { raised_by_name: 'Kiran (Company Admin)', raised_by_id: 'AD001', raised_by_email: 'cmpadmin@emp.com' };
const NATASHA = { raised_by_name: 'Natasha Romanoff (Company Admin)', raised_by_id: 'AD002', raised_by_email: 'admin2@emp.com' };
const WAYNE_IT = { raised_by_name: 'Wayne Enterprises IT', raised_by_id: null, raised_by_email: 'it@wayneenterprises.com' };

function tickets() {
  return [
    { ticket_id: 'TIX-001', ticket_type: 'TECHNICAL', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'SSO login failures for Acme staff', category: 'Authentication', priority: 'High', status: 'OPEN', assigned_to: null, description: 'Multiple Acme employees report SSO redirect loop since this morning.', created_date: '2026-08-18', updated_date: '2026-08-18' },
    { ticket_id: 'TIX-002', ticket_type: 'TECHNICAL', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'Stark Industries API integration timing out', category: 'Integration', priority: 'Critical', status: 'IN_PROGRESS', assigned_to: 'TT002', description: 'Payroll export API calls are timing out after 30s for the Stark tenant.', created_date: '2026-08-10', updated_date: '2026-08-16', comments: [{ author: 'Bruce Banner', message: 'Reproduced; investigating DB connection pool exhaustion.', timestamp: '2026-08-16T10:00:00.000Z' }] },
    { ticket_id: 'TIX-003', ticket_type: 'TECHNICAL', company_id: 'C003', platform_admin_id: 'PA002', ...WAYNE_IT, title: 'Data export job stuck at 0%', category: 'Bug', priority: 'Medium', status: 'RESOLVED', assigned_to: 'TT003', description: "Nightly export job hasn't progressed in 3 days.", created_date: '2026-07-28', updated_date: '2026-08-01', resolved_date: '2026-08-01', comments: [{ author: 'Shuri Udaku', message: 'Fixed a stuck cron lock; job resumed.', timestamp: '2026-08-01T09:00:00.000Z' }] },
    { ticket_id: 'TIX-004', ticket_type: 'SUPPORT', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'Question about invoice for August', category: 'Billing', priority: 'Low', status: 'OPEN', assigned_to: null, description: 'Requesting a breakdown of the August Enterprise plan invoice.', created_date: '2026-08-20', updated_date: '2026-08-20' },
    { ticket_id: 'TIX-005', ticket_type: 'SUPPORT', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'How to bulk-import employees via CSV', category: 'Employee Management', priority: 'Medium', status: 'IN_PROGRESS', assigned_to: 'ST001', description: 'Need guidance on the CSV column format for bulk employee import.', created_date: '2026-08-14', updated_date: '2026-08-15', comments: [{ author: 'Sam Wilson', message: 'Sent the CSV template and a sample file.', timestamp: '2026-08-15T13:00:00.000Z' }], internal_notes: [{ author: 'Sam Wilson', message: 'Customer is on the Professional plan; CSV importer supports up to 200 rows.', timestamp: '2026-08-14T15:00:00.000Z' }] },
    { ticket_id: 'TIX-006', ticket_type: 'SUPPORT', company_id: 'C003', platform_admin_id: 'PA002', ...WAYNE_IT, title: 'Reactivate suspended account access for finance team', category: 'Account / Login', priority: 'High', status: 'OPEN', assigned_to: null, description: 'Finance team locked out since the company suspension; needs read-only access to close out August books.', created_date: '2026-08-21', updated_date: '2026-08-21' },
    { ticket_id: 'TIX-007', ticket_type: 'SUPPORT', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'Employees see wrong leave balance after policy update', category: 'Leave Management', priority: 'High', status: 'WAITING_FOR_CUSTOMER', assigned_to: 'ST001', description: 'Several employees report their carried-over leave balance dropped to zero after the new policy rollout.', created_date: '2026-08-12', updated_date: '2026-08-19', comments: [{ author: 'Sam Wilson', message: 'Could you share 2-3 affected employee IDs so we can check their ledgers?', timestamp: '2026-08-19T11:00:00.000Z' }], internal_notes: [{ author: 'Sam Wilson', message: 'Looks like the carry-over migration script may have skipped CASUAL leave types. Flagging for a closer look before escalating.', timestamp: '2026-08-19T11:05:00.000Z' }] },
    { ticket_id: 'TIX-008', ticket_type: 'SUPPORT', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'Attendance check-in unavailable company-wide', category: 'Attendance', priority: 'Critical', status: 'OPEN', assigned_to: null, description: 'Attendance system unavailable for entire company since 9 AM; nobody can check in.', created_date: '2026-08-24', updated_date: '2026-08-24' },
    { ticket_id: 'TIX-009', ticket_type: 'SUPPORT', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'How do I export the payroll report as CSV', category: 'Employee Management', priority: 'Low', status: 'CLOSED', assigned_to: 'ST001', description: 'Looking for a way to export the monthly payroll report as a CSV file.', created_date: '2026-07-05', updated_date: '2026-07-07', resolved_date: '2026-07-07', comments: [{ author: 'Sam Wilson', message: 'You can export it from Reports > Payroll > Export CSV. Closing this out.', timestamp: '2026-07-07T09:00:00.000Z' }] },
    { ticket_id: 'TIX-010', ticket_type: 'SUPPORT', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'Subscription invoice shows incorrect employee count', category: 'Billing', priority: 'Medium', status: 'RESOLVED', assigned_to: 'ST001', description: 'August invoice charges for 220 employees but we only have 200 active.', created_date: '2026-08-22', updated_date: '2026-08-24', resolved_date: '2026-08-24', comments: [{ author: 'Sam Wilson', message: 'Confirmed the discrepancy was due to 20 deactivated accounts; credit has been applied to your next invoice.', timestamp: '2026-08-24T08:30:00.000Z' }] },
    { ticket_id: 'TIX-011', ticket_type: 'TECHNICAL', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'Attendance sync job failing for the Acme night shift', category: 'Bug', priority: 'High', status: 'IN_PROGRESS', assigned_to: 'TT001', progress_percentage: 60, description: 'Check-ins recorded between 22:00 and 06:00 never reach the attendance ledger. Started after the timezone patch rollout.', created_date: isoDate(6), updated_date: isoDate(1), comments: [{ author: 'Wanda Maximoff', message: 'Confirmed the sync worker is dropping records whose shift crosses midnight. Working on a fix for the date-boundary handling.', timestamp: isoTime(2, 11) }] },
    { ticket_id: 'TIX-012', ticket_type: 'TECHNICAL', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'Stark tenant report exports return HTTP 500', category: 'Bug', priority: 'Critical', status: 'OPEN', assigned_to: 'TT001', description: 'Every report export for the Stark tenant fails immediately with a 500. Smaller tenants are unaffected.', created_date: isoDate(1), updated_date: isoDate(1) },
    { ticket_id: 'TIX-013', ticket_type: 'TECHNICAL', company_id: 'C001', platform_admin_id: 'PA001', raised_by_name: 'HR Manager', raised_by_id: 'HR001', raised_by_email: 'hr@emp.com', title: 'Leave balance recalculation is slow after policy change', category: 'Performance', priority: 'Medium', status: 'IN_PROGRESS', assigned_to: 'TT001', progress_percentage: 35, description: 'Recalculating balances for the whole company takes over 4 minutes and blocks the HR console while it runs.', created_date: isoDate(4), updated_date: isoDate(2) },
    { ticket_id: 'TIX-014', ticket_type: 'TECHNICAL', company_id: 'C002', platform_admin_id: 'PA001', raised_by_name: 'Tony Stark (TL)', raised_by_id: 'TL002', raised_by_email: 'tl2@emp.com', title: 'Task deadline reminders sent in the wrong timezone', category: 'Bug', priority: 'High', status: 'RESOLVED', assigned_to: 'TT001', progress_percentage: 100, description: 'Deadline reminder emails arrive 5.5 hours early for the Stark tenant.', created_date: isoDate(5), updated_date: isoDate(0), resolved_date: isoDate(0), comments: [{ author: 'Wanda Maximoff', message: 'Fixed: the reminder scheduler now resolves the tenant timezone instead of defaulting to the platform timezone. Verified against the Stark tenant.', timestamp: isoTime(0, 9) }], verification_status: 'PENDING_VERIFICATION', resolution_notes: 'Reminder scheduler now resolves the tenant timezone from the company record. Regression test added.' },
    { ticket_id: 'TIX-015', ticket_type: 'TECHNICAL', company_id: 'C001', platform_admin_id: 'PA001', ...KIRAN, title: 'Profile photo uploads rejected above 1 MB', category: 'Bug', priority: 'Low', status: 'CLOSED', assigned_to: 'TT001', progress_percentage: 100, description: 'Employees cannot upload profile photos larger than 1 MB even though the documented limit is 5 MB.', created_date: isoDate(21), updated_date: isoDate(16), resolved_date: isoDate(17), comments: [{ author: 'Wanda Maximoff', message: 'Upload proxy limit raised to match the documented 5 MB ceiling.', timestamp: isoTime(17, 14) }], verification_status: 'VERIFIED', verification_note: 'Confirmed against the Acme tenant.', verified_by: 'PA001', verified_by_name: 'Ravi Kumar', verified_at: isoTime(16, 10), resolution_notes: 'Raised the upload proxy body limit from 1 MB to 5 MB.' },
    { ticket_id: 'TIX-016', ticket_type: 'TECHNICAL', company_id: 'C002', platform_admin_id: 'PA001', ...NATASHA, title: 'Duplicate notifications on leave approval', category: 'Bug', priority: 'Medium', status: 'CLOSED', assigned_to: 'TT001', progress_percentage: 100, description: 'Approving a leave request sends the employee two identical notifications.', created_date: isoDate(30), updated_date: isoDate(25), resolved_date: isoDate(26), comments: [{ author: 'Wanda Maximoff', message: 'The approval handler was registered twice after the module refactor. Removed the duplicate registration.', timestamp: isoTime(26, 12) }], verification_status: 'VERIFIED', verified_by: 'PA001', verified_by_name: 'Ravi Kumar', verified_at: isoTime(25, 9), resolution_notes: 'Removed the duplicate leave-approval notification handler registration.' },
    { ticket_id: 'TIX-017', ticket_type: 'TECHNICAL', company_id: 'C001', platform_admin_id: 'PA001', raised_by_name: 'Rinku Singh (TL)', raised_by_id: 'TL001', raised_by_email: 'tl@emp.com', title: 'Work log chart renders blank on Safari', category: 'Bug', priority: 'Low', status: 'IN_PROGRESS', assigned_to: 'TT001', progress_percentage: 100, description: 'The work log chart is blank on Safari 17 but renders correctly on Chrome and Firefox.', created_date: isoDate(12), updated_date: isoDate(7), verification_status: 'REJECTED', verification_note: 'Still blank on Safari 16 - please cover the previous major version too.', verified_by: 'PA001', verified_by_name: 'Ravi Kumar', verified_at: isoTime(7, 11), resolution_notes: 'Replaced an unsupported canvas API call with the widely-supported equivalent.' },
  ].map(normalizeTicket);
}

const member = (emp_id, emp_name, email, phone, role, status, date_of_joining, platform_admin_id, specialization) => ({
  emp_id, emp_name, email, phone, role, status, date_of_joining, companyId: null, platform_admin_id, specialization,
});

const txn = (n, company_id, plan_id, amount, payment_date, payment_status) => ({
  transaction_id: `TXN-${String(n).padStart(3, '0')}`,
  company_id, plan_id, amount, currency: 'USD', billing_cycle: 'MONTHLY', payment_date, payment_status, payment_method: 'CARD', is_mock: false,
});

export function createDemoData() {
  return {
    employees: [
      { emp_id: 'PA001', emp_name: 'Ravi Kumar', email: 'ravi.platform@emptrack.com', phone: '9000000002', role: 'PLATFORM_ADMIN', status: 'ACTIVE', date_of_joining: '2023-06-01', companyId: null },
      { emp_id: 'PA002', emp_name: 'Anjali Sharma', email: 'anjali.platform@emptrack.com', phone: '9000000003', role: 'PLATFORM_ADMIN', status: 'ACTIVE', date_of_joining: '2024-02-01', companyId: null },
      { emp_id: 'AD001', emp_name: 'Kiran', email: 'cmpadmin@emp.com', phone: '1231231234', role: 'COMPANY_ADMIN', status: 'ACTIVE', date_of_joining: '2020-01-01', companyId: 'C001' },
      { emp_id: 'AD002', emp_name: 'Natasha Romanoff', email: 'admin2@emp.com', phone: '5556667777', role: 'COMPANY_ADMIN', status: 'ACTIVE', date_of_joining: '2023-03-01', companyId: 'C002' },
      member('TT001', 'Wanda Maximoff', 'wanda.tech@emptrack.com', '9000000010', 'TECHNICAL_MEMBER', 'ACTIVE', '2024-03-01', 'PA001', 'Infrastructure'),
      member('TT002', 'Bruce Banner', 'bruce.tech@emptrack.com', '9000000011', 'TECHNICAL_MEMBER', 'ACTIVE', '2024-05-15', 'PA001', 'Networking'),
      member('TT003', 'Shuri Udaku', 'shuri.tech@emptrack.com', '9000000012', 'TECHNICAL_MEMBER', 'ACTIVE', '2025-01-10', 'PA002', 'Platform/DevOps'),
      member('ST001', 'Sam Wilson', 'sam.support@emptrack.com', '9000000013', 'SUPPORT_MEMBER', 'ACTIVE', '2024-04-01', 'PA001', 'Billing Support'),
      member('ST002', 'Carol Ferris', 'carol.support@emptrack.com', '9000000014', 'SUPPORT_MEMBER', 'INACTIVE', '2024-07-01', 'PA001', 'General Support'),
      member('ST003', 'Diana Prince', 'diana.support@emptrack.com', '9000000015', 'SUPPORT_MEMBER', 'ACTIVE', '2025-02-01', 'PA002', 'Onboarding Support'),
    ],
    // The backend counts each company's (non Company Admin) employee records; the
    // demo does not carry those HR records, so it keeps the seed's resulting counts.
    employeeCounts: { C001: 9, C002: 7, C003: 0 },
    companies: [
      { company_id: 'C001', company_name: 'Acme Technologies', company_email: 'contact@acmetech.com', phone: '1234567890', industry: 'Information Technology', address: '123 Innovation Drive, Springfield', status: 'ACTIVE', subscription_plan_id: 'PLAN-ENT', platform_admin_id: 'PA001', created_date: '2024-01-01', last_payment_date: '2026-08-01', next_billing_date: '2026-09-01' },
      { company_id: 'C002', company_name: 'Stark Industries', company_email: 'contact@starkindustries.com', phone: '2223334444', industry: 'Manufacturing', address: '200 Park Avenue, New York', status: 'ACTIVE', subscription_plan_id: 'PLAN-PRO', platform_admin_id: 'PA001', created_date: '2023-03-01', last_payment_date: '2026-07-01', next_billing_date: '2026-08-01' },
      { company_id: 'C003', company_name: 'Wayne Enterprises', company_email: 'contact@wayneenterprises.com', phone: '3334445555', industry: 'Conglomerate', address: '1007 Mountain Drive, Gotham', status: 'SUSPENDED', subscription_plan_id: 'PLAN-BASIC', platform_admin_id: 'PA002', created_date: '2025-06-15', last_payment_date: '2026-06-15', next_billing_date: '2026-07-15' },
    ],
    plans: [
      { plan_id: 'PLAN-BASIC', name: 'Basic' },
      { plan_id: 'PLAN-PRO', name: 'Professional' },
      { plan_id: 'PLAN-ENT', name: 'Enterprise' },
    ],
    transactions: [
      ...[1, 2, 3, 4, 5, 6].map((n) => txn(n, 'C001', 'PLAN-ENT', 499, `2026-0${n + 2}-01`, 'PAID')),
      ...[7, 8, 9, 10, 11].map((n) => txn(n, 'C002', 'PLAN-PRO', 149, `2026-0${n - 4}-01`, 'PAID')),
      txn(12, 'C002', 'PLAN-PRO', 149, '2026-08-01', 'PENDING'),
      txn(13, 'C003', 'PLAN-BASIC', 49, '2026-06-15', 'PAID'),
      txn(14, 'C003', 'PLAN-BASIC', 49, '2026-07-15', 'FAILED'),
    ],
    ticketCategories: [
      'Account / Login', 'Company Setup', 'Employee Management', 'Attendance', 'Leave Management',
      'Recruitment', 'Tasks', 'Subscription', 'Billing', 'Technical Issue', 'Other',
    ],
    tickets: tickets(),
    criticalEscalations: [
      { issue_id: 'CESC-001', company_id: 'C002', raised_by: 'PA001', status: 'OPEN' },
      { issue_id: 'CESC-002', company_id: 'C003', raised_by: 'PA002', status: 'IN_PROGRESS' },
    ],
    activityLogs: [
      { activity_id: 'ACT-003', user_id: 'PA002', user_name: 'Anjali Sharma', role: 'PLATFORM_ADMIN', action: 'Company suspended', company_id: 'C003', company_name: 'Wayne Enterprises', details: 'Suspended due to failed payment', timestamp: '2026-08-10T14:15:00.000Z' },
      { activity_id: 'ACT-004', user_id: 'PA001', user_name: 'Ravi Kumar', role: 'PLATFORM_ADMIN', action: 'Support issue escalated', company_id: 'C002', company_name: 'Stark Industries', details: 'Escalated critical VPN outage to Technical Team', timestamp: '2026-08-15T11:00:00.000Z' },
    ],
    notifications: [],
  };
}
