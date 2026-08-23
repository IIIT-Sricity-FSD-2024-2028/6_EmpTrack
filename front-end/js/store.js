const API_BASE = 'http://localhost:3000';

class ApiStore {
    getRole() {
        const userStr = localStorage.getItem('empTrackSessionV2');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.role;
            } catch (e) {
                return 'EMPLOYEE';
            }
        }
        return 'EMPLOYEE';
    }

    async _fetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Role': this.getRole(),
            ...(options.headers || {})
        };
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'API request failed');
        }
        return await res.json();
    }

    // --- Employee ---
    async getUserByEmail(email) {
        return this._fetch(`/employees/email/${email}`);
    }

    async getUserById(id) {
        return this._fetch(`/employees/${id}`);
    }

    async getUsersByManager(managerId) {
        return this._fetch(`/employees?managerId=${managerId}`);
    }

    async deleteEmployee(empId) {
        return this._fetch(`/employees/${empId}`, {
            method: 'DELETE'
        });
    }

    async updateEmployee(empId, updateData) {
        return this._fetch(`/employees/${empId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    }

    async updateUserPassword(empId, newPassword) {
        return this._fetch(`/employees/${empId}/password`, {
            method: 'PATCH',
            body: JSON.stringify({ newPassword })
        });
    }

    // --- Attendance ---
    async getAttendanceForUser(empId) {
        return this._fetch(`/attendance/user/${empId}`);
    }

    async markAttendance(empId, checkInTime, mode = "OFFICE") {
        return this._fetch('/attendance/check-in', {
            method: 'POST',
            body: JSON.stringify({ empId, checkInTime, mode })
        });
    }

    async markCheckOut(empId) {
        return this._fetch('/attendance/check-out', {
            method: 'POST',
            body: JSON.stringify({ empId })
        });
    }

    // --- Leave Details ---
    async getLeavesForUser(empId) {
        return this._fetch(`/leaves/user/${empId}`);
    }

    async getAllLeaves() {
        return this._fetch('/leaves');
    }

    async createLeave(leaveData) {
        return this._fetch('/leaves', {
            method: 'POST',
            body: JSON.stringify(leaveData)
        });
    }

    async updateLeaveStatus(leaveId, newStatus, approved_by_id, reject_reason = null) {
        const body = { status: newStatus, approved_by_id };
        if (reject_reason) body.reject_reason = reject_reason;
        return this._fetch(`/leaves/${leaveId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    // --- Tasks ---
    async getTasksForUser(empId) {
        let serverTasks = [];
        try { serverTasks = await this._fetch(`/tasks/user/${empId}`); } catch(e){}
        const localTasks = JSON.parse(localStorage.getItem('empTrack_local_tasks') || '[]');
        const userLocal = localTasks.filter(t => t.assigned_to === empId || t.employee_name === empId); // map by ID or name depending on the form
        return [...serverTasks, ...userLocal];
    }

    async getAllTasksForManager(managerId) {
        let serverTasks = [];
        try { serverTasks = await this._fetch(`/tasks?managerId=${managerId}`); } catch(e){}
        const localTasks = JSON.parse(localStorage.getItem('empTrack_local_tasks') || '[]');
        return [...serverTasks, ...localTasks];
    }

    async createTask(taskData) {
        const localTasks = JSON.parse(localStorage.getItem('empTrack_local_tasks') || '[]');
        const newTask = {
            task_id: taskData.task_id || 'TSK-' + Math.floor(1000 + Math.random() * 9000),
            task_title: taskData.task_title || taskData.title,
            task_description: taskData.task_description || taskData.description,
            deadline: taskData.deadline,
            est_hours: taskData.est_hours || taskData.hours,
            status: taskData.status || 'ASSIGNED',
            assigned_to: taskData.assigned_to || taskData.employee,
            employee_name: taskData.employee_name || taskData.employee, // for TL view
            priority: taskData.priority || 'Medium'
        };
        localTasks.push(newTask);
        localStorage.setItem('empTrack_local_tasks', JSON.stringify(localTasks));

        try {
            return await this._fetch('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
        } catch(e) {
            return newTask;
        }
    }

    async updateTaskStatus(taskId, status, percentage) {
        const body = { status };
        if (percentage !== undefined) body.progress_percentage = percentage;
        
        let serverError = null;
        try {
            await this._fetch(`/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });
        } catch (e) {
            serverError = e;
        }

        const localTasks = JSON.parse(localStorage.getItem('empTrack_local_tasks') || '[]');
        const localIndex = localTasks.findIndex(t => t.task_id === taskId);
        
        if (localIndex !== -1) {
            localTasks[localIndex] = { ...localTasks[localIndex], ...body };
            localStorage.setItem('empTrack_local_tasks', JSON.stringify(localTasks));
            return localTasks[localIndex];
        }

        if (serverError) throw serverError;
        return true;
    }

    async updateTaskDetails(taskId, updates) {
        let serverError = null;
        try {
            await this._fetch(`/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        } catch (e) {
            serverError = e;
        }

        const localTasks = JSON.parse(localStorage.getItem('empTrack_local_tasks') || '[]');
        const localIndex = localTasks.findIndex(t => t.task_id === taskId);
        
        if (localIndex !== -1) {
            localTasks[localIndex] = { ...localTasks[localIndex], ...updates };
            localStorage.setItem('empTrack_local_tasks', JSON.stringify(localTasks));
            return localTasks[localIndex];
        }

        if (serverError) throw serverError;
        return true;
    }

    // --- Issues ---
    async getIssuesForUser(empId) {
        return this._fetch(`/issues/user/${empId}`);
    }

    async getAllIssues() {
        let serverIssues = [];
        try {
            serverIssues = await this._fetch('/issues');
        } catch (e) {}
        const localIssues = JSON.parse(localStorage.getItem('empTrack_local_issues') || '[]');
        return [...serverIssues, ...localIssues];
    }

    async createIssue(issueData) {
        const localIssues = JSON.parse(localStorage.getItem('empTrack_local_issues') || '[]');
        const newIssue = {
            issue_id: 'ISS-' + Math.floor(1000 + Math.random() * 9000),
            ...issueData,
            status: 'Pending',
            raised_date: new Date().toISOString().split('T')[0]
        };
        localIssues.push(newIssue);
        localStorage.setItem('empTrack_local_issues', JSON.stringify(localIssues));

        try {
            return await this._fetch('/issues', {
                method: 'POST',
                body: JSON.stringify(issueData)
            });
        } catch (e) {
            return newIssue;
        }
    }

    async updateIssue(issueId, updateData) {
        let serverError = null;
        try {
            await this._fetch(`/issues/${issueId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            });
        } catch (e) {
            serverError = e;
        }

        const localIssues = JSON.parse(localStorage.getItem('empTrack_local_issues') || '[]');
        const localIndex = localIssues.findIndex(i => i.issue_id === issueId);
        
        if (localIndex !== -1) {
            localIssues[localIndex] = { ...localIssues[localIndex], ...updateData };
            localStorage.setItem('empTrack_local_issues', JSON.stringify(localIssues));
            return localIssues[localIndex];
        }

        if (serverError) throw serverError;
        return true;
    }

    // --- Work Logs ---
    async getWorkLogsForUser(empId) {
        return this._fetch(`/worklogs/user/${empId}`);
    }

    async createWorkLog(logData) {
        return this._fetch('/worklogs', {
            method: 'POST',
            body: JSON.stringify(logData)
        });
    }

    // --- Notifications ---
    async getNotificationsForUser(empId) {
        return this._fetch(`/notifications/user/${empId}`);
    }

    async createNotification(empId, message, type = "info") {
        return this._fetch('/notifications', {
            method: 'POST',
            body: JSON.stringify({ employee_id: empId, message, type })
        });
    }

    // --- Escalations ---
    async createEscalationRecord(data) {
        return this._fetch('/escalations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // --- Notifications ---
    getNotificationsForUser(empId) {
        return this.data.notifications ? this.data.notifications.filter(n => n.employee_id === empId) : [];
    }

    createNotification(empId, message, type = 'info') {
        if (!this.data.notifications) this.data.notifications = [];
        const newNotif = {
            id: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
            employee_id: empId,
            message,
            type,
            timestamp: new Date().toISOString(),
            is_read: false
        };
        this.data.notifications.push(newNotif);
        this.saveData();
        return newNotif;
    }

    // --- Calendar ---
    async getHolidays(requesterEmpId, year, month) {
        return this._fetch(`/calendar/holidays?${this._calQuery(requesterEmpId, year, month)}`);
    }

    async getMyCalendar(requesterEmpId, year, month) {
        return this._fetch(`/calendar/my-calendar?${this._calQuery(requesterEmpId, year, month)}`);
    }

    async getTeamCalendar(requesterEmpId, year, month) {
        return this._fetch(`/calendar/team-calendar?${this._calQuery(requesterEmpId, year, month)}`);
    }

    async getCompanyCalendar(requesterEmpId, year, month) {
        return this._fetch(`/calendar/company-calendar?${this._calQuery(requesterEmpId, year, month)}`);
    }

    async getCompanyEvents(requesterEmpId, year, month) {
        return this._fetch(`/calendar/company-events?${this._calQuery(requesterEmpId, year, month)}`);
    }

    async createCompanyEvent(requesterEmpId, eventData) {
        return this._fetch(`/calendar/company-events?requesterEmpId=${requesterEmpId}`, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    _calQuery(requesterEmpId, year, month) {
        const params = new URLSearchParams({ requesterEmpId: requesterEmpId || '' });
        if (year) params.set('year', year);
        if (month) params.set('month', month);
        return params.toString();
    }
}

export const db = new ApiStore();

