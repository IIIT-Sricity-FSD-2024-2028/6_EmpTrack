// /js/app.js
import { auth } from './auth.js';

// Import Views
import { renderLoginView } from './views/auth/login.js';
import { renderEmployeeDashboard } from './views/employee/dashboard.js';
import { renderTeamLeadDashboard } from './views/teamlead/dashboard.js';
import { renderHRDashboard } from './views/hr/dashboard.js';
import { renderLayout } from './components/layout.js';

// Import Lazy View Implementations
// Employee
import { renderEmployeeAttendance } from './views/employee/attendance.js';
import { renderEmployeeLeave } from './views/employee/leave.js';
import { renderEmployeeTasks } from './views/employee/tasks.js';
import { renderUpdateTaskProgress } from './views/employee/update-task.js';
import { renderIssuesList } from './views/employee/issues-list.js';
import { renderRaiseIssue } from './views/employee/raise-issue.js';
import { renderIssueDetails } from './views/employee/issue-details.js';
import { renderWorkLogs } from './views/employee/work-logs.js';
import { renderLeaveRequest } from './views/employee/leave-request.js';
import { renderEmployeeProfile } from './views/employee/profile.js';
// TeamLead
import { renderTeamLeadAttendance } from './views/teamlead/attendance.js';
import { renderTeamLeadLeave } from './views/teamlead/leave.js';
import { renderTeamLeadTasks } from './views/teamlead/tasks.js';
// HR
import { renderHRReports } from './views/hr/reports.js';
import { renderHREscalations } from './views/hr/escalations.js';

const appContainer = document.getElementById('app');

function router() {
    const hash = window.location.hash || '#';
    
    const isAuthRoute = hash === '#login';
    if (!isAuthRoute && !auth.isAuthenticated()) {
        window.location.hash = '#login';
        return;
    }
    if (isAuthRoute && auth.isAuthenticated()) {
        window.location.hash = '#dashboard';
        return;
    }

    appContainer.innerHTML = '';

    if (isAuthRoute) {
        renderLoginView(appContainer);
        return;
    }

    // All authenticated routes get wrapped in layout
    renderLayout(appContainer);
    const mainContent = document.getElementById('main-content');
    
    // Highlight correct nav item manually
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[href="${hash}"]`);
    if(activeNav) activeNav.classList.add('active');

    const role = auth.getRole();

    switch (true) {
        case hash === '#dashboard':
            if (role === 'EMPLOYEE') renderEmployeeDashboard(mainContent);
            else if (role === 'TEAMLEAD') renderTeamLeadDashboard(mainContent);
            else if (role === 'HR') renderHRDashboard(mainContent);
            break;

        // Custom route for Update Task
        case hash.startsWith('#update-task/'):
            if (role === 'EMPLOYEE') {
                const parts = hash.split('/');
                if(parts.length === 2 && parts[1]) {
                    renderUpdateTaskProgress(mainContent, parts[1]);
                }
            }
            break;

        // Custom route for Issue Details
        case hash.startsWith('#issue-details/'):
            if (role === 'EMPLOYEE') {
                const parts = hash.split('/');
                if(parts.length === 2 && parts[1]) {
                    renderIssueDetails(mainContent, parts[1]);
                }
            }
            break;

        // Employee Routes
        case hash === '#attendance':
            if (role === 'EMPLOYEE') renderEmployeeAttendance(mainContent);
            break;
        case hash === '#leave':
            if (role === 'EMPLOYEE') renderEmployeeLeave(mainContent);
            break;
        case hash === '#tasks':
            if (role === 'EMPLOYEE') renderEmployeeTasks(mainContent);
            break;
        case hash === '#issues':
            if (role === 'EMPLOYEE') renderIssuesList(mainContent);
            break;
        case hash === '#raise-issue':
            if (role === 'EMPLOYEE') renderRaiseIssue(mainContent);
            break;
        case hash === '#work-logs':
            if (role === 'EMPLOYEE') renderWorkLogs(mainContent);
            break;
        case hash === '#leave-request':
            if (role === 'EMPLOYEE') renderLeaveRequest(mainContent);
            break;
        case hash === '#profile':
            if (role === 'EMPLOYEE') renderEmployeeProfile(mainContent);
            break;

        // TeamLead Routes
        case hash === '#team-attendance':
            if (role === 'TEAMLEAD') renderTeamLeadAttendance(mainContent);
            break;
        case hash === '#leave-approvals':
            if (role === 'TEAMLEAD') renderTeamLeadLeave(mainContent);
            break;
        case hash === '#assign-tasks':
            if (role === 'TEAMLEAD') renderTeamLeadTasks(mainContent);
            break;

        // HR Routes
        case hash === '#org-reports':
            if (role === 'HR') renderHRReports(mainContent);
            break;
        case hash === '#escalations':
            if (role === 'HR') renderHREscalations(mainContent);
            break;

        default:
            mainContent.innerHTML = `
                <div class="card" style="text-align:center; padding: 40px;">
                    <h2>View Not Found</h2>
                    <p style="color:var(--text-muted);">The requested module is either under construction or invalid.</p>
                </div>
            `;
    }
}

window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', router);
