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

    getActor() {
        const userStr = localStorage.getItem('empTrackSessionV2');
        if (!userStr) return { id: '', name: '' };
        try {
            const user = JSON.parse(userStr);
            return { id: user.emp_id || '', name: user.emp_name || '' };
        } catch (e) {
            return { id: '', name: '' };
        }
    }

    async _fetch(endpoint, options = {}) {
        const actor = this.getActor();
        const headers = {
            'Content-Type': 'application/json',
            'Role': this.getRole(),
            'x-actor-id': actor.id,
            'x-actor-name': actor.name,
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

    // --- Super Admin: Companies ---
    async getCompanies(filters = {}) {
        const params = new URLSearchParams();
        if (filters.platformAdminId) params.set('platformAdminId', filters.platformAdminId);
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        const qs = params.toString();
        return this._fetch(`/companies${qs ? '?' + qs : ''}`);
    }

    async getCompanyById(id) {
        return this._fetch(`/companies/${id}`);
    }

    async createCompany(data) {
        return this._fetch('/companies', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateCompany(id, data) {
        return this._fetch(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async updateCompanyStatus(id, status) {
        return this._fetch(`/companies/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    async reassignCompanyPlatformAdmin(id, platform_admin_id) {
        return this._fetch(`/companies/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ platform_admin_id }) });
    }

    // --- Super Admin: Platform Admins ---
    async getPlatformAdmins(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        const qs = params.toString();
        return this._fetch(`/platform-admins${qs ? '?' + qs : ''}`);
    }

    async getActivePlatformAdminCount() {
        return this._fetch('/platform-admins/active-count');
    }

    async getPlatformAdminById(id) {
        return this._fetch(`/platform-admins/${id}`);
    }

    async getPlatformAdminActivity(id) {
        return this._fetch(`/platform-admins/${id}/activity`);
    }

    async createPlatformAdmin(data) {
        return this._fetch('/platform-admins', { method: 'POST', body: JSON.stringify(data) });
    }

    async updatePlatformAdmin(id, data) {
        return this._fetch(`/platform-admins/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async updatePlatformAdminStatus(id, status) {
        return this._fetch(`/platform-admins/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    // --- Super Admin: Invitations ---
    async getAllInvitations() {
        return this._fetch('/invitations');
    }

    async getInvitationByToken(token) {
        return this._fetch(`/invitations/${token}`);
    }

    async acceptInvitation(token, password) {
        return this._fetch(`/invitations/${token}/accept`, { method: 'POST', body: JSON.stringify({ password }) });
    }

    // --- Super Admin: Subscriptions ---
    async getSubscriptionPlans() {
        return this._fetch('/subscriptions');
    }

    async getCompaniesForPlan(id) {
        return this._fetch(`/subscriptions/${id}/companies`);
    }

    async createSubscriptionPlan(data) {
        return this._fetch('/subscriptions', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateSubscriptionPlan(id, data) {
        return this._fetch(`/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async updateSubscriptionPlanStatus(id, status) {
        return this._fetch(`/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    // --- Super Admin: Revenue ---
    async getRevenueSummary() {
        return this._fetch('/revenue/summary');
    }

    async getRevenueByPlan() {
        return this._fetch('/revenue/by-plan');
    }

    async getRevenueByCompany() {
        return this._fetch('/revenue/by-company');
    }

    async getRevenueTransactions(filters = {}) {
        const params = new URLSearchParams();
        if (filters.companyId) params.set('companyId', filters.companyId);
        if (filters.status) params.set('status', filters.status);
        const qs = params.toString();
        return this._fetch(`/revenue/transactions${qs ? '?' + qs : ''}`);
    }

    // --- Super Admin: Platform Analytics ---
    async getAnalyticsOverview() {
        return this._fetch('/analytics/overview');
    }

    async getCompanyGrowth(range, from, to) {
        return this._fetch(`/analytics/company-growth?${this._rangeQuery(range, from, to)}`);
    }

    async getEmployeeGrowth(range, from, to) {
        return this._fetch(`/analytics/employee-growth?${this._rangeQuery(range, from, to)}`);
    }

    async getSubscriptionDistribution() {
        return this._fetch('/analytics/subscription-distribution');
    }

    async getPlatformActivitySummary(range, from, to) {
        return this._fetch(`/analytics/platform-activity?${this._rangeQuery(range, from, to)}`);
    }

    _rangeQuery(range, from, to) {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (!from && range) params.set('range', range);
        return params.toString();
    }

    // --- Super Admin: Activity Logs ---
    async getActivityLogs(filters = {}) {
        const params = new URLSearchParams();
        if (filters.userId) params.set('userId', filters.userId);
        if (filters.action) params.set('action', filters.action);
        if (filters.companyId) params.set('companyId', filters.companyId);
        const qs = params.toString();
        return this._fetch(`/activity-logs${qs ? '?' + qs : ''}`);
    }

    // --- Super Admin: Critical Escalations ---
    async getCriticalEscalations(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.companyId) params.set('companyId', filters.companyId);
        const qs = params.toString();
        return this._fetch(`/critical-escalations${qs ? '?' + qs : ''}`);
    }

    async getCriticalEscalationById(id) {
        return this._fetch(`/critical-escalations/${id}`);
    }

    async createCriticalEscalation(data) {
        return this._fetch('/critical-escalations', { method: 'POST', body: JSON.stringify(data) });
    }

    async assignCriticalEscalation(id, assigned_team) {
        return this._fetch(`/critical-escalations/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_team }) });
    }

    async updateCriticalEscalationPriority(id, priority) {
        return this._fetch(`/critical-escalations/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) });
    }

    async resolveCriticalEscalation(id, resolution_notes) {
        return this._fetch(`/critical-escalations/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes }) });
    }

    async escalateCriticalEscalation(id, note) {
        return this._fetch(`/critical-escalations/${id}/escalate`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async addCriticalEscalationComment(id, message) {
        return this._fetch(`/critical-escalations/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    // --- Super Admin: Platform Settings ---
    async getPlatformSettings() {
        return this._fetch('/platform-settings');
    }

    async updatePlatformSettings(data) {
        return this._fetch('/platform-settings', { method: 'PATCH', body: JSON.stringify(data) });
    }
}

export const db = new ApiStore();

