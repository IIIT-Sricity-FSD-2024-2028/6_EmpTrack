// Sidebar navigation per role (from the original js/components/layout.js).
// Each member fills in their own role's list as pages are added.
//
//   label: link text
//   path:  relative to the role's base path ('dashboard' -> /employee/dashboard)
//   icon:  Phosphor icon class, e.g. 'ph-squares-four'
//   match: optional URL fragments that also mark the item active
//          (e.g. 'Assigned Tasks' stays active on update-task)
import { ROLES } from '../utils/constants';

const navigation = {
  [ROLES.EMPLOYEE]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'Assigned Tasks', path: 'tasks', icon: 'ph-briefcase', match: ['task'] },
    { label: 'View Issue Status', path: 'issues-list', icon: 'ph-warning-circle', match: ['issue'] },
    { label: 'Work Logs', path: 'work-logs', icon: 'ph-clock' },
    { label: 'Attendance', path: 'attendance', icon: 'ph-calendar-check' },
    { label: 'Leave Request', path: 'leave-request', icon: 'ph-calendar-x' },
  ],
  [ROLES.HR]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'Employee Management', path: 'employee-management', icon: 'ph-users' },
    { label: 'Attendance', path: 'attendance', icon: 'ph-calendar-check' },
    { label: 'Escalations', path: 'escalations', icon: 'ph-warning-circle' },
    { label: 'Reports', path: 'reports', icon: 'ph-file-text' },
    { label: 'Settings', path: 'settings', icon: 'ph-gear' },
  ],
  [ROLES.COMPANY_ADMIN]: [
    { label: 'Admin Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'All Employees', path: 'employee-management', icon: 'ph-users' },
    { label: 'Raise Issue', path: 'raise-issue', icon: 'ph-flag' },
    { label: 'Subscription & Billing', path: 'billing', icon: 'ph-credit-card' },
  ],
  [ROLES.TEAM_LEAD]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'Work Monitoring', path: 'work-monitoring', icon: 'ph-monitor' },
    { label: 'Assign Tasks', path: 'tasks', icon: 'ph-clipboard-text' },
    { label: 'Issue Management', path: 'issue-management', icon: 'ph-warning-circle', match: ['assign-issue', 'resolve-issue'] },
    { label: 'Escalations', path: 'escalations', icon: 'ph-warning', match: ['escalate-to-hr', 'employee-raised-issues'] },
    { label: 'Attendance', path: 'attendance', icon: 'ph-calendar-check' },
    { label: 'Leave Management', path: 'leave', icon: 'ph-calendar-x' },
    { label: 'Team Performance', path: 'team-performance', icon: 'ph-users-three' },
    { label: 'Reports', path: 'reports', icon: 'ph-chart-bar' },
  ],
  // Notifications and Profile are reached from the header bell / avatar, as in the original.
  [ROLES.PLATFORM_ADMIN]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'My Companies', path: 'my-companies', icon: 'ph-buildings' },
    { label: 'Company Payments', path: 'payments', icon: 'ph-credit-card' },
    { label: 'Technical Team', path: 'technical-team', icon: 'ph-hard-drives' },
    { label: 'Support Team', path: 'support-team', icon: 'ph-headset' },
    { label: 'Technical Issues', path: 'technical-issues', icon: 'ph-bug' },
    { label: 'Support Tickets', path: 'support-tickets', icon: 'ph-ticket' },
    { label: 'Workload', path: 'workload', icon: 'ph-gauge' },
  ],
  [ROLES.SUPPORT_MEMBER]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'My Tickets', path: 'my-tickets', icon: 'ph-user-focus' },
    { label: 'Escalated', path: 'escalated', icon: 'ph-arrow-up-right' },
  ],
  [ROLES.TECHNICAL_MEMBER]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'Assigned Issues', path: 'assigned-issues', icon: 'ph-bug' },
    { label: 'Issue History', path: 'issue-history', icon: 'ph-clock-counter-clockwise' },
  ],
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', path: 'dashboard', icon: 'ph-squares-four' },
    { label: 'Companies', path: 'companies', icon: 'ph-buildings' },
    { label: 'Registrations', path: 'registrations', icon: 'ph-seal-check' },
    { label: 'Platform Admins', path: 'platform-admins', icon: 'ph-shield-star' },
    { label: 'Subscriptions', path: 'subscriptions', icon: 'ph-credit-card' },
    { label: 'Revenue', path: 'revenue', icon: 'ph-currency-circle-dollar' },
    { label: 'Analytics', path: 'analytics', icon: 'ph-chart-line-up' },
    { label: 'Activity', path: 'activity', icon: 'ph-list-magnifying-glass' },
    { label: 'Escalations', path: 'escalations', icon: 'ph-siren' },
    { label: 'Settings', path: 'settings', icon: 'ph-gear' },
  ],
};

export function getNavItems(role) {
  return navigation[role] || [];
}
