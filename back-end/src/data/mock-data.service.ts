import { Injectable, Optional } from '@nestjs/common';
import { hashPassword } from '../common/utils/password.util';
import { WorkflowPersistenceService } from './workflow-persistence.service';

// Relative-date helpers for the seed data. Ticket timelines are seeded relative to
// "now" so demo dashboards (Resolved Today, the 7-day work progress chart, recent
// updates) stay populated whenever the server is started, instead of only on the
// day the fixtures happened to be written.
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (daysAgo = 0) => new Date(Date.now() - daysAgo * DAY_MS).toISOString().split('T')[0];
const isoTime = (daysAgo = 0, hour = 10) => {
    const d = new Date(Date.now() - daysAgo * DAY_MS);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

const INITIAL_MOCK_DATA = {
    employee: [
        { emp_id: "AD001", emp_name: "Kiran", email: "cmpadmin@emptrack.com", phone: "1231231234", password: "Password@123", role: "COMPANY_ADMIN", status: "ACTIVE", date_of_joining: "2020-01-01", department_id: "D00", team_id: "T00", companyId: "C001" },
        { emp_id: "HR001", emp_name: "HR Manager", email: "hr@emptrack.com", phone: "1234567890", password: "Password@123", role: "HR", status: "ACTIVE", date_of_joining: "2024-01-01", department_id: "D01", team_id: "T01", companyId: "C001" },
        { emp_id: "TL001", emp_name: "Rinku Singh (TL)", email: "tl@emptrack.com", phone: "0987654321", password: "Password@123", role: "TEAMLEAD", status: "ACTIVE", date_of_joining: "2024-06-01", department_id: "D02", team_id: "T02", companyId: "C001" },
        { emp_id: "EM001", emp_name: "John Doe (EMP)", email: "emp@emptrack.com", phone: "1112223333", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-01-15", department_id: "D02", team_id: "T02", manager_id: "TL001", companyId: "C001" },
        { emp_id: "EM002", emp_name: "Jane Smith (EMP)", email: "jane@emptrack.com", phone: "4445556666", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-02-10", department_id: "D02", team_id: "T02", manager_id: "TL001", companyId: "C001" },

        // Second company - seeded to prove calendar tenant isolation (see CalendarService)
        { emp_id: "AD002", emp_name: "Natasha Romanoff", email: "admin2@emptrack.com", phone: "5556667777", password: "Password@123", role: "COMPANY_ADMIN", status: "ACTIVE", date_of_joining: "2023-03-01", department_id: "D00", team_id: "T00", companyId: "C002" },
        { emp_id: "HR002", emp_name: "Carol Danvers (HR)", email: "hr2@emptrack.com", phone: "2223334444", password: "Password@123", role: "HR", status: "ACTIVE", date_of_joining: "2023-03-01", department_id: "D01", team_id: "T10", companyId: "C002" },
        { emp_id: "TL002", emp_name: "Tony Stark (TL)", email: "tl2@emptrack.com", phone: "3334445555", password: "Password@123", role: "TEAMLEAD", status: "ACTIVE", date_of_joining: "2023-05-01", department_id: "D02", team_id: "T11", companyId: "C002" },
        { emp_id: "EM003", emp_name: "Peter Parker (EMP)", email: "emp3@emptrack.com", phone: "4445556677", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2024-09-01", department_id: "D02", team_id: "T11", manager_id: "TL002", companyId: "C002" },

        // Platform-level accounts - not tied to any single company (companyId: null)
        { emp_id: "SA001", emp_name: "Alex Morgan", email: "superadmin@emptrack.com", phone: "9000000001", password: "Password@123", role: "SUPER_ADMIN", status: "ACTIVE", date_of_joining: "2023-01-01", companyId: null },
        { emp_id: "PA001", emp_name: "Ravi Kumar", email: "ravi.platform@emptrack.com", phone: "9000000002", password: "Password@123", role: "PLATFORM_ADMIN", status: "ACTIVE", date_of_joining: "2023-06-01", companyId: null },
        { emp_id: "PA002", emp_name: "Anjali Sharma", email: "anjali.platform@emptrack.com", phone: "9000000003", password: "Password@123", role: "PLATFORM_ADMIN", status: "ACTIVE", date_of_joining: "2024-02-01", companyId: null },
        { emp_id: "PA003", emp_name: "Karthik R", email: "karthik.platform@emptrack.com", phone: "9000000004", password: "Password@123", role: "PLATFORM_ADMIN", status: "INACTIVE", date_of_joining: "2024-08-01", companyId: null },

        // Technical / Support Member staff - managed by a Platform Admin, platform-level (no companyId)
        { emp_id: "TT001", emp_name: "Wanda Maximoff", email: "wanda.tech@emptrack.com", phone: "9000000010", password: "Password@123", role: "TECHNICAL_MEMBER", status: "ACTIVE", date_of_joining: "2024-03-01", companyId: null, platform_admin_id: "PA001", specialization: "Infrastructure" },
        { emp_id: "TT002", emp_name: "Bruce Banner", email: "bruce.tech@emptrack.com", phone: "9000000011", password: "Password@123", role: "TECHNICAL_MEMBER", status: "ACTIVE", date_of_joining: "2024-05-15", companyId: null, platform_admin_id: "PA001", specialization: "Networking" },
        { emp_id: "TT003", emp_name: "Shuri Udaku", email: "shuri.tech@emptrack.com", phone: "9000000012", password: "Password@123", role: "TECHNICAL_MEMBER", status: "ACTIVE", date_of_joining: "2025-01-10", companyId: null, platform_admin_id: "PA002", specialization: "Platform/DevOps" },
        { emp_id: "ST001", emp_name: "Sam Wilson", email: "sam.support@emptrack.com", phone: "9000000013", password: "Password@123", role: "SUPPORT_MEMBER", status: "ACTIVE", date_of_joining: "2024-04-01", companyId: null, platform_admin_id: "PA001", specialization: "Billing Support" },
        { emp_id: "ST002", emp_name: "Carol Ferris", email: "carol.support@emptrack.com", phone: "9000000014", password: "Password@123", role: "SUPPORT_MEMBER", status: "INACTIVE", date_of_joining: "2024-07-01", companyId: null, platform_admin_id: "PA001", specialization: "General Support" },
        { emp_id: "ST003", emp_name: "Diana Prince", email: "diana.support@emptrack.com", phone: "9000000015", password: "Password@123", role: "SUPPORT_MEMBER", status: "ACTIVE", date_of_joining: "2025-02-01", companyId: null, platform_admin_id: "PA002", specialization: "Onboarding Support" }
    ],
    attendance: [
        { attendance_id: "A001", emp_id: "EM001", attendance_date: "2026-03-07", attendance_mode: "OFFICE", check_in_time: "09:00", check_out_time: "15:30", screen_time: 390, hours_spent: 6, remarks: "On track", status: "PRESENT" },
        { attendance_id: "A002", emp_id: "EM001", attendance_date: "2026-03-05", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: 0, remarks: "Absent", status: "ABSENT" },
        { attendance_id: "A003", emp_id: "EM001", attendance_date: "2026-03-02", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: 0, remarks: "Off day", status: "WEEKEND" },
        { attendance_id: "A004", emp_id: "EM001", attendance_date: "2026-02-27", attendance_mode: "REMOTE", check_in_time: "09:00", check_out_time: "13:00", screen_time: 240, hours_spent: 4, remarks: "Below target", status: "ESCALATED" }
    ],
    leave_details: [
        { leave_id: "LR-015", emp_id: "EM001", start_date: "2026-03-20", end_date: "2026-03-25", days: "6", leave_type: "CASUAL", reason: "Family vacation", routed_to: "TEAMLEAD", approver_id: "TL001", status: "PENDING", applied_date: "2026-03-07", approved_date: null, approved_by: null, reject_reason: null },
        { leave_id: "LR-012", emp_id: "EM001", start_date: "2026-03-10", end_date: "2026-03-10", days: "1", leave_type: "SICK", reason: "Fever and cold symptom management.", routed_to: "TEAMLEAD", approver_id: "TL001", status: "APPROVED", applied_date: "2026-03-09", approved_date: "2026-03-09", approved_by: "TL001", reject_reason: null },
        { leave_id: "LR-008", emp_id: "EM001", start_date: "2026-02-15", end_date: "2026-02-16", days: "2", leave_type: "UNPAID", reason: "Personal appointments", routed_to: "TEAMLEAD", approver_id: "TL001", status: "REJECTED", applied_date: "2026-02-10", approved_date: "2026-02-11", approved_by: "TL001", reject_reason: "Insufficient notice period during critical delivery milestone." }
    ],
    task: [
        { task_id: "TK001", task_title: "Create Frontend Layout", allocation_id: "W001", assigned_to: "EM001", task_description: "Design the base SPA layout", priority: "HIGH", deadline: "2026-03-30", status: "IN_PROGRESS", progress_percentage: 50, updated_date: "2026-03-28", warning_sent: false },
        { task_id: "TK002", task_title: "Database Schema Updates", allocation_id: "W002", assigned_to: "EM002", task_description: "Match local DB variables with SQL", priority: "MEDIUM", deadline: "2026-03-25", status: "COMPLETED", progress_percentage: 100, updated_date: "2026-03-25", warning_sent: false }
    ],
    escalation: [
        { escalation_id: "E001", reference_type: "ATTENDANCE", reference_id: "A001", escalated_from: "EM001", escalated_to: "HR001", escalation_reason: "Swipe system error", escalation_date: "2026-03-28", status: "OPEN" }
    ],
    issue: [
        { issue_id: "ISS-001", emp_id: "EM001", title: "VPN Disconnection Issue", type: "Technical Issue / Bug", priority: "High", related_task: "TK001", description: "Constantly dropping connection to DB server.", status: "Open", assigned_to: "Unassigned", raised_date: new Date().toISOString().split('T')[0], updates: [] },
        { issue_id: "ISS-002", emp_id: "EM001", title: "API Keys Missing", type: "Resource Unavailable", priority: "Medium", related_task: "TK002", description: "Need production API keys to finalize the module.", status: "In Progress", assigned_to: "HR001", raised_date: "2026-03-20", updates: [{ sender: "System", time: "2026-03-22", message: "Assigned to HR001" }, { sender: "HR001", time: "2026-03-24", message: "Fetching keys from external vendors." }] },
        { issue_id: "ISS-003", emp_id: "EM001", title: "Figma File Lock", type: "Low Productivity / Blocker", priority: "Low", related_task: "", description: "Can't access page 2", status: "Resolved", assigned_to: "TL001", raised_date: "2026-03-10", updates: [{ sender: "TL001", time: "2026-03-11", message: "Unlocked file." }] },
        { issue_id: "ISS-004", emp_id: "EM001", title: "Overallocated Sprint Tasks", type: "Workload / Capacity Issue", priority: "High", related_task: "", description: "Too many hours allocated for the week to safely complete the UI designs.", status: "Open", assigned_to: "TL001", raised_date: new Date().toISOString().split('T')[0], updates: [] },
        { issue_id: "ISS-005", emp_id: "EM002", title: "Laptop Overheating", type: "Hardware Issue", priority: "High", related_task: "", description: "Laptop fan is not working and the machine shuts down during compiles.", status: "Open", assigned_to: "Unassigned", raised_date: "2026-04-01", updates: [] },
        { issue_id: "ISS-006", emp_id: "EM002", title: "Missing Software License", type: "Resource Unavailable", priority: "Medium", related_task: "TK002", description: "IntelliJ IDEA license expired. Requesting renewal.", status: "In Progress", assigned_to: "HR001", raised_date: "2026-04-10", updates: [{ sender: "HR001", time: "2026-04-11", message: "License request sent to procurement." }] },
        { issue_id: "ISS-007", emp_id: "EM001", title: "Unclear Requirements", type: "Information Missing", priority: "Medium", related_task: "TK001", description: "The API payload format is not defined in the specification.", status: "Resolved", assigned_to: "TL001", raised_date: "2026-04-12", updates: [{ sender: "TL001", time: "2026-04-13", message: "Added payload specs to the ticket." }] },
        { issue_id: "ISS-008", emp_id: "TL001", title: "Server Downtime", type: "Technical Issue / Bug", priority: "High", related_task: "", description: "Staging server is unreachable for the last 2 hours.", status: "Open", assigned_to: "Unassigned", raised_date: new Date().toISOString().split('T')[0], updates: [] },
        { issue_id: "ISS-009", emp_id: "EM002", title: "Git Repository Access Denied", type: "Access / Permissions", priority: "High", related_task: "", description: "Unable to push code to the new microservice repository.", status: "Open", assigned_to: "TL001", raised_date: new Date().toISOString().split('T')[0], updates: [] },
        { issue_id: "ISS-010", emp_id: "EM001", title: "Staging Deployment Failing", type: "Technical Issue / Bug", priority: "Critical", related_task: "TK001", description: "The CI/CD pipeline fails during the deployment stage.", status: "In Progress", assigned_to: "TL001", raised_date: "2026-05-02", updates: [{ sender: "TL001", time: "2026-05-03", message: "Investigating the pipeline logs." }] },
        { issue_id: "ISS-011", emp_id: "EM002", title: "Need Architecture Review", type: "Process Blocker", priority: "Medium", related_task: "TK002", description: "Awaiting approval for the new database schema design.", status: "Resolved", assigned_to: "TL001", raised_date: "2026-04-20", updates: [{ sender: "TL001", time: "2026-04-21", message: "Reviewed and approved the schema changes." }] }
    ],
    work_logs: [
        { worklog_id: "WL-001", emp_id: "EM001", task_id: "TK001", task_title: "Build Front-End UI", start_time: "2026-03-28T09:00", end_time: "2026-03-28T13:00", hours_spent: 4, description: "Completed the main dashboard layout and component structure.", log_date: "2026-03-28" },
        { worklog_id: "WL-002", emp_id: "EM001", task_id: "TK001", task_title: "Build Front-End UI", start_time: "2026-03-28T14:00", end_time: "2026-03-28T16:00", hours_spent: 2, description: "Integrated primary navigation sidebar and fixed hover states.", log_date: "2026-03-28" },
        { worklog_id: "WL-003", emp_id: "EM001", task_id: "TK002", task_title: "Database Schema Map", start_time: "2026-03-29T09:00", end_time: "2026-03-29T11:00", hours_spent: 2, description: "Started mapping variables from SQL mock format to the class constructs.", log_date: "2026-03-29" }
    ],
    notifications: [],
    holidays: [
        { holiday_id: "H001", companyId: "C001", title: "New Year's Day", date: "2026-01-01" },
        { holiday_id: "H002", companyId: "C001", title: "Independence Day", date: "2026-08-15" },
        { holiday_id: "H003", companyId: "C001", title: "Diwali", date: "2026-11-08" },
        { holiday_id: "H004", companyId: "C002", title: "New Year's Day", date: "2026-01-01" },
        { holiday_id: "H005", companyId: "C002", title: "Founders Day", date: "2026-05-20" },
        { holiday_id: "H006", companyId: "C002", title: "Thanksgiving", date: "2026-11-26" }
    ],
    company_events: [
        { event_id: "CE001", companyId: "C001", title: "All-Hands Meeting", date: "2026-08-20", visible_to_roles: ["ALL"] },
        { event_id: "CE002", companyId: "C001", title: "Team Lead Sync", date: "2026-08-25", visible_to_roles: ["TEAMLEAD", "HR", "COMPANY_ADMIN"] },
        { event_id: "CE003", companyId: "C002", title: "Quarterly Review", date: "2026-08-22", visible_to_roles: ["ALL"] }
    ],
    // User-created events from the header calendar popover (see calendar.service.ts
    // createPersonalEvent) - scoped to the creating employee, shape mirrors company_events.
    personal_events: [],

    // Company-internal teams (Company Admin -> Team -> Team Lead -> Employees).
    // Empty at boot - seeded companies use the legacy team_id/manager_id string tags
    // directly on employee records; only teams created through the Team module get a
    // row here.
    teams: [],

    // --- Super Admin / multi-company platform data ---
    companies: [
        { company_id: "C001", company_name: "Acme Technologies", company_email: "contact@acmetech.com", phone: "1234567890", industry: "Information Technology", address: "123 Innovation Drive, Springfield", status: "ACTIVE", subscription_plan_id: "PLAN-ENT", platform_admin_id: "PA001", created_date: "2024-01-01", last_payment_date: "2026-08-01", next_billing_date: "2026-09-01", last_transaction_id: "TXN-006" },
        { company_id: "C002", company_name: "Stark Industries", company_email: "contact@starkindustries.com", phone: "2223334444", industry: "Manufacturing", address: "200 Park Avenue, New York", status: "ACTIVE", subscription_plan_id: "PLAN-PRO", platform_admin_id: "PA001", created_date: "2023-03-01", last_payment_date: "2026-07-01", next_billing_date: "2026-08-01", last_transaction_id: "TXN-011" },
        { company_id: "C003", company_name: "Wayne Enterprises", company_email: "contact@wayneenterprises.com", phone: "3334445555", industry: "Conglomerate", address: "1007 Mountain Drive, Gotham", status: "SUSPENDED", subscription_plan_id: "PLAN-BASIC", platform_admin_id: "PA002", created_date: "2025-06-15", last_payment_date: "2026-06-15", next_billing_date: "2026-07-15", last_transaction_id: "TXN-013" }
    ],
    subscription_plans: [
        { plan_id: "PLAN-BASIC", name: "Basic", price: 49, billing_cycle: "MONTHLY", max_employees: 50, features: ["Attendance Tracking", "Leave Management", "Basic Reports"], status: "ACTIVE", created_date: "2024-01-01" },
        { plan_id: "PLAN-PRO", name: "Professional", price: 149, billing_cycle: "MONTHLY", max_employees: 200, features: ["Attendance Tracking", "Leave Management", "Task Management", "Advanced Reports", "Priority Support"], status: "ACTIVE", created_date: "2024-01-01" },
        { plan_id: "PLAN-ENT", name: "Enterprise", price: 499, billing_cycle: "MONTHLY", max_employees: 1000, features: ["All Professional Features", "Custom Integrations", "Dedicated Support", "SLA Guarantee", "Advanced Security"], status: "ACTIVE", created_date: "2024-01-01" }
    ],
    // Every row here is a completed subscription payment - company_id + subscription
    // plan_id, never a direct link to a Platform Admin (see PaymentService: Platform
    // Admin visibility is always derived through the company's platform_admin_id).
    // Legacy rows predate the mock-payment feature (is_mock: false, payment_method:
    // "CARD"); rows created via POST /payments/mock/complete carry is_mock: true and
    // payment_method: "MOCK".
    revenue_transactions: [
        { transaction_id: "TXN-001", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-03-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-002", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-04-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-003", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-05-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-004", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-06-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-005", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-07-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-006", company_id: "C001", plan_id: "PLAN-ENT", amount: 499, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-08-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-007", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-03-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-008", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-04-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-009", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-05-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-010", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-06-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-011", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-07-01", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-012", company_id: "C002", plan_id: "PLAN-PRO", amount: 149, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-08-01", payment_status: "PENDING", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-013", company_id: "C003", plan_id: "PLAN-BASIC", amount: 49, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-06-15", payment_status: "PAID", payment_method: "CARD", is_mock: false },
        { transaction_id: "TXN-014", company_id: "C003", plan_id: "PLAN-BASIC", amount: 49, currency: "USD", billing_cycle: "MONTHLY", payment_date: "2026-07-15", payment_status: "FAILED", payment_method: "CARD", is_mock: false }
    ],
    invitations: [],
    // Company self-registrations (see CompanyRegistrationService). Empty at boot.
    company_registrations: [],
    ticket_categories: [
        "Account / Login", "Company Setup", "Employee Management", "Attendance", "Leave Management",
        "Recruitment", "Tasks", "Subscription", "Billing", "Technical Issue", "Other"
    ],
    platform_tickets: [
        { ticket_id: "TIX-001", ticket_type: "TECHNICAL", company_id: "C001", platform_admin_id: "PA001", raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com", title: "SSO login failures for Acme staff", category: "Authentication", priority: "High", status: "OPEN", assigned_to: null, description: "Multiple Acme employees report SSO redirect loop since this morning.", created_date: "2026-08-18", updated_date: "2026-08-18", resolved_date: null, comments: [], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-002", ticket_type: "TECHNICAL", company_id: "C002", platform_admin_id: "PA001", raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com", title: "Stark Industries API integration timing out", category: "Integration", priority: "Critical", status: "IN_PROGRESS", assigned_to: "TT002", description: "Payroll export API calls are timing out after 30s for the Stark tenant.", created_date: "2026-08-10", updated_date: "2026-08-16", resolved_date: null, comments: [{ author: "Bruce Banner", message: "Reproduced; investigating DB connection pool exhaustion.", timestamp: "2026-08-16T10:00:00.000Z" }], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-003", ticket_type: "TECHNICAL", company_id: "C003", platform_admin_id: "PA002", raised_by_name: "Wayne Enterprises IT", raised_by_id: null, raised_by_email: "it@wayneenterprises.com", title: "Data export job stuck at 0%", category: "Bug", priority: "Medium", status: "RESOLVED", assigned_to: "TT003", description: "Nightly export job hasn't progressed in 3 days.", created_date: "2026-07-28", updated_date: "2026-08-01", resolved_date: "2026-08-01", comments: [{ author: "Shuri Udaku", message: "Fixed a stuck cron lock; job resumed.", timestamp: "2026-08-01T09:00:00.000Z" }], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-004", ticket_type: "SUPPORT", company_id: "C001", platform_admin_id: "PA001", raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com", title: "Question about invoice for August", category: "Billing", priority: "Low", status: "OPEN", assigned_to: null, description: "Requesting a breakdown of the August Enterprise plan invoice.", created_date: "2026-08-20", updated_date: "2026-08-20", resolved_date: null, comments: [], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-005", ticket_type: "SUPPORT", company_id: "C002", platform_admin_id: "PA001", raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com", title: "How to bulk-import employees via CSV", category: "Employee Management", priority: "Medium", status: "IN_PROGRESS", assigned_to: "ST001", description: "Need guidance on the CSV column format for bulk employee import.", created_date: "2026-08-14", updated_date: "2026-08-15", resolved_date: null, comments: [{ author: "Sam Wilson", message: "Sent the CSV template and a sample file.", timestamp: "2026-08-15T13:00:00.000Z" }], reassign_log: [], internal_notes: [{ author: "Sam Wilson", message: "Customer is on the Professional plan; CSV importer supports up to 200 rows.", timestamp: "2026-08-14T15:00:00.000Z" }], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-006", ticket_type: "SUPPORT", company_id: "C003", platform_admin_id: "PA002", raised_by_name: "Wayne Enterprises IT", raised_by_id: null, raised_by_email: "it@wayneenterprises.com", title: "Reactivate suspended account access for finance team", category: "Account / Login", priority: "High", status: "OPEN", assigned_to: null, description: "Finance team locked out since the company suspension; needs read-only access to close out August books.", created_date: "2026-08-21", updated_date: "2026-08-21", resolved_date: null, comments: [], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-007", ticket_type: "SUPPORT", company_id: "C001", platform_admin_id: "PA001", raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com", title: "Employees see wrong leave balance after policy update", category: "Leave Management", priority: "High", status: "WAITING_FOR_CUSTOMER", assigned_to: "ST001", description: "Several employees report their carried-over leave balance dropped to zero after the new policy rollout.", created_date: "2026-08-12", updated_date: "2026-08-19", resolved_date: null, comments: [{ author: "Sam Wilson", message: "Could you share 2-3 affected employee IDs so we can check their ledgers?", timestamp: "2026-08-19T11:00:00.000Z" }], reassign_log: [], internal_notes: [{ author: "Sam Wilson", message: "Looks like the carry-over migration script may have skipped CASUAL leave types. Flagging for a closer look before escalating.", timestamp: "2026-08-19T11:05:00.000Z" }], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-008", ticket_type: "SUPPORT", company_id: "C002", platform_admin_id: "PA001", raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com", title: "Attendance check-in unavailable company-wide", category: "Attendance", priority: "Critical", status: "OPEN", assigned_to: null, description: "Attendance system unavailable for entire company since 9 AM; nobody can check in.", created_date: "2026-08-24", updated_date: "2026-08-24", resolved_date: null, comments: [], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-009", ticket_type: "SUPPORT", company_id: "C001", platform_admin_id: "PA001", raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com", title: "How do I export the payroll report as CSV", category: "Employee Management", priority: "Low", status: "CLOSED", assigned_to: "ST001", description: "Looking for a way to export the monthly payroll report as a CSV file.", created_date: "2026-07-05", updated_date: "2026-07-07", resolved_date: "2026-07-07", comments: [{ author: "Sam Wilson", message: "You can export it from Reports > Payroll > Export CSV. Closing this out.", timestamp: "2026-07-07T09:00:00.000Z" }], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },
        { ticket_id: "TIX-010", ticket_type: "SUPPORT", company_id: "C002", platform_admin_id: "PA001", raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com", title: "Subscription invoice shows incorrect employee count", category: "Billing", priority: "Medium", status: "RESOLVED", assigned_to: "ST001", description: "August invoice charges for 220 employees but we only have 200 active.", created_date: "2026-08-22", updated_date: "2026-08-24", resolved_date: "2026-08-24", comments: [{ author: "Sam Wilson", message: "Confirmed the discrepancy was due to 20 deactivated accounts; credit has been applied to your next invoice.", timestamp: "2026-08-24T08:30:00.000Z" }], reassign_log: [], internal_notes: [], escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null },

        // --- Technical issues assigned by Platform Admin PA001 to Technical Member TT001 (Wanda Maximoff) ---
        // Seeded on relative dates so the Technical Member dashboard has a live-looking
        // workload, a 7-day progress trend, and a populated issue history.
        {
            ticket_id: "TIX-011", ticket_type: "TECHNICAL", company_id: "C001", platform_admin_id: "PA001",
            raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com",
            title: "Attendance sync job failing for the Acme night shift", category: "Bug", priority: "High", status: "IN_PROGRESS",
            assigned_to: "TT001", progress_percentage: 60,
            description: "Check-ins recorded between 22:00 and 06:00 never reach the attendance ledger. Started after the timezone patch rollout.",
            created_date: isoDate(6), updated_date: isoDate(1), resolved_date: null,
            comments: [{ author: "Wanda Maximoff", message: "Confirmed the sync worker is dropping records whose shift crosses midnight. Working on a fix for the date-boundary handling.", timestamp: isoTime(2, 11) }],
            reassign_log: [],
            internal_notes: [
                { author: "Wanda Maximoff", message: "Root cause: the ledger writer buckets by local calendar date but the worker passes a UTC timestamp, so post-midnight check-ins land on a date the shift record does not own.", timestamp: isoTime(3, 9) },
                { author: "Wanda Maximoff", message: "Patch drafted in the shift-boundary resolver. Needs a replay of the last 6 days of dropped records once deployed.", timestamp: isoTime(1, 15) }
            ],
            attachments: [
                { attachment_id: "ATT-011-1", file_name: "sync-worker-error.log", file_type: "text/plain", file_size: 4820, kind: "LOG", description: "Worker stack trace at the date boundary", uploaded_by: "TT001", uploaded_by_name: "Wanda Maximoff", uploaded_at: isoTime(3, 9), data_url: null },
                { attachment_id: "ATT-011-2", file_name: "ledger-gap.png", file_type: "image/png", file_size: 148230, kind: "SCREENSHOT", description: "Missing rows in the attendance ledger", uploaded_by: "TT001", uploaded_by_name: "Wanda Maximoff", uploaded_at: isoTime(3, 10), data_url: null }
            ],
            progress_log: [
                { author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 25, note: "Reproduced the failure on a staging replay.", timestamp: isoTime(4, 10) },
                { author_id: "TT001", author: "Wanda Maximoff", from: 25, to: 60, note: "Root cause isolated to the shift-boundary resolver.", timestamp: isoTime(1, 15) }
            ],
            verification_status: null, verification_note: null, submitted_for_verification_at: null, verified_by: null, verified_by_name: null, verified_at: null, resolution_notes: null,
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-012", ticket_type: "TECHNICAL", company_id: "C002", platform_admin_id: "PA001",
            raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com",
            title: "Stark tenant report exports return HTTP 500", category: "Bug", priority: "Critical", status: "OPEN",
            assigned_to: "TT001", progress_percentage: 0,
            description: "Every report export for the Stark tenant fails immediately with a 500. Smaller tenants are unaffected.",
            created_date: isoDate(1), updated_date: isoDate(1), resolved_date: null,
            comments: [], reassign_log: [], internal_notes: [], attachments: [], progress_log: [],
            verification_status: null, verification_note: null, submitted_for_verification_at: null, verified_by: null, verified_by_name: null, verified_at: null, resolution_notes: null,
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-013", ticket_type: "TECHNICAL", company_id: "C001", platform_admin_id: "PA001",
            raised_by_name: "HR Manager", raised_by_id: "HR001", raised_by_email: "hr@emptrack.com",
            title: "Leave balance recalculation is slow after policy change", category: "Performance", priority: "Medium", status: "IN_PROGRESS",
            assigned_to: "TT001", progress_percentage: 35,
            description: "Recalculating balances for the whole company takes over 4 minutes and blocks the HR console while it runs.",
            created_date: isoDate(4), updated_date: isoDate(2), resolved_date: null,
            comments: [], reassign_log: [],
            internal_notes: [{ author: "Wanda Maximoff", message: "Profiler shows the recalculation issues one query per employee per leave type. Batching should bring this under 10s.", timestamp: isoTime(2, 14) }],
            attachments: [{ attachment_id: "ATT-013-1", file_name: "recalc-profile.log", file_type: "text/plain", file_size: 9120, kind: "LOG", description: "Query profiler output", uploaded_by: "TT001", uploaded_by_name: "Wanda Maximoff", uploaded_at: isoTime(2, 14), data_url: null }],
            progress_log: [{ author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 35, note: "Profiled the recalculation path and identified the N+1 query.", timestamp: isoTime(2, 14) }],
            verification_status: null, verification_note: null, submitted_for_verification_at: null, verified_by: null, verified_by_name: null, verified_at: null, resolution_notes: null,
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-014", ticket_type: "TECHNICAL", company_id: "C002", platform_admin_id: "PA001",
            raised_by_name: "Tony Stark (TL)", raised_by_id: "TL002", raised_by_email: "tl2@emptrack.com",
            title: "Task deadline reminders sent in the wrong timezone", category: "Bug", priority: "High", status: "RESOLVED",
            assigned_to: "TT001", progress_percentage: 100,
            description: "Deadline reminder emails arrive 5.5 hours early for the Stark tenant.",
            created_date: isoDate(5), updated_date: isoDate(0), resolved_date: isoDate(0),
            comments: [{ author: "Wanda Maximoff", message: "Fixed: the reminder scheduler now resolves the tenant timezone instead of defaulting to the platform timezone. Verified against the Stark tenant.", timestamp: isoTime(0, 9) }],
            reassign_log: [],
            internal_notes: [{ author: "Wanda Maximoff", message: "Scheduler was reading platform_settings.timezone rather than the company record. One-line fix plus a regression test.", timestamp: isoTime(0, 9) }],
            attachments: [{ attachment_id: "ATT-014-1", file_name: "reminder-fix-verified.png", file_type: "image/png", file_size: 96420, kind: "SCREENSHOT", description: "Reminder delivered at the correct local time", uploaded_by: "TT001", uploaded_by_name: "Wanda Maximoff", uploaded_at: isoTime(0, 9), data_url: null }],
            progress_log: [
                { author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 50, note: "Traced the reminder scheduler timezone lookup.", timestamp: isoTime(2, 11) },
                { author_id: "TT001", author: "Wanda Maximoff", from: 50, to: 100, note: "Fix applied and regression test added.", timestamp: isoTime(0, 9) }
            ],
            verification_status: "PENDING_VERIFICATION", verification_note: null, submitted_for_verification_at: isoTime(0, 9),
            verified_by: null, verified_by_name: null, verified_at: null,
            resolution_notes: "Reminder scheduler now resolves the tenant timezone from the company record. Regression test added.",
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-015", ticket_type: "TECHNICAL", company_id: "C001", platform_admin_id: "PA001",
            raised_by_name: "Kiran (Company Admin)", raised_by_id: "AD001", raised_by_email: "cmpadmin@emptrack.com",
            title: "Profile photo uploads rejected above 1 MB", category: "Bug", priority: "Low", status: "CLOSED",
            assigned_to: "TT001", progress_percentage: 100,
            description: "Employees cannot upload profile photos larger than 1 MB even though the documented limit is 5 MB.",
            created_date: isoDate(21), updated_date: isoDate(16), resolved_date: isoDate(17),
            comments: [{ author: "Wanda Maximoff", message: "Upload proxy limit raised to match the documented 5 MB ceiling.", timestamp: isoTime(17, 14) }],
            reassign_log: [], internal_notes: [], attachments: [], progress_log: [{ author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 100, note: "Proxy body limit corrected.", timestamp: isoTime(17, 14) }],
            verification_status: "VERIFIED", verification_note: "Confirmed against the Acme tenant.", submitted_for_verification_at: isoTime(17, 14),
            verified_by: "PA001", verified_by_name: "Ravi Kumar", verified_at: isoTime(16, 10),
            resolution_notes: "Raised the upload proxy body limit from 1 MB to 5 MB.",
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-016", ticket_type: "TECHNICAL", company_id: "C002", platform_admin_id: "PA001",
            raised_by_name: "Natasha Romanoff (Company Admin)", raised_by_id: "AD002", raised_by_email: "admin2@emptrack.com",
            title: "Duplicate notifications on leave approval", category: "Bug", priority: "Medium", status: "CLOSED",
            assigned_to: "TT001", progress_percentage: 100,
            description: "Approving a leave request sends the employee two identical notifications.",
            created_date: isoDate(30), updated_date: isoDate(25), resolved_date: isoDate(26),
            comments: [{ author: "Wanda Maximoff", message: "The approval handler was registered twice after the module refactor. Removed the duplicate registration.", timestamp: isoTime(26, 12) }],
            reassign_log: [], internal_notes: [], attachments: [], progress_log: [{ author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 100, note: "Duplicate handler registration removed.", timestamp: isoTime(26, 12) }],
            verification_status: "VERIFIED", verification_note: null, submitted_for_verification_at: isoTime(26, 12),
            verified_by: "PA001", verified_by_name: "Ravi Kumar", verified_at: isoTime(25, 9),
            resolution_notes: "Removed the duplicate leave-approval notification handler registration.",
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        },
        {
            ticket_id: "TIX-017", ticket_type: "TECHNICAL", company_id: "C001", platform_admin_id: "PA001",
            raised_by_name: "Rinku Singh (TL)", raised_by_id: "TL001", raised_by_email: "tl@emptrack.com",
            // Returned for rework by the Platform Admin, so it sits back in the active queue.
            title: "Work log chart renders blank on Safari", category: "Bug", priority: "Low", status: "IN_PROGRESS",
            assigned_to: "TT001", progress_percentage: 100,
            description: "The work log chart is blank on Safari 17 but renders correctly on Chrome and Firefox.",
            created_date: isoDate(12), updated_date: isoDate(7), resolved_date: null,
            comments: [], reassign_log: [], internal_notes: [], attachments: [], progress_log: [{ author_id: "TT001", author: "Wanda Maximoff", from: 0, to: 100, note: "Replaced the unsupported canvas API call.", timestamp: isoTime(8, 16) }],
            verification_status: "REJECTED", verification_note: "Still blank on Safari 16 - please cover the previous major version too.",
            submitted_for_verification_at: isoTime(8, 16), verified_by: "PA001", verified_by_name: "Ravi Kumar", verified_at: isoTime(7, 11),
            resolution_notes: "Replaced an unsupported canvas API call with the widely-supported equivalent.",
            escalated_team: null, linked_technical_ticket_id: null, linked_from_ticket_id: null
        }
    ],
    activity_logs: [
        { activity_id: "ACT-001", user_id: "SA001", user_name: "Alex Morgan", role: "SUPER_ADMIN", action: "Platform Admin created", company_id: null, company_name: null, details: "Created platform admin Ravi Kumar", timestamp: "2026-08-01T09:00:00.000Z", status: "SUCCESS" },
        { activity_id: "ACT-002", user_id: "SA001", user_name: "Alex Morgan", role: "SUPER_ADMIN", action: "Company assigned", company_id: "C001", company_name: "Acme Technologies", details: "Assigned Ravi Kumar to manage Acme Technologies", timestamp: "2026-08-02T10:30:00.000Z", status: "SUCCESS" },
        { activity_id: "ACT-003", user_id: "PA002", user_name: "Anjali Sharma", role: "PLATFORM_ADMIN", action: "Company suspended", company_id: "C003", company_name: "Wayne Enterprises", details: "Suspended due to failed payment", timestamp: "2026-08-10T14:15:00.000Z", status: "WARNING" },
        { activity_id: "ACT-004", user_id: "PA001", user_name: "Ravi Kumar", role: "PLATFORM_ADMIN", action: "Support issue escalated", company_id: "C002", company_name: "Stark Industries", details: "Escalated critical VPN outage to Technical Team", timestamp: "2026-08-15T11:00:00.000Z", status: "SUCCESS" }
    ],
    critical_escalations: [
        { issue_id: "CESC-001", company_id: "C002", raised_by: "PA001", category: "Technical", priority: "Critical", assigned_team: "Technical Team", status: "OPEN", created_date: "2026-08-15", updated_date: "2026-08-15", description: "Persistent VPN outage disrupting the Stark Industries engineering team.", comments: [] },
        { issue_id: "CESC-002", company_id: "C003", raised_by: "PA002", category: "Billing", priority: "High", assigned_team: "Support Team", status: "IN_PROGRESS", created_date: "2026-08-10", updated_date: "2026-08-11", description: "Subscription payment failure triggered automatic suspension.", comments: [{ author: "PA002", message: "Awaiting payment confirmation from finance.", timestamp: "2026-08-11T09:00:00.000Z" }] }
    ],
    platform_settings: {
        platform_name: "EmpTrack",
        support_email: "support@emptrack.com",
        maintenance_mode: false,
        default_currency: "USD",
        timezone: "Asia/Kolkata",
        notification_settings: { emailNotifications: true, criticalEscalationAlerts: true, weeklyDigest: true, newCompanyAlerts: true },
        security_settings: { passwordMinLength: 8, sessionTimeoutMinutes: 60, twoFactorRequired: false, invitationExpiryHours: 72 },
        role_permissions: {
            SUPER_ADMIN: ["Full platform access"],
            PLATFORM_ADMIN: ["Manage assigned companies", "Escalation handling", "View analytics for assigned companies"],
            COMPANY_ADMIN: ["Manage company employees", "Approve leave/attendance", "Company-level settings"]
        }
    }
};

@Injectable()
export class MockDataService {
    public data: any;

    constructor(@Optional() private readonly persistence?: WorkflowPersistenceService) {
        this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
        this.data.platform_tickets.forEach((t) => this.normalizeTicket(t));
        // Seed passwords are written in plain text above for readability, but nothing
        // ever sits in memory unhashed - hash them once at boot, same as any password
        // created at runtime.
        this.data.employee.forEach((e) => { if (e.password) e.password = hashPassword(e.password); });
        if (this.persistence) {
            const identity = this.persistence.initializeIdentityData(this.data.employee, this.data.companies);
            this.replaceArray('employee', identity.users);
            this.replaceArray('companies', identity.companies);
            this.replaceArray('company_registrations', identity.registrations);
        }
    }

    private replaceArray(name: string, records: any[]) {
        this.data[name].splice(0, this.data[name].length, ...records);
    }

    /** Refresh shared identity records before authenticated requests on any API instance. */
    public refreshIdentityData() {
        if (!this.persistence) return;
        this.replaceArray('employee', this.persistence.getUsers());
        this.replaceArray('companies', this.persistence.getCompanies());
        this.replaceArray('company_registrations', this.persistence.getCompanyRegistrations());
    }

    public saveEmployee(employee: any) {
        if (employee.email) employee.email = String(employee.email).trim().toLowerCase();
        this.persistence?.saveUser(employee);
        return employee;
    }

    public saveCompany(company: any) {
        if (company.company_email) company.company_email = String(company.company_email).trim().toLowerCase();
        this.persistence?.saveCompany(company);
        return company;
    }

    public saveCompanyRegistration(registration: any) {
        this.persistence?.saveCompanyRegistration(registration);
        return registration;
    }

    public persistCompanyAndAdmin(company: any, admin: any) {
        if (admin.email) admin.email = String(admin.email).trim().toLowerCase();
        this.persistence?.createCompanyAndAdmin(company, admin);
    }

    public persistRegistrationActivation(registration: any, company: any, admin: any) {
        if (admin.email) admin.email = String(admin.email).trim().toLowerCase();
        this.persistence?.activateRegistration(registration, company, admin);
    }

    // Guarantees every platform ticket carries the technical-workflow fields, so
    // callers never have to null-check them. Applied to the seed data on boot and to
    // any ticket created at runtime (e.g. a support ticket escalated to the
    // Technical Team) - existing values are always preserved.
    public normalizeTicket(ticket: any) {
        if (!Array.isArray(ticket.comments)) ticket.comments = [];
        if (!Array.isArray(ticket.reassign_log)) ticket.reassign_log = [];
        if (!Array.isArray(ticket.internal_notes)) ticket.internal_notes = [];
        if (!Array.isArray(ticket.attachments)) ticket.attachments = [];
        if (!Array.isArray(ticket.progress_log)) ticket.progress_log = [];
        if (typeof ticket.progress_percentage !== 'number') ticket.progress_percentage = 0;
        if (ticket.verification_status === undefined) ticket.verification_status = null;
        if (ticket.verification_note === undefined) ticket.verification_note = null;
        if (ticket.submitted_for_verification_at === undefined) ticket.submitted_for_verification_at = null;
        if (ticket.verified_by === undefined) ticket.verified_by = null;
        if (ticket.verified_by_name === undefined) ticket.verified_by_name = null;
        if (ticket.verified_at === undefined) ticket.verified_at = null;
        if (ticket.resolution_notes === undefined) ticket.resolution_notes = null;
        return ticket;
    }

    public getEmployees() { return this.data.employee; }
    public getAttendance() { return this.data.attendance; }
    public getLeaves() { return this.data.leave_details; }
    public getTasks() { return this.data.task; }
    public setTasks(tasks: any[]) { this.data.task = tasks; }
    public getEscalations() { return this.data.escalation; }
    public getIssues() { return this.data.issue; }
    public getWorkLogs() { return this.data.work_logs; }
    public setWorkLogs(workLogs: any[]) { this.data.work_logs = workLogs; }
    public getNotifications() { return this.data.notifications; }
    public getHolidays() { return this.data.holidays; }
    public getCompanyEvents() { return this.data.company_events; }
    public getPersonalEvents() { return this.data.personal_events; }

    public getTeams() { return this.data.teams; }

    public getCompanies() { return this.data.companies; }
    public getSubscriptionPlans() { return this.data.subscription_plans; }
    public getRevenueTransactions() { return this.data.revenue_transactions; }
    public getInvitations() { return this.data.invitations; }
    public getCompanyRegistrations() { return this.data.company_registrations; }
    public getPlatformTickets() { return this.data.platform_tickets; }
    public getTicketCategories() { return this.data.ticket_categories; }
    public getActivityLogs() { return this.data.activity_logs; }
    public getCriticalEscalations() { return this.data.critical_escalations; }
    public getPlatformSettings() { return this.data.platform_settings; }

    public logActivity(entry: { user_id: string; user_name: string; role: string; action: string; company_id?: string | null; company_name?: string | null; details?: string; status?: string; }) {
        const record = {
            activity_id: 'ACT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
            company_id: null,
            company_name: null,
            ...entry
        };
        this.data.activity_logs.push(record);
        return record;
    }

    public deleteEmployee(id: string) {
        const initialLength = this.data.employee.length;
        this.persistence?.deleteUser(id);
        this.data.employee = this.data.employee.filter(e => e.emp_id !== id);

        // Cascade deletes
        this.data.attendance = this.data.attendance.filter(a => a.emp_id !== id);
        this.data.leave_details = this.data.leave_details.filter(l => l.emp_id !== id);
        this.data.work_logs = this.data.work_logs.filter(w => w.emp_id !== id);
        this.data.task = this.data.task.filter(t => t.assigned_to !== id);
        this.data.issue = this.data.issue.filter(i => i.emp_id !== id);
        // Issues raised by other people that were merely assigned to this employee stay,
        // just unassigned again - deleting them would lose another employee's report.
        this.data.issue.forEach(i => { if (i.assigned_to === id) i.assigned_to = 'Unassigned'; });
        this.data.escalation = this.data.escalation.filter(e => e.escalated_from !== id && e.escalated_to !== id);
        this.data.platform_tickets.forEach(t => { if (t.assigned_to === id) t.assigned_to = null; });

        if (this.data.notifications) {
            this.data.notifications = this.data.notifications.filter(n => n.employee_id !== id);
        }

        return this.data.employee.length < initialLength;
    }

    public updateEmployee(id: string, updateData: any) {
        const index = this.data.employee.findIndex(e => e.emp_id === id);
        if (index !== -1) {
            const updated = { ...this.data.employee[index], ...updateData };
            this.saveEmployee(updated);
            this.data.employee[index] = updated;
            return updated;
        }
        return null;
    }
}
