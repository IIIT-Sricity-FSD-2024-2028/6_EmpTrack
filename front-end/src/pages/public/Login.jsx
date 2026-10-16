import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import useFormValidation from '../../hooks/useFormValidation';
import { loginSchema } from '../../validation/formSchemas';
import { getHomePath, getRoleBasePath } from '../../utils/permissions';

// Where to go after login: the protected page that redirected here (if it is in
// this user's own portal - it may be left over from a previous user), else home.
function destinationFor(user, from) {
  const path = from?.pathname;
  return path && path.startsWith(`${getRoleBasePath(user.role)}/`) ? `${path}${from.search || ''}` : getHomePath(user.role);
}

export default function Login() {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validation = useFormValidation(loginSchema, { email, password }, { idPrefix: 'login' });

  if (isAuthenticated) {
    return <Navigate to={destinationFor(user, location.state?.from)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validation.validateAll()) return;
    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      navigate(destinationFor(user, location.state?.from), { replace: true });
    } catch (submitError) {
      if (!validation.setServerErrors(submitError)) setError(submitError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-wrapper">
      <section className="auth-container" aria-labelledby="login-title">
        <div className="auth-logo">
          <i className="ph ph-users-three" aria-hidden="true"></i>
          EmpTrack
        </div>
        <h1 id="login-title" className="auth-title">Sign in to your account</h1>
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={254}
            required
            {...validation.field('email')}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={128}
            required
            {...validation.field('password')}
          />
          {error && <div className="form-error field-error" role="alert"><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{error}</span></div>}
          <Button type="submit" className="w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-muted text-center mt-md mb-0">
          Demo accounts (password Password@123): emp@emptrack.com, tl@emptrack.com, hr@emptrack.com,
          {' '}cmpadmin@emptrack.com, superadmin@emptrack.com, wanda.tech@emptrack.com, sam.support@emptrack.com
        </p>
      </section>
    </main>
  );
}
