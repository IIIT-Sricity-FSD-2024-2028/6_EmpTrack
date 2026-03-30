// /js/store.js
// Mock Backend Data Store using In-Memory arrays with LocalStorage Persistence
// Field names exactly match Dbschema.sql

const INITIAL_MOCK_DATA = {
    employee: [
        { emp_id: "HR001", emp_name: "Super Admin", email: "hr@emp.com", phone: "1234567890", password: "password123", role: "HR", status: "ACTIVE", date_of_joining: "2024-01-01", department_id: "D01", team_id: "T01" },
        { emp_id: "TL001", emp_name: "Team Lead", email: "tl@emp.com", phone: "0987654321", password: "password123", role: "TEAMLEAD", status: "ACTIVE", date_of_joining: "2024-06-01", department_id: "D02", team_id: "T02" },
        { emp_id: "EM001", emp_name: "John Doe (EMP)", email: "emp@emp.com", phone: "1112223333", password: "password123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-01-15", department_id: "D02", team_id: "T02", manager_id: "TL001" },
        { emp_id: "EM002", emp_name: "Jane Smith (EMP)", email: "jane@emp.com", phone: "4445556666", password: "password123", role: "EMPLOYEE", status: "ACTIVE", date_of_joining: "2025-02-10", department_id: "D02", team_id: "T02", manager_id: "TL001" }
    ],
    attendance: [
        { attendance_id: "A001", emp_id: "EM001", attendance_date: "2026-03-07", attendance_mode: "OFFICE", check_in_time: "09:00", check_out_time: "15:30", screen_time: 390, hours_spent: "6.5h", remarks: "On track", status: "PRESENT" },
        { attendance_id: "A002", emp_id: "EM001", attendance_date: "2026-03-05", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: "-", remarks: "Absent", status: "ABSENT" },
        { attendance_id: "A003", emp_id: "EM001", attendance_date: "2026-03-02", attendance_mode: null, check_in_time: null, check_out_time: null, screen_time: 0, hours_spent: "-", remarks: "Off day", status: "WEEKEND" },
        { attendance_id: "A004", emp_id: "EM001", attendance_date: "2026-02-27", attendance_mode: "REMOTE", check_in_time: "09:00", check_out_time: "13:00", screen_time: 240, hours_spent: "4h", remarks: "Below target", status: "ESCALATED" }
    ],
    leave_details: [
        { leave_id: "LR-015", emp_id: "EM001", start_date: "2026-03-20", end_date: "2026-03-25", days: "6", leave_type: "CASUAL", reason: "Family vacation", status: "PENDING", applied_date: "2026-03-07", approved_date: null, approved_by: null, reject_reason: null },
        { leave_id: "LR-012", emp_id: "EM001", start_date: "2026-03-10", end_date: "2026-03-10", days: "1", leave_type: "SICK", reason: "Fever and cold symptom management.", status: "APPROVED", applied_date: "2026-03-09", approved_date: "2026-03-09", approved_by: "TL001", reject_reason: null },
        { leave_id: "LR-008", emp_id: "EM001", start_date: "2026-02-15", end_date: "2026-02-16", days: "2", leave_type: "UNPAID", reason: "Personal appointments", status: "REJECTED", applied_date: "2026-02-10", approved_date: "2026-02-11", approved_by: "TL001", reject_reason: "Insufficient notice period during critical delivery milestone." }
    ],
    task: [
        { task_id: "TK001", task_title: "Create Frontend Layout", allocation_id: "W001", assigned_to: "EM001", task_description: "Design the base SPA layout", priority: "HIGH", deadline: "2026-03-30", status: "IN_PROGRESS", progress_percentage: 50, updated_date: "2026-03-28" },
        { task_id: "TK002", task_title: "Database Schema Updates", allocation_id: "W002", assigned_to: "EM002", task_description: "Match local DB variables with SQL", priority: "MEDIUM", deadline: "2026-03-25", status: "COMPLETED", progress_percentage: 100, updated_date: "2026-03-25" }
    ],
    escalation: [
        { escalation_id: "E001", reference_type: "ATTENDANCE", reference_id: "A001", escalated_from: "EM001", escalated_to: "HR001", escalation_reason: "Swipe system error", escalation_date: "2026-03-28", status: "OPEN" }
    ],
    issue: [
        { issue_id: "ISS-001", emp_id: "EM001", title: "VPN Disconnection Issue", type: "Technical Issue / Bug", priority: "High", related_task: "TK001", description: "Constantly dropping connection to DB server.", status: "Open", assigned_to: "Unassigned", raised_date: new Date().toISOString().split('T')[0], updates: [] },
        { issue_id: "ISS-002", emp_id: "EM001", title: "API Keys Missing", type: "Resource Unavailable", priority: "Medium", related_task: "TK002", description: "Need production API keys to finalize the module.", status: "In Progress", assigned_to: "HR001", raised_date: "2026-03-20", updates: [{ sender: "System", time: "2026-03-22", message: "Assigned to HR001" }, { sender: "HR001", time: "2026-03-24", message: "Fetching keys from external vendors." }] },
        { issue_id: "ISS-003", emp_id: "EM001", title: "Figma File Lock", type: "Low Productivity / Blocker", priority: "Low", related_task: "", description: "Can't access page 2", status: "Resolved", assigned_to: "TL001", raised_date: "2026-03-10", updates: [{ sender: "TL001", time: "2026-03-11", message: "Unlocked file." }] },
        { issue_id: "ISS-004", emp_id: "EM001", title: "Overallocated Sprint Tasks", type: "Workload / Capacity Issue", priority: "High", related_task: "", description: "Too many hours allocated for the week to safely complete the UI designs.", status: "Open", assigned_to: "TL001", raised_date: new Date().toISOString().split('T')[0], updates: [] }
    ],
    work_logs: [
        { worklog_id: "WL-001", emp_id: "EM001", task_id: "TK001", task_title: "Build Front-End UI", start_time: "2026-03-28T09:00", end_time: "2026-03-28T13:00", hours_spent: 4, description: "Completed the main dashboard layout and component structure.", log_date: "2026-03-28" },
        { worklog_id: "WL-002", emp_id: "EM001", task_id: "TK001", task_title: "Build Front-End UI", start_time: "2026-03-28T14:00", end_time: "2026-03-28T16:00", hours_spent: 2, description: "Integrated primary navigation sidebar and fixed hover states.", log_date: "2026-03-28" },
        { worklog_id: "WL-003", emp_id: "EM001", task_id: "TK002", task_title: "Database Schema Map", start_time: "2026-03-29T09:00", end_time: "2026-03-29T11:00", hours_spent: 2, description: "Started mapping variables from SQL mock format to the class constructs.", log_date: "2026-03-29" }
    ]
};

