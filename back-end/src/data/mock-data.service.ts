import { Injectable } from '@nestjs/common';

const INITIAL_MOCK_DATA = {
    employee: [
        { emp_id: "AD001", emp_name: "Bruce Wayne (Super Admin)", email: "admin@emp.com", phone: "1231231234", password: "Password@123", role: "ADMIN", status: "ACTIVE", date_of_joining: "2020-01-01", department_id: "D00", team_id: "T00", companyId: "C001" },
        { emp_id: "HR001", emp_name: "HR Manager", email: "hr@emp.com", phone: "1234567890", password: "Password@123", role: "HR", status: "ACTIVE", date_of_joining: "2024-01-01", department_id: "D01", team_id: "T01", companyId: "C001" },
        { emp_id: "TL001", emp_name: "Rinku Singh (TL)", email: "tl@emp.com", phone: "0987654321", password: "Password@123", role: "TEAMLEAD", status: "ACTIVE", date_of_joining: "2024-06-01", department_id: "D02", team_id: "T02", companyId: "C001" },
        { emp_id: "EM001", emp_name: "John Doe (EMP)", email: "emp@emp.com", phone: "1112223333", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-01-15", department_id: "D02", team_id: "T02", manager_id: "TL001", companyId: "C001" },
        { emp_id: "EM002", emp_name: "Jane Smith (EMP)", email: "jane@emp.com", phone: "4445556666", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-02-10", department_id: "D02", team_id: "T02", manager_id: "TL001", companyId: "C001" },

        // Second company - seeded to prove calendar tenant isolation (see CalendarService)
        { emp_id: "HR002", emp_name: "Carol Danvers (HR)", email: "hr2@emp.com", phone: "2223334444", password: "Password@123", role: "HR", status: "ACTIVE", date_of_joining: "2023-03-01", department_id: "D01", team_id: "T10", companyId: "C002" },
        { emp_id: "TL002", emp_name: "Tony Stark (TL)", email: "tl2@emp.com", phone: "3334445555", password: "Password@123", role: "TEAMLEAD", status: "ACTIVE", date_of_joining: "2023-05-01", department_id: "D02", team_id: "T11", companyId: "C002" },
        { emp_id: "EM003", emp_name: "Peter Parker (EMP)", email: "emp3@emp.com", phone: "4445556677", password: "Password@123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2024-09-01", department_id: "D02", team_id: "T11", manager_id: "TL002", companyId: "C002" }
    ],
    attendance: [
        { attendance_id: "A001", emp_id: "EM001", attendance_date: "2026-03-07", attendance_mode: "OFFICE", check_in_time: "09:00", check_out_time: "15:30", screen_time: 390, hours_spent: 6, remarks: "On track", status: "PRESENT" },
        { attendance_id: "A002", emp_id: "EM001", attendance_date: "2026-03-05", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: 0, remarks: "Absent", status: "ABSENT" },
        { attendance_id: "A003", emp_id: "EM001", attendance_date: "2026-03-02", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: 0, remarks: "Off day", status: "WEEKEND" },
        { attendance_id: "A004", emp_id: "EM001", attendance_date: "2026-02-27", attendance_mode: "REMOTE", check_in_time: "09:00", check_out_time: "13:00", screen_time: 240, hours_spent: 4, remarks: "Below target", status: "ESCALATED" }
    ],
    leave_details: [
        { leave_id: "LR-015", emp_id: "EM001", start_date: "2026-03-20", end_date: "2026-03-25", days: "6", leave_type: "CASUAL", reason: "Family vacation", status: "PENDING", applied_date: "2026-03-07", approved_date: null, approved_by: null, reject_reason: null },
        { leave_id: "LR-012", emp_id: "EM001", start_date: "2026-03-10", end_date: "2026-03-10", days: "1", leave_type: "SICK", reason: "Fever and cold symptom management.", status: "APPROVED", applied_date: "2026-03-09", approved_date: "2026-03-09", approved_by: "TL001", reject_reason: null },
        { leave_id: "LR-008", emp_id: "EM001", start_date: "2026-02-15", end_date: "2026-02-16", days: "2", leave_type: "UNPAID", reason: "Personal appointments", status: "REJECTED", applied_date: "2026-02-10", approved_date: "2026-02-11", approved_by: "TL001", reject_reason: "Insufficient notice period during critical delivery milestone." }
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
        { event_id: "CE002", companyId: "C001", title: "Team Lead Sync", date: "2026-08-25", visible_to_roles: ["TEAMLEAD", "HR", "ADMIN"] },
        { event_id: "CE003", companyId: "C002", title: "Quarterly Review", date: "2026-08-22", visible_to_roles: ["ALL"] }
    ]
};

@Injectable()
export class MockDataService {
    public data: any;

    constructor() {
        this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }

    public getEmployees() { return this.data.employee; }
    public getAttendance() { return this.data.attendance; }
    public getLeaves() { return this.data.leave_details; }
    public getTasks() { return this.data.task; }
    public getEscalations() { return this.data.escalation; }
    public getIssues() { return this.data.issue; }
    public getWorkLogs() { return this.data.work_logs; }
    public getNotifications() { return this.data.notifications; }
    public getHolidays() { return this.data.holidays; }
    public getCompanyEvents() { return this.data.company_events; }

    public deleteEmployee(id: string) {
        const initialLength = this.data.employee.length;
        this.data.employee = this.data.employee.filter(e => e.emp_id !== id);
        
        // Cascade deletes
        this.data.attendance = this.data.attendance.filter(a => a.emp_id !== id);
        this.data.leave_details = this.data.leave_details.filter(l => l.emp_id !== id);
        this.data.work_logs = this.data.work_logs.filter(w => w.emp_id !== id);
        this.data.task = this.data.task.filter(t => t.assigned_to !== id);
        this.data.issue = this.data.issue.filter(i => i.emp_id !== id && i.assigned_to !== id);
        this.data.escalation = this.data.escalation.filter(e => e.escalated_from !== id && e.escalated_to !== id);
        
        if (this.data.notifications) {
            this.data.notifications = this.data.notifications.filter(n => n.employee_id !== id);
        }

        return this.data.employee.length < initialLength;
    }

    public updateEmployee(id: string, updateData: any) {
        const index = this.data.employee.findIndex(e => e.emp_id === id);
        if (index !== -1) {
            this.data.employee[index] = { ...this.data.employee[index], ...updateData };
            return this.data.employee[index];
        }
        return null;
    }
}
