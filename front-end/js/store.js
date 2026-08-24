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

    // --- Authentication ---
    // Verifies credentials and resolves the account's role server-side. Works for every
    // EmpTrack role (platform-level and company-level) since they all live in the same
    // employee/user table - the backend is the one deciding who this is, not the caller.
    async login(email, password) {
        return this._fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // --- Employee ---
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

    // Company Admin raises an issue - notifies only their company's Platform Admin.
    async raiseCompanyIssue(issueData) {
        return this._fetch('/company/tickets', {
            method: 'POST',
            body: JSON.stringify(issueData)
        });
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

    async createEvent(requesterEmpId, eventData) {
        return this._fetch(`/calendar/events?requesterEmpId=${requesterEmpId}`, {
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

    // --- Platform Admin: Dashboard ---
    async getPlatformDashboardSummary() {
        return this._fetch('/platform-dashboard/summary');
    }

    // --- Platform Admin: My Companies (view-only, reuses the existing Companies endpoint) ---
    async getMyCompanies() {
        return this.getCompanies();
    }

    // --- Platform Admin: Technical Team ---
    async getTechnicalTeam(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        const qs = params.toString();
        return this._fetch(`/technical-team${qs ? '?' + qs : ''}`);
    }

    async getTechnicalTeamMember(id) {
        return this._fetch(`/technical-team/${id}`);
    }

    async createTechnicalTeamMember(data) {
        return this._fetch('/technical-team', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateTechnicalTeamMember(id, data) {
        return this._fetch(`/technical-team/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async updateTechnicalTeamMemberStatus(id, status) {
        return this._fetch(`/technical-team/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    // --- Platform Admin: Support Team ---
    async getSupportTeam(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        const qs = params.toString();
        return this._fetch(`/support-team${qs ? '?' + qs : ''}`);
    }

    async getSupportTeamMember(id) {
        return this._fetch(`/support-team/${id}`);
    }

    async createSupportTeamMember(data) {
        return this._fetch('/support-team', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateSupportTeamMember(id, data) {
        return this._fetch(`/support-team/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async updateSupportTeamMemberStatus(id, status) {
        return this._fetch(`/support-team/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    // --- Platform Admin: Team Workload ---
    async getTeamWorkload() {
        return this._fetch('/platform-team/workload');
    }

    // --- Platform Admin: Technical Issues ---
    async getTechnicalIssues(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.companyId) params.set('companyId', filters.companyId);
        if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
        const qs = params.toString();
        return this._fetch(`/technical-issues${qs ? '?' + qs : ''}`);
    }

    async getTechnicalIssueById(id) {
        return this._fetch(`/technical-issues/${id}`);
    }

    async assignTechnicalIssue(id, assigned_to) {
        return this._fetch(`/technical-issues/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to }) });
    }

    async reassignTechnicalIssue(id, assigned_to, reason) {
        return this._fetch(`/technical-issues/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ assigned_to, reason }) });
    }

    async resolveTechnicalIssue(id, resolution_notes) {
        return this._fetch(`/technical-issues/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes }) });
    }

    async escalateTechnicalIssue(id, note) {
        return this._fetch(`/technical-issues/${id}/escalate`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async addTechnicalIssueComment(id, message) {
        return this._fetch(`/technical-issues/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    // --- Platform Admin: Support Tickets ---
    async getSupportTickets(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.companyId) params.set('companyId', filters.companyId);
        if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
        const qs = params.toString();
        return this._fetch(`/support-tickets${qs ? '?' + qs : ''}`);
    }

    async getSupportTicketById(id) {
        return this._fetch(`/support-tickets/${id}`);
    }

    async assignSupportTicket(id, assigned_to) {
        return this._fetch(`/support-tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to }) });
    }

    async reassignSupportTicket(id, assigned_to, reason) {
        return this._fetch(`/support-tickets/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ assigned_to, reason }) });
    }

    async resolveSupportTicket(id, resolution_notes) {
        return this._fetch(`/support-tickets/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes }) });
    }

    async escalateSupportTicket(id, note) {
        return this._fetch(`/support-tickets/${id}/escalate`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async addSupportTicketComment(id, message) {
        return this._fetch(`/support-tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    // --- Support Member: Dashboard ---
    async getSupportMemberStats() {
        return this._fetch('/support-member/stats');
    }

    async getTicketCategories() {
        return this._fetch('/support-member/categories');
    }

    // --- Support Member: Tickets ---
    async getMyDashboardTickets(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.category) params.set('category', filters.category);
        if (filters.companyId) params.set('companyId', filters.companyId);
        if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
        if (filters.search) params.set('search', filters.search);
        if (filters.escalatedOnly) params.set('escalatedOnly', 'true');
        const qs = params.toString();
        return this._fetch(`/support-member/tickets${qs ? '?' + qs : ''}`);
    }

    async getMyDashboardTicketById(id) {
        return this._fetch(`/support-member/tickets/${id}`);
    }

    async claimTicket(id) {
        return this._fetch(`/support-member/tickets/${id}/claim`, { method: 'PATCH' });
    }

    async changeTicketStatus(id, status) {
        return this._fetch(`/support-member/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    async changeTicketPriority(id, priority) {
        return this._fetch(`/support-member/tickets/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) });
    }

    async changeTicketCategory(id, category) {
        return this._fetch(`/support-member/tickets/${id}/category`, { method: 'PATCH', body: JSON.stringify({ category }) });
    }

    async resolveMyTicket(id, resolution_notes) {
        return this._fetch(`/support-member/tickets/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes }) });
    }

    async reopenTicket(id, reason) {
        return this._fetch(`/support-member/tickets/${id}/reopen`, { method: 'PATCH', body: JSON.stringify({ reason }) });
    }

    async closeTicket(id) {
        return this._fetch(`/support-member/tickets/${id}/close`, { method: 'PATCH' });
    }

    async addTicketMessage(id, message) {
        return this._fetch(`/support-member/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    async getInternalNotes(id) {
        return this._fetch(`/support-member/tickets/${id}/internal-notes`);
    }

    async addInternalNote(id, message) {
        return this._fetch(`/support-member/tickets/${id}/internal-notes`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    async escalateToTechnicalTeam(id, note) {
        return this._fetch(`/support-member/tickets/${id}/escalate-technical`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async escalateToPlatformAdmin(id, note) {
        return this._fetch(`/support-member/tickets/${id}/escalate-platform-admin`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async getLinkedTechnicalTicket(id) {
        return this._fetch(`/support-member/technical-issues/${id}`);
    }

    async getSupportCompanySummary(id) {
        return this._fetch(`/support-member/companies/${id}`);
    }

    // --- Technical Member: Dashboard ---
    async getTechnicalMemberStats() {
        return this._fetch('/technical-member/stats');
    }

    async getTechnicalMemberWorkProgress(days = 7) {
        return this._fetch(`/technical-member/work-progress?days=${days}`);
    }

    async getTechnicalMemberRecentUpdates(limit = 10) {
        return this._fetch(`/technical-member/recent-updates?limit=${limit}`);
    }

    // --- Technical Member: Assigned Issues ---
    // scope: 'active' for the working queue, 'history' for completed work.
    async getMyTechnicalIssues(filters = {}) {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.priority) params.set('priority', filters.priority);
        if (filters.search) params.set('search', filters.search);
        if (filters.scope) params.set('scope', filters.scope);
        const qs = params.toString();
        return this._fetch(`/technical-member/issues${qs ? '?' + qs : ''}`);
    }

    async getMyTechnicalIssueById(id) {
        return this._fetch(`/technical-member/issues/${id}`);
    }

    async updateMyIssueStatus(id, status) {
        return this._fetch(`/technical-member/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }

    async updateMyIssueProgress(id, progress_percentage, note) {
        return this._fetch(`/technical-member/issues/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress_percentage, note }) });
    }

    async getMyIssueWorkNotes(id) {
        return this._fetch(`/technical-member/issues/${id}/notes`);
    }

    async addMyIssueWorkNote(id, message) {
        return this._fetch(`/technical-member/issues/${id}/notes`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    async addMyIssueComment(id, message) {
        return this._fetch(`/technical-member/issues/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) });
    }

    async getMyIssueAttachments(id) {
        return this._fetch(`/technical-member/issues/${id}/attachments`);
    }

    async getMyIssueAttachment(id, attachmentId) {
        return this._fetch(`/technical-member/issues/${id}/attachments/${attachmentId}`);
    }

    async uploadMyIssueAttachment(id, attachment) {
        return this._fetch(`/technical-member/issues/${id}/attachments`, { method: 'POST', body: JSON.stringify(attachment) });
    }

    async deleteMyIssueAttachment(id, attachmentId) {
        return this._fetch(`/technical-member/issues/${id}/attachments/${attachmentId}`, { method: 'DELETE' });
    }

    async resolveMyIssue(id, resolution_notes) {
        return this._fetch(`/technical-member/issues/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes }) });
    }

    async submitMyIssueForVerification(id, note) {
        return this._fetch(`/technical-member/issues/${id}/submit-verification`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    // --- Platform Admin: verification of Technical Member work ---
    async verifyTechnicalIssue(id, note) {
        return this._fetch(`/technical-issues/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ note }) });
    }

    async rejectTechnicalIssueVerification(id, reason) {
        return this._fetch(`/technical-issues/${id}/reject-verification`, { method: 'PATCH', body: JSON.stringify({ reason }) });
    }
}

export const db = new ApiStore();

