import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { PATHS } from '../utils/constants';

/**
 * Renders its children (or nested routes) only for logged-in users.
 * Others are sent to /login, remembering where they were headed
 * (available as location.state.from on the login page).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}
