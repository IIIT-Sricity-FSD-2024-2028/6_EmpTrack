// /js/components/layout.js
import { auth } from '../auth.js';

export function initLayout() {
    const user = auth.getCurrentUser();
    if (!user) return; // Unauthenticated. Should be handled by page auth guard

    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer = document.getElementById('header-container');

    // Get current path for active link highlighting
    const currentPath = window.location.pathname;

    function isActive(path) {
        return currentPath.includes(path) ? 'active' : '';
    }

    // Sidebar Links based on role
    let navItems = '';
    if (user.role === 'EMPLOYEE') {
        navItems = `
            <a href="/front-end/employee/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/employee/tasks.html" class="nav-item ${isActive('task')}"><i class="ph ph-briefcase"></i> Assigned Tasks</a>
            <a href="/front-end/employee/issues-list.html" class="nav-item ${isActive('issue')}"><i class="ph ph-warning-circle"></i> View Issue Status</a>
            <a href="/front-end/employee/work-logs.html" class="nav-item ${isActive('work-logs')}"><i class="ph ph-clock"></i> Work Logs</a>
            <a href="/front-end/employee/attendance.html" class="nav-item ${isActive('attendance')}"><i class="ph ph-calendar-check"></i> Attendance</a>
            <a href="/front-end/employee/leave-request.html" class="nav-item ${isActive('leave-request')}"><i class="ph ph-calendar-x"></i> Leave Request</a>`;
    } else if (user.role === 'TEAMLEAD') {
        navItems = `
            <a href="/front-end/teamlead/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/teamlead/work-monitoring.html" class="nav-item ${isActive('work-monitoring')}"><i class="ph ph-chart-line-up"></i> Work Monitoring</a>
            <a href="/front-end/teamlead/tasks.html" class="nav-item ${isActive('tasks')}"><i class="ph ph-list-checks"></i> Assign Tasks</a>
            <a href="/front-end/teamlead/issue-management.html" class="nav-item ${isActive('issue')}"><i class="ph ph-warning-circle"></i> Issue Management</a>
            <a href="/front-end/teamlead/escalations.html" class="nav-item ${isActive('escalations')}"><i class="ph ph-arrow-up-right"></i> Escalations</a>
            <a href="/front-end/teamlead/leave.html" class="nav-item ${isActive('leave')}"><i class="ph ph-calendar-x"></i> Leave Management</a>
            <a href="/front-end/teamlead/team-performance.html" class="nav-item ${isActive('team-performance')}"><i class="ph ph-trend-up"></i> Team Performance</a>
            <a href="/front-end/teamlead/reports.html" class="nav-item ${isActive('reports')}"><i class="ph ph-file-text"></i> Reports</a>
        `;
    } else if (user.role === 'HR') {
        navItems = `
            <a href="/front-end/hr/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/hr/employee-management.html" class="nav-item ${isActive('employee-management')}"><i class="ph ph-users"></i> Employee Management</a>
            <a href="/front-end/hr/attendance.html" class="nav-item ${isActive('attendance')}"><i class="ph ph-calendar-check"></i> Attendance</a>
            <a href="/front-end/hr/escalations.html" class="nav-item ${isActive('escalations')}"><i class="ph ph-warning-circle"></i> Escalations</a>
            <a href="/front-end/hr/reports.html" class="nav-item ${isActive('reports')}"><i class="ph ph-file-text"></i> Reports</a>
            <a href="/front-end/hr/settings.html" class="nav-item ${isActive('settings')}"><i class="ph ph-gear"></i> Settings</a>
        `;
    }

    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <i class="ph-fill ph-check-circle"></i> EmpTrack
                    </div>
                </div>
                <nav class="sidebar-nav">
                    ${navItems}
                </nav>
                <div class="sidebar-footer" style="padding-bottom: var(--spacing-md);">
                    <button id="logout-btn" class="nav-item" style="width: 100%; justify-content:flex-start; outline:none; margin-bottom: var(--spacing-md); background: transparent; border: none; cursor: pointer; color: white; font-size: var(--text-sm);">
                        <i class="ph ph-sign-out"></i> Logout
                    </button>
                    
                    <a href="/front-end/${user.role.toLowerCase()}/profile.html" style="text-decoration: none; display: block;">
                    <div class="user-profile" style="display:flex; align-items:center; gap:var(--spacing-md); padding: 0 var(--spacing-lg);">
                        <div class="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background-color: rgba(255,255,255,0.2); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid rgba(255,255,255,0.3);">
                            ${user.role === 'TEAMLEAD' ? 'RS' : user.emp_name.charAt(0)}
                        </div>
                        <div class="user-info" style="display:flex; flex-direction:column;">
                            <span class="user-name" style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: #FFFFFF;">${user.role === 'TEAMLEAD' ? 'Rinku Singh' : user.emp_name}</span>
                            <span class="user-role" style="font-size: var(--text-xs); color: rgba(255,255,255,0.7);">${user.role === 'HR' ? 'Super User' : user.role === 'TEAMLEAD' ? 'Team Lead' : 'Employee'}</span>
                        </div>
                    </div>
                    </a>
                </div>
            </aside>
        `;
    }

    if (headerContainer) {
        // Find page title encoded in a meta tag or just default
        let pageTitle = "Dashboard";
        const titleEl = document.getElementById('page-title');
        if (titleEl) pageTitle = titleEl.textContent;

        const rolePortal = user.role === 'EMPLOYEE' ? 'Employee Portal' : (user.role === 'TEAMLEAD' ? 'Team Lead Portal' : 'HR Portal');

        headerContainer.innerHTML = `
            <header class="top-header">
                <div class="header-left" style="display:flex; flex-direction:column; gap:0;">
                    <h2 class="header-title" id="injected-page-title" style="margin-bottom:0;">${pageTitle}</h2>
                    <span style="font-size:var(--text-xs); color:var(--text-muted); font-weight:var(--font-medium);">${rolePortal}</span>
                </div>
                <div class="header-right" style="display:flex; gap:16px; align-items:center;">
                    <a href="/front-end/${user.role.toLowerCase()}/notifications.html" style="text-decoration:none; color:inherit;">
                        <div class="notification-bell ${isActive('notifications') ? 'active-bell' : ''}" style="font-size: var(--text-xl); color: ${isActive('notifications') ? 'var(--nt-primary)' : 'var(--text-muted)'}; cursor: pointer; transition: 0.2s; position:relative;">
                            <i class="ph ph-bell"></i>
                            <span style="position:absolute; top:-4px; right:-4px; background:var(--danger-color, #ef4444); width:8px; height:8px; border-radius:50%;"></span>
                        </div>
                    </a>
                    <a href="/front-end/${user.role.toLowerCase()}/profile.html" style="text-decoration: none;" title="My Profile">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px; margin-left: var(--spacing-lg); box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3); transition: transform 0.2s ease; cursor: pointer;">
                            ${user.role === 'TEAMLEAD' ? 'RS' : user.emp_name.charAt(0)}
                        </div>
                    </a>
                </div>
            </header>
        `;
    }

    // Bind events
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.logout();
            window.location.href = '/front-end/index.html';
        });
    }

    // Notification dropdown removed in favor of direct page link
}
