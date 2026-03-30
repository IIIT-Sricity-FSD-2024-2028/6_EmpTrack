// /js/components/layout.js
import { auth } from '../auth.js';

export function renderLayout(container) {
    const user = auth.getCurrentUser();

    // Sidebar Links based on role
    let navItems = '';
    if (user.role === 'EMPLOYEE') {
        navItems = `
            <a href="#dashboard" class="nav-item active"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="#tasks" class="nav-item"><i class="ph ph-briefcase"></i> Assigned Tasks</a>
            <a href="#issues" class="nav-item"><i class="ph ph-warning-circle"></i> View Issue Status</a>
            <a href="#work-logs" class="nav-item"><i class="ph ph-clock"></i> Work Logs</a>
            <a href="#attendance" class="nav-item"><i class="ph ph-calendar-check"></i> Attendance</a>
            <a href="#leave-request" class="nav-item"><i class="ph ph-calendar-x"></i> Leave Request</a>`;
    } else if (user.role === 'TEAMLEAD') {
        navItems = `
            <a href="#dashboard" class="nav-item active"><i class="ph ph-squares-four"></i> Team Dashboard</a>
            <a href="#team-attendance" class="nav-item"><i class="ph ph-users"></i> Team Attendance</a>
            <a href="#assign-tasks" class="nav-item"><i class="ph ph-briefcase"></i> Work Allocation</a>
            <a href="#leave-approvals" class="nav-item"><i class="ph ph-check-square"></i> Leave Approvals</a>
            <a href="#reports" class="nav-item"><i class="ph ph-chart-bar"></i> Performance Reports</a>
        `;
    } else if (user.role === 'HR') {
        navItems = `
            <a href="#dashboard" class="nav-item active"><i class="ph ph-squares-four"></i> Setup Dashboard</a>
            <a href="#org-reports" class="nav-item"><i class="ph ph-buildings"></i> Org Analytics</a>
            <a href="#escalations" class="nav-item"><i class="ph ph-siren"></i> Escalations</a>
            <a href="#policy-settings" class="nav-item"><i class="ph ph-gear"></i> System Settings</a>
        `;
    }

    container.innerHTML = `
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
                <button id="logout-btn" class="nav-item" style="width: 100%; justify-content:flex-start; outline:none; margin-bottom: var(--spacing-md);">
                    <i class="ph ph-sign-out"></i> Logout
                </button>
                
                <a href="#profile" style="text-decoration: none; display: block;">
                <div class="user-profile" style="display:flex; align-items:center; gap:var(--spacing-md); padding: 0 var(--spacing-lg);">
                    <div class="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary-light); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${user.emp_name.charAt(0)}
                    </div>
                    <div class="user-info" style="display:flex; flex-direction:column;">
                        <span class="user-name" style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-main);">${user.emp_name}</span>
                        <span class="user-role" style="font-size: var(--text-xs); color: var(--text-muted);">${user.role === 'HR' ? 'Super User' : user.role === 'TEAMLEAD' ? 'Admin' : 'Employee'}</span>
                    </div>
                </div>
                </a>
            </div>
        </aside>
        
        <main class="main-wrapper">
            <header class="top-header">
                <div class="header-left">
                    <h2 class="header-title" id="page-title">Overview</h2>
                </div>
                <div class="header-right">
                    <div class="notification-bell" style="font-size: var(--text-xl); color: var(--text-muted); cursor: pointer;">
                        <i class="ph ph-bell"></i>
                    </div>
                </div>
            </header>
            
            <div class="content-area" id="main-content">
                <!-- Inner Page Content will be injected here -->
            </div>
        </main>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.logout();
    });
}