class Store {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem('empTrackDataV6');
        if (stored) {
            return JSON.parse(stored);
        }
        this.saveData(INITIAL_MOCK_DATA);
        return INITIAL_MOCK_DATA;
    }

    saveData(data = this.data) {
        localStorage.setItem('empTrackDataV6', JSON.stringify(data));
        this.data = data;
    }

// ... keeping internal methods but expanding below explicitly
// The previous lines weren't matched perfectly because I need to replace V5 first


    // --- Employee ---
    getUserByEmail(email) {
        return this.data.employee.find(u => u.email === email);
    }
    
    getUserById(id) {
        return this.data.employee.find(u => u.emp_id === id);
    }

    getUsersByManager(managerId) {
        return this.data.employee.filter(u => u.manager_id === managerId);
    }

    // --- Attendance ---
    getAttendanceForUser(empId) {
        return this.data.attendance.filter(a => a.emp_id === empId);
    }

    markAttendance(empId, checkInTime, mode = "OFFICE") {
        const today = new Date().toISOString().split('T')[0];
        const existing = this.data.attendance.find(a => a.emp_id === empId && a.attendance_date === today);
        if (existing) {
            return { error: "Attendance already marked for today." };
        }
        const newRecord = {
            attendance_id: 'A' + Date.now(),
            emp_id: empId,
            attendance_date: today,
            attendance_mode: mode,
            check_in_time: checkInTime,
            check_out_time: null,
            screen_time: null,
            status: "PRESENT" // ER enum
        };
        this.data.attendance.push(newRecord);
        this.saveData();
        return newRecord;
    }

    markCheckOut(empId) {
        const today = new Date().toISOString().split('T')[0];
        const record = this.data.attendance.find(a => a.emp_id === empId && a.attendance_date === today);
        if (!record || record.check_out_time) return { error: "Cannot check out." };

        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        record.check_out_time = `${hours}:${minutes}`;

        // Calculate generic diff
        const [inH, inM] = record.check_in_time.split(':').map(Number);
        const [outH, outM] = record.check_out_time.split(':').map(Number);
        let diffHrs = (outH + outM/60) - (inH + inM/60);
        if(diffHrs < 0) diffHrs = 0;

        record.hours_spent = diffHrs.toFixed(1) + 'h';
        this.saveData();
        return record;
    }

    // --- Leave Details ---
    getLeavesForUser(empId) {
        return this.data.leave_details.filter(l => l.emp_id === empId);
    }

    getAllLeaves() {
        return this.data.leave_details;
    }

    createLeave(leaveData) {
        const newLeave = {
            leave_id: 'L' + Date.now(),
            ...leaveData,
            status: 'PENDING',
            applied_date: new Date().toISOString().split('T')[0],
            approved_date: null,
            approved_by: null
        };
        this.data.leave_details.push(newLeave);
        this.saveData();
        return newLeave;
    }

    updateLeaveStatus(leaveId, newStatus, approved_by_id) {
        const leave = this.data.leave_details.find(l => l.leave_id === leaveId);
        if (leave) {
            leave.status = newStatus;
            leave.approved_by = approved_by_id;
            leave.approved_date = new Date().toISOString().split('T')[0];
            this.saveData();
            return leave;
        }
        return false;
    }

    // --- Tasks ---
    getTasksForUser(empId) {
        return this.data.task.filter(t => t.assigned_to === empId);
    }

    getAllTasksForManager(managerId) {
        const teamIds = this.getUsersByManager(managerId).map(m => m.emp_id);
        return this.data.task.filter(t => teamIds.includes(t.assigned_to));
    }

    createTask(taskData) {
        const newTask = {
            task_id: 'TK' + Date.now(),
            ...taskData,
            status: 'NOT_STARTED', // ER enum
            progress_percentage: 0,
            updated_date: new Date().toISOString().split('T')[0]
        };
        this.data.task.push(newTask);
        this.saveData();
        return newTask;
    }

    updateTaskStatus(taskId, status, percentage) {
        const task = this.data.task.find(t => t.task_id === taskId);
        if (task) {
            task.status = status;
            if(percentage !== undefined) task.progress_percentage = percentage;
            task.updated_date = new Date().toISOString().split('T')[0];
            this.saveData();
            return task;
        }
        return false;
    }

    // --- Issues (Custom Module) ---
    getIssuesForUser(empId) {
        return this.data.issue ? this.data.issue.filter(i => i.emp_id === empId) : [];
    }

    createIssue(issueData) {
        if(!this.data.issue) this.data.issue = [];
        const newIssue = {
            issue_id: 'ISS-' + Math.floor(1000 + Math.random() * 9000),
            ...issueData,
            status: 'Open',
            assigned_to: 'Unassigned',
            raised_date: new Date().toISOString().split('T')[0],
            updates: []
        };
        this.data.issue.push(newIssue);
        this.saveData();
        return newIssue;
    }

    // --- Work Logs ---
    getWorkLogsForUser(empId) {
        return this.data.work_logs ? this.data.work_logs.filter(wl => wl.emp_id === empId) : [];
    }

    createWorkLog(logData) {
        if(!this.data.work_logs) this.data.work_logs = [];
        const newLog = {
            worklog_id: 'WL-' + Math.floor(1000 + Math.random() * 9000),
            ...logData,
            log_date: new Date().toISOString().split('T')[0]
        };
        this.data.work_logs.push(newLog);
        this.saveData();
        return newLog;
    }
}

// Export singleton
export const db = new Store();
