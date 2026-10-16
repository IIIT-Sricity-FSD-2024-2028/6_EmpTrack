import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import { PATHS } from '../../utils/constants';
import { getHomePath, isValidRole } from '../../utils/permissions';

/**
 * Shown to a logged-in user whose role has no portal (missing, misspelled, or not
 * yet supported by the frontend). Offers a way out instead of a blank page.
 */
export default function UnsupportedRole() {
  const { user, role, isAuthenticated, isVerifying, logout } = useAuth();
  const navigate = useNavigate();

  if (isVerifying) return null;
  if (!isAuthenticated) return <Navigate to={PATHS.LOGIN} replace />;
  if (isValidRole(role)) return <Navigate to={getHomePath(role)} replace />;

  async function handleLogout() {
    await logout();
    navigate(PATHS.LOGIN, { replace: true });
  }

  return (
    <main className="auth-wrapper">
      <section className="auth-container">
        <EmptyState
          icon="ph-user-circle-minus"
          title="No dashboard for this account"
          description={
            <p className="text-muted">
              {user?.emp_name || 'This account'} is signed in, but its role
              {role ? <> (<code>{role}</code>)</> : ' (none assigned)'} does not have access to any portal.
              Contact your administrator to have a valid role assigned.
            </p>
          }
          action={<Button icon="ph-sign-out" onClick={handleLogout}>Log out</Button>}
        />
      </section>
    </main>
  );
}
