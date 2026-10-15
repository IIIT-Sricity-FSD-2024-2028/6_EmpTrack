// Central route configuration.
//
// To add a role's pages:
//   1. Create them in src/pages/<role>/, e.g. src/pages/hr/HrDashboard.jsx
//   2. Export their routes from src/pages/<role>/<role>Routes.jsx (paths are
//      relative to the role's base path) — see pages/employee/employeeRoutes.jsx
//   3. Plug that array into `roleRoutes` below
//   4. Add sidebar entries in src/config/navigation.js
//
// Public pages (landing, login, accept-invitation) go in `publicRoutes`
// with absolute paths from PATHS in utils/constants.js.
import { useRoutes } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import Layout from '../components/layout/Layout';
import companyAdminRoutes from '../pages/company-admin/companyAdminRoutes';
import employeeRoutes from '../pages/employee/employeeRoutes';
import hrRoutes from '../pages/hr/hrRoutes';
import Landing from '../pages/public/Landing';
import Login from '../pages/public/Login';
import platformAdminRoutes from '../pages/platform-admin/platformAdminRoutes';
import superAdminRoutes from '../pages/super-admin/superAdminRoutes';
import supportMemberRoutes from '../pages/support-member/supportMemberRoutes';
import teamLeadRoutes from '../pages/teamlead/teamLeadRoutes';
import technicalMemberRoutes from '../pages/technical-member/technicalMemberRoutes';
import { PATHS, ROLES } from '../utils/constants';
import { getRoleBasePath } from '../utils/permissions';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// ---- Public (no login required) ----
const publicRoutes = [
  { path: PATHS.HOME, element: <Landing /> },
  { path: PATHS.LOGIN, element: <Login /> },
];

// ---- Role portals (login + matching role required, rendered inside Layout) ----
const roleRoutes = {
  [ROLES.EMPLOYEE]: employeeRoutes,
  [ROLES.HR]: hrRoutes,
  [ROLES.COMPANY_ADMIN]: companyAdminRoutes,
  [ROLES.TEAM_LEAD]: teamLeadRoutes,
  [ROLES.PLATFORM_ADMIN]: platformAdminRoutes,
  [ROLES.SUPPORT_MEMBER]: supportMemberRoutes,
  [ROLES.TECHNICAL_MEMBER]: technicalMemberRoutes,
  [ROLES.SUPER_ADMIN]: superAdminRoutes,
};

const portalRoutes = Object.entries(roleRoutes)
  .filter(([, children]) => children.length > 0)
  .map(([role, children]) => ({
    path: getRoleBasePath(role),
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={[role]}>
          <Layout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children,
  }));

const fallbackRoute = {
  path: '*',
  element: (
    <EmptyState
      icon="ph-magnifying-glass"
      title="Page not found"
      description="The page you are looking for does not exist."
    />
  ),
};

const routes = [...publicRoutes, ...portalRoutes, fallbackRoute];

export default function AppRoutes() {
  return useRoutes(routes);
}
