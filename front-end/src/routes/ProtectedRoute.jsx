import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { PATHS } from '../utils/constants';

/**
 * Renders its children (or nested routes) only for logged-in users.
 * Others are sent to /login, remembering where they were headed
 * (available as location.state.from on the login page).
 * Runs on every render, so Back/Forward, refresh and typed URLs are all
 * re-checked; the backend independently rejects requests without a valid token.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isVerifying, reauthenticationRequired } = useAuth();
  const location = useLocation();

  // Don't show protected content until a restored session is confirmed by the
  // backend (see AuthContext); this only happens once, on page load.
  if (isVerifying) return null;

  if (!isAuthenticated || reauthenticationRequired) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}
