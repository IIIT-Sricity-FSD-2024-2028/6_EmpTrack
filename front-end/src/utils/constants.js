// Application-wide constants.

// Role values exactly as the backend returns them (user.role) and expects
// in the `Role` request header.
export const ROLES = Object.freeze({
  EMPLOYEE: 'EMPLOYEE',
  HR: 'HR',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  TEAM_LEAD: 'TEAMLEAD',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  SUPPORT_MEMBER: 'SUPPORT_MEMBER',
  TECHNICAL_MEMBER: 'TECHNICAL_MEMBER',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

// Shown under the user's name in the sidebar.
export const ROLE_LABELS = Object.freeze({
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.HR]: 'HR Manager',
  [ROLES.COMPANY_ADMIN]: 'Company Admin',
  [ROLES.TEAM_LEAD]: 'Team Lead',
  [ROLES.PLATFORM_ADMIN]: 'Platform Admin',
  [ROLES.SUPPORT_MEMBER]: 'Support Member',
  [ROLES.TECHNICAL_MEMBER]: 'Technical Member',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
});

// Shown under the page title in the header.
export const ROLE_PORTAL_LABELS = Object.freeze({
  [ROLES.EMPLOYEE]: 'Employee Portal',
  [ROLES.HR]: 'HR Portal',
  [ROLES.COMPANY_ADMIN]: 'Company Admin Portal',
  [ROLES.TEAM_LEAD]: 'Team Lead Portal',
  [ROLES.PLATFORM_ADMIN]: 'Platform Admin Portal',
  [ROLES.SUPPORT_MEMBER]: 'Support Dashboard',
  [ROLES.TECHNICAL_MEMBER]: 'Technical Dashboard',
  [ROLES.SUPER_ADMIN]: 'Super Admin Portal',
});

// URL segment for each role portal, e.g. /employee/dashboard.
// Matches the folder names under src/pages/.
export const ROLE_BASE_PATHS = Object.freeze({
  [ROLES.EMPLOYEE]: 'employee',
  [ROLES.HR]: 'hr',
  [ROLES.COMPANY_ADMIN]: 'company-admin',
  [ROLES.TEAM_LEAD]: 'teamlead',
  [ROLES.PLATFORM_ADMIN]: 'platform-admin',
  [ROLES.SUPPORT_MEMBER]: 'support-member',
  [ROLES.TECHNICAL_MEMBER]: 'technical-member',
  [ROLES.SUPER_ADMIN]: 'super-admin',
});

// Roles the backend calendar endpoints allow (header calendar popover).
export const CALENDAR_ROLES = Object.freeze([
  ROLES.EMPLOYEE,
  ROLES.TEAM_LEAD,
  ROLES.HR,
  ROLES.COMPANY_ADMIN,
]);

// Shared public paths.
export const PATHS = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  ACCEPT_INVITATION: '/accept-invitation',
});

// Same keys as the original front-end.
export const STORAGE_KEYS = Object.freeze({
  AUTH: 'empTrackSessionV2',
  THEME: 'empTrackThemeV1',
});

export const THEMES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});
