// /js/components/layout.js
import { auth } from '../auth.js';
import { theme } from '../theme.js';
import { db } from '../store.js';
import { renderCalendar } from './calendar.js';

// Roles the backend's calendar controller actually grants access to
// (see back-end/src/calendar/calendar.controller.ts @Roles decorators).
const CALENDAR_ROLES = ['EMPLOYEE', 'TEAMLEAD', 'HR', 'COMPANY_ADMIN'];

function fetchEventsFor(user) {
    if (user.role === 'EMPLOYEE') return (y, m) => db.getMyCalendar(user.emp_id, y, m);
    if (user.role === 'TEAMLEAD') return (y, m) => db.getTeamCalendar(user.emp_id, y, m);
    return (y, m) => db.getCompanyCalendar(user.emp_id, y, m); // HR, COMPANY_ADMIN
}

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
    } else if (user.role === 'COMPANY_ADMIN') {
        navItems = `
            <a href="/front-end/company_admin/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Admin Dashboard</a>
            <a href="/front-end/company_admin/employee-management.html" class="nav-item ${isActive('employee-management')}"><i class="ph ph-users"></i> All Employees</a>
            <a href="/front-end/company_admin/raise-issue.html" class="nav-item ${isActive('raise-issue')}"><i class="ph ph-flag"></i> Raise Issue</a>
            <a href="/front-end/company_admin/billing.html" class="nav-item ${isActive('billing')}"><i class="ph ph-credit-card"></i> Subscription &amp; Billing</a>
        `;
    } else if (user.role === 'SUPER_ADMIN') {
        navItems = `
            <a href="/front-end/super_admin/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/super_admin/companies.html" class="nav-item ${isActive('companies')}"><i class="ph ph-buildings"></i> Companies</a>
            <a href="/front-end/super_admin/platform-admins.html" class="nav-item ${isActive('platform-admins')}"><i class="ph ph-shield-star"></i> Platform Admins</a>
            <a href="/front-end/super_admin/subscriptions.html" class="nav-item ${isActive('subscriptions')}"><i class="ph ph-credit-card"></i> Subscriptions</a>
            <a href="/front-end/super_admin/revenue.html" class="nav-item ${isActive('revenue')}"><i class="ph ph-currency-circle-dollar"></i> Revenue</a>
            <a href="/front-end/super_admin/analytics.html" class="nav-item ${isActive('analytics')}"><i class="ph ph-chart-line-up"></i> Analytics</a>
            <a href="/front-end/super_admin/activity.html" class="nav-item ${isActive('activity')}"><i class="ph ph-list-magnifying-glass"></i> Activity</a>
            <a href="/front-end/super_admin/escalations.html" class="nav-item ${isActive('escalations')}"><i class="ph ph-siren"></i> Escalations</a>
            <a href="/front-end/super_admin/settings.html" class="nav-item ${isActive('settings')}"><i class="ph ph-gear"></i> Settings</a>
        `;
    } else if (user.role === 'PLATFORM_ADMIN') {
        navItems = `
            <a href="/front-end/platform_admin/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/platform_admin/my-companies.html" class="nav-item ${isActive('my-companies')}"><i class="ph ph-buildings"></i> My Companies</a>
            <a href="/front-end/platform_admin/payments.html" class="nav-item ${isActive('payments')}"><i class="ph ph-credit-card"></i> Company Payments</a>
            <a href="/front-end/platform_admin/technical-team.html" class="nav-item ${isActive('technical-team')}"><i class="ph ph-hard-drives"></i> Technical Team</a>
            <a href="/front-end/platform_admin/support-team.html" class="nav-item ${isActive('support-team')}"><i class="ph ph-headset"></i> Support Team</a>
            <a href="/front-end/platform_admin/technical-issues.html" class="nav-item ${isActive('technical-issues')}"><i class="ph ph-bug"></i> Technical Issues</a>
            <a href="/front-end/platform_admin/support-tickets.html" class="nav-item ${isActive('support-tickets')}"><i class="ph ph-ticket"></i> Support Tickets</a>
            <a href="/front-end/platform_admin/workload.html" class="nav-item ${isActive('workload')}"><i class="ph ph-gauge"></i> Workload</a>
        `;
    } else if (user.role === 'SUPPORT_MEMBER') {
        navItems = `
            <a href="/front-end/support_member/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/support_member/my-tickets.html" class="nav-item ${isActive('my-tickets')}"><i class="ph ph-user-focus"></i> My Tickets</a>
            <a href="/front-end/support_member/escalated.html" class="nav-item ${isActive('escalated')}"><i class="ph ph-arrow-up-right"></i> Escalated</a>
        `;
    } else if (user.role === 'TECHNICAL_MEMBER') {
        navItems = `
            <a href="/front-end/technical_member/dashboard.html" class="nav-item ${isActive('dashboard')}"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="/front-end/technical_member/assigned-issues.html" class="nav-item ${isActive('assigned-issues')}"><i class="ph ph-bug"></i> Assigned Issues</a>
            <a href="/front-end/technical_member/issue-history.html" class="nav-item ${isActive('issue-history')}"><i class="ph ph-clock-counter-clockwise"></i> Issue History</a>
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
                    <button id="logout-btn" class="nav-item" style="width: 100%; justify-content:flex-start; outline:none; margin-bottom: var(--spacing-md); background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: var(--text-sm);">
                        <i class="ph ph-sign-out"></i> Logout
                    </button>

                    <a href="/front-end/${user.role.toLowerCase()}/profile.html" style="text-decoration: none; display: block;">
                    <div class="user-profile" style="display:flex; align-items:center; gap:var(--spacing-md); padding: 0 var(--spacing-lg);">
                        <div class="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary-light); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid var(--border-light);">
                            ${user.role === 'TEAMLEAD' ? 'RS' : user.role === 'HR' ? 'R' : user.role === 'COMPANY_ADMIN' ? 'K' : user.emp_name.charAt(0)}
                        </div>
                        <div class="user-info" style="display:flex; flex-direction:column;">
                            <span class="user-name" style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-main);">${user.role === 'TEAMLEAD' ? 'Rinku Singh' : user.role === 'HR' ? 'Roshan' : user.role === 'COMPANY_ADMIN' ? 'Kiran' : user.emp_name}</span>
                            <span class="user-role" style="font-size: var(--text-xs); color: var(--text-muted);">${user.role === 'HR' ? 'HR Manager' : user.role === 'COMPANY_ADMIN' ? 'Company Admin' : user.role === 'TEAMLEAD' ? 'Team Lead' : user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : user.role === 'SUPPORT_MEMBER' ? 'Support Member' : user.role === 'TECHNICAL_MEMBER' ? 'Technical Member' : 'Employee'}</span>
                        </div>
                    </div>
                    </a>
                </div>
            </aside>
        `;
    }

    if (headerContainer) {
        // Find page title encoded in a meta tag or just default. #page-title is either
        // a plain text node, or a title span plus a smaller muted subtitle span (the
        // subtitle repeats the portal name, e.g. "Technical Dashboard") - taking the
        // first span keeps the header to just the page title instead of running both together.
        let pageTitle = "Dashboard";
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            const titleSpan = titleEl.querySelector('span');
            pageTitle = titleSpan ? titleSpan.textContent : titleEl.textContent;
        }

        const rolePortal = user.role === 'EMPLOYEE' ? 'Employee Portal' : user.role === 'TEAMLEAD' ? 'Team Lead Portal' : user.role === 'COMPANY_ADMIN' ? 'Company Admin Portal' : user.role === 'SUPER_ADMIN' ? 'Super Admin Portal' : user.role === 'PLATFORM_ADMIN' ? 'Platform Admin Portal' : user.role === 'SUPPORT_MEMBER' ? 'Support Dashboard' : user.role === 'TECHNICAL_MEMBER' ? 'Technical Dashboard' : 'HR Portal';

        headerContainer.innerHTML = `
            <header class="top-header">
                <div class="header-left" style="display:flex; flex-direction:column; gap:0;">
                    <h2 class="header-title" id="injected-page-title" style="margin-bottom:0;">${pageTitle}</h2>
                    <span style="font-size:var(--text-xs); color:var(--text-muted); font-weight:var(--font-medium);">${rolePortal}</span>
                </div>
                <div class="header-right" style="display:flex; gap:16px; align-items:center;">
                    <button id="theme-toggle-btn" class="theme-toggle-btn" type="button" title="Toggle light/dark theme" aria-label="Toggle light/dark theme">
                        <i class="ph ph-moon"></i>
                    </button>
                    ${CALENDAR_ROLES.includes(user.role) ? `
                    <div style="position:relative;">
                        <button id="calendar-toggle-btn" class="theme-toggle-btn" type="button" title="Calendar" aria-label="Calendar" aria-haspopup="true" aria-expanded="false">
                            <i class="ph ph-calendar-blank"></i>
                        </button>
                        <div class="header-calendar-popover" id="calendar-popover" hidden></div>
                    </div>` : ''}
                    <a href="/front-end/${user.role.toLowerCase()}/notifications.html" style="text-decoration:none; color:inherit;">
                        <div class="notification-bell ${isActive('notifications') ? 'active-bell' : ''}" style="font-size: var(--text-xl); color: ${isActive('notifications') ? 'var(--primary-color)' : 'var(--text-muted)'}; cursor: pointer; transition: 0.2s; position:relative;">
                            <i class="ph ph-bell"></i>
                            <span id="notif-dot" style="display:none; position:absolute; top:-4px; right:-4px; background:var(--danger-color, #ef4444); width:8px; height:8px; border-radius:50%;"></span>
                        </div>
                    </a>
                    <a href="/front-end/${user.role.toLowerCase()}/profile.html" style="text-decoration: none;" title="My Profile">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary-gradient); color: var(--text-inverse); display:flex; align-items:center; justify-content:center; font-weight: bold; font-size: 14px; margin-left: var(--spacing-lg); box-shadow: 0 4px 10px var(--primary-light); transition: transform 0.2s ease; cursor: pointer;">
                            ${user.role === 'TEAMLEAD' ? 'RS' : user.role === 'HR' ? 'R' : user.role === 'COMPANY_ADMIN' ? 'K' : user.emp_name.charAt(0)}
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

    theme.bindToggleButton(document.getElementById('theme-toggle-btn'));

    // Notification dropdown removed in favor of direct page link

    // Real unread indicator - only lit up when the user actually has notifications
    // (see NotificationService.getNotificationsForUser), never a hardcoded dot.
    const notifDot = document.getElementById('notif-dot');
    if (notifDot) {
        db.getNotificationsForUser(user.emp_id)
            .then((list) => { if (list && list.length > 0) notifDot.style.display = 'block'; })
            .catch(() => {});
    }

    // Calendar popover - lazily mounts the shared calendar widget (see
    // components/calendar.js) on first open, then just refreshes it.
    const calToggleBtn = document.getElementById('calendar-toggle-btn');
    const calPopover = document.getElementById('calendar-popover');
    if (calToggleBtn && calPopover) {
        let calInstance = null;

        const openCal = () => {
            calPopover.hidden = false;
            calToggleBtn.setAttribute('aria-expanded', 'true');
            if (!calInstance) {
                calInstance = renderCalendar(calPopover, {
                    fetchEvents: fetchEventsFor(user),
                    onAddEvent: (dto) => db.createEvent(user.emp_id, dto)
                });
            } else {
                calInstance.refresh();
            }
        };
        const closeCal = () => {
            calPopover.hidden = true;
            calToggleBtn.setAttribute('aria-expanded', 'false');
        };

        calToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            calPopover.hidden ? openCal() : closeCal();
        });
        document.addEventListener('click', (e) => {
            if (!calPopover.hidden && !calPopover.contains(e.target)) closeCal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !calPopover.hidden) closeCal();
        });
    }
}

