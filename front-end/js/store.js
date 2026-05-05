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
        return this._fetch(`/tasks/user/${empId}`);
    }

    async getAllTasksForManager(managerId) {
        return this._fetch(`/tasks?managerId=${managerId}`);
    }

    async createTask(taskData) {
        return this._fetch('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTaskStatus(taskId, status, percentage) {
        const body = { status };
        if (percentage !== undefined) body.progress_percentage = percentage;
        return this._fetch(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    async updateTaskDetails(taskId, updates) {
        return this._fetch(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    // --- Issues ---
    async getIssuesForUser(empId) {
        return this._fetch(`/issues/user/${empId}`);
    }

    async getAllIssues() {
        return this._fetch('/issues');
    }

    async createIssue(issueData) {
        return this._fetch('/issues', {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
    }

    async updateIssue(issueId, updateData) {
        return this._fetch(`/issues/${issueId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
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
}

export const db = new ApiStore();

