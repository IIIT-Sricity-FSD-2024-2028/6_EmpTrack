import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import { getHomePath } from '../../utils/permissions';

export default function Login() {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('emp@emp.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      const destination = location.state?.from?.pathname || getHomePath(user.role);
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in.');
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
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            error={error}
            required
          />
          <Button type="submit" className="w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-muted text-center mt-md mb-0">
          Demo employee: emp@emp.com / Password@123
        </p>
      </section>
    </main>
  );
}
