import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getHomePath, hasRole } from '../utils/permissions';

/**
 * Renders its children (or nested routes) only if the user's role is in
 * `allowedRoles`. Users with another role are sent to their own dashboard.
 * Use inside <ProtectedRoute> so unauthenticated users go to /login first.
 */
export default function RoleRoute({ allowedRoles, children }) {
  const { role } = useAuth();

  if (!hasRole(role, allowedRoles)) {
    return <Navigate to={getHomePath(role)} replace />;
  }
  return children ?? <Outlet />;
}
