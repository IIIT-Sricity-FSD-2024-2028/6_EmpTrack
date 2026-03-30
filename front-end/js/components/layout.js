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
            <a href="#dashboard" class="nav-item active"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="#work-monitoring" class="nav-item"><i class="ph ph-users"></i> Work Monitoring</a>
            <a href="#assign-tasks" class="nav-item"><i class="ph ph-briefcase"></i> Assign Tasks</a>
            <a href="#issue-management" class="nav-item"><i class="ph ph-warning-circle"></i> Issue Management</a>
            <a href="#escalations" class="nav-item"><i class="ph ph-siren"></i> Escalations</a>
            <a href="#leave-management" class="nav-item"><i class="ph ph-check-square"></i> Leave Management</a>
            <a href="#team-performance" class="nav-item"><i class="ph ph-chart-bar"></i> Team Performance</a>
            <a href="#reports" class="nav-item"><i class="ph ph-file-text"></i> Reports</a>
        `;
    } else if (user.role === 'HR') {
        navItems = `
            <a href="#dashboard" class="nav-item active"><i class="ph ph-squares-four"></i> Dashboard</a>
            <a href="#employee-management" class="nav-item"><i class="ph ph-user-gear"></i> Employee Management</a>
            <a href="#org-reports" class="nav-item"><i class="ph ph-buildings"></i> Reports & Analytics</a>
            <a href="#escalations" class="nav-item"><i class="ph ph-siren"></i> Escalations</a>
            <a href="#hr-attendance" class="nav-item"><i class="ph ph-calendar-check"></i> Attendance Management</a>
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
        
        <main class="main-wrapper">
            <header class="top-header">
                <div class="header-left" style="display:flex; flex-direction:column; gap:0;">
                    <h2 class="header-title" id="page-title" style="margin-bottom:0;">Dashboard</h2>
                    ${user.role === 'TEAMLEAD' ? '<span style="font-size:var(--text-xs); color:var(--text-muted); font-weight:var(--font-medium);">Team Lead Portal</span>' : ''}
                </div>
                <div class="header-right" style="display:flex; gap:16px; align-items:center;">
                    <div class="theme-toggle" id="themeToggleBtn" style="font-size: var(--text-xl); color: var(--text-muted); cursor: pointer; transition: 0.2s;">
                        <i class="ph ph-moon"></i>
                    </div>
                    <div class="notification-wrapper" style="position:relative;">
                        <div class="notification-bell" id="notifBellBtn" style="font-size: var(--text-xl); color: var(--text-muted); cursor: pointer; transition: 0.2s;">
                            <i class="ph ph-bell"></i>
                            <span style="position:absolute; top:-4px; right:-4px; background:var(--danger-color, #ef4444); width:8px; height:8px; border-radius:50%;"></span>
                        </div>
                        <div id="notifDropdown" style="display:none; position:absolute; top:120%; right:0; width:280px; background:var(--bg-surface, #fff); border:1px solid var(--border-color); border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); z-index:100; padding:12px; font-size:13px; color:var(--text-main);">
                            <div style="font-weight:600; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border-color);">Notifications</div>
                            <div style="padding:8px 0; border-bottom:1px solid var(--border-light);">Alice requested sick leave.</div>
                            <div style="padding:8px 0; border-bottom:1px solid var(--border-light);">Bob marked as late.</div>
                            <div style="padding:8px 0; text-align:center;"><a href="#notifications" style="color:var(--primary-color); text-decoration:none; font-weight:600;">View All Notifications</a></div>
                        </div>
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

    const body = document.body;
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // Simple theme toggle
    themeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeIcon.className = 'ph ph-sun';
            // Inject dark mode variables if they don't exist
            if(!document.getElementById('dark-theme-style')) {
                const style = document.createElement('style');
                style.id = 'dark-theme-style';
                style.innerHTML = "body.dark-mode { --bg-main: #0F172A; --bg-surface: #1E293B; --text-main: #F8FAFC; --text-muted: #94A3B8; --border-color: #334155; --border-light: #1E293B; background: var(--bg-main); color: var(--text-main); }";
                document.head.appendChild(style);
            }
        } else {
            themeIcon.className = 'ph ph-moon';
        }
    });

    const notifBtn = document.getElementById('notifBellBtn');
    const notifDrop = document.getElementById('notifDropdown');
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDrop.style.display = notifDrop.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
        notifDrop.style.display = 'none';
    });
    notifDrop.addEventListener('click', e => e.stopPropagation());
}
