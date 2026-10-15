import { useEffect, useState } from 'react';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import ProfileSection from '../../components/profile/ProfileSection';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { getAttendanceForUser } from '../../services/attendanceService';
import { getUserById, updateUserPassword } from '../../services/employeeService';
import { getTasksForUser } from '../../services/taskService';
import { getWorkLogsForUser } from '../../services/worklogService';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { changePasswordSchema } from '../../validation/formSchemas';
import { performanceFrom } from './employeeUtils';

// The original page showed a fixed address, job title, skills list and performance
// numbers that no endpoint provides. Those are gone; every value below comes from the
// employee record or is computed from the employee's own tasks/attendance/work logs.

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };
const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const invalidBorder = { borderColor: 'var(--danger-color)' };
const sectionTitle = { margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 };

function formatPhone(phone) {
  // No country code is stored, so none is shown.
  return phone ? `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}` : '--';
}

function ChangePasswordForm({ empId }) {
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const validation = useFormValidation(changePasswordSchema, values, {
    idPrefix: 'emp-pw',
    serverFieldMap: { currentPassword: 'current', newPassword: 'next', confirmPassword: 'confirm' },
  });

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    // The current password itself is verified by the backend.
    if (!validation.validateAll()) return;

    setSubmitting(true);
    try {
      await updateUserPassword(empId, values.current, values.next, values.confirm);
      setValues(EMPTY_PASSWORDS);
      validation.reset();
      setSuccess(true);
    } catch (err) {
      if (!validation.setServerErrors(err)) setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordInput = (name, id, placeholder, autoComplete) => (
    <>
      <input
        type="password"
        className="form-control"
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required="true"
        maxLength={64}
        style={{ ...fieldStyle, ...(validation.errors[name] ? invalidBorder : undefined) }}
        value={values[name]}
        onChange={update(name)}
        {...validation.input(name, id)}
      />
      <FieldError {...validation.errorProps(name)} />
    </>
  );

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={sectionTitle}>Change Password</h3>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}>
          <label className="form-label" htmlFor="current_pw">Current Password<RequiredMark /></label>
          {passwordInput('current', 'current_pw', 'Enter current password', 'current-password')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="new_pw">New Password<RequiredMark /></label>
            {passwordInput('next', 'new_pw', 'Enter new password', 'new-password')}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Password must contain: • Minimum 8 characters<br />• Uppercase letter<br />• Lowercase letter<br />• Number
              <br />• Special character (@$!%*?&amp;)
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="confirm_pw">Confirm New Password<RequiredMark /></label>
            {passwordInput('confirm', 'confirm_pw', 'Confirm new password', 'new-password')}
          </div>
        </div>

        {error && <div className="form-error field-error" role="alert" style={{ marginBottom: 12 }}><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{error}</span></div>}
        <button
          type="submit"
          className="btn btn-purple"
          disabled={submitting}
          style={{ padding: '14px 32px', fontSize: 'var(--text-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 50 }}
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
        {success && (
          <div role="status" style={{ color: '#10B981', fontWeight: 'var(--font-medium)', fontSize: 13, marginTop: 16 }}>
            <i className="ph-fill ph-check-circle"></i> Password updated successfully!
          </div>
        )}
      </form>
    </div>
  );
}

export default function EmployeeProfile() {
  usePageTitle('My Profile');
  const { user: session } = useAuth();

  const { data, error } = useFetch(async () => {
    const user = await getUserById(session.emp_id);
    const manager = user.manager_id ? await getUserById(user.manager_id).catch(() => null) : null;
    return { user, manager };
  }, [session.emp_id]);
  const { data: records } = useFetch(async () => {
    const [tasks, attendance, worklogs] = await Promise.all([
      getTasksForUser(session.emp_id),
      getAttendanceForUser(session.emp_id),
      getWorkLogsForUser(session.emp_id),
    ]);
    return { tasks, attendance, worklogs };
  }, [session.emp_id]);

  const user = data?.user;
  const joined = user ? formatDate(user.date_of_joining, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const roleLabel = user ? ROLE_LABELS[user.role] || user.role : undefined;
  // Until the records load (or if they fail) show '-' rather than zeros that look real.
  const performance = records ? performanceFrom(records) : performanceFrom().map((p) => ({ ...p, value: '-' }));

  const personalFields = [
    { icon: 'ph-identification-badge', label: 'Employee ID', value: user?.emp_id },
    { icon: 'ph-envelope-simple', label: 'Email Address', value: user?.email },
    { icon: 'ph-phone', label: 'Phone Number', value: user ? formatPhone(user.phone) : undefined },
    { icon: 'ph-calendar-blank', label: 'Joining Date', value: joined || undefined },
  ];

  const workFields = [
    { label: 'Department', value: user?.department_id },
    { label: 'Role', value: roleLabel },
    { label: 'Direct Manager', value: data ? data.manager?.emp_name || 'N/A' : undefined },
    { label: 'Team', value: user?.team_id },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      {/* SECTION 1: PROFILE HEADER CARD */}
      <div className="profile-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div className="profile-avatar-ph">
            <i className="ph-fill ph-user"></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 'var(--font-bold)' }}>{user?.emp_name ?? 'Name'}</h2>
            <div style={{ fontSize: 18, opacity: 0.9 }}>{roleLabel ?? ''}</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 14, opacity: 0.8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ph ph-briefcase"></i> Department {user?.department_id ?? '--'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ph ph-calendar-blank"></i> Joined {joined || '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="form-error field-error" role="alert">
          <i className="ph ph-warning-circle" aria-hidden="true"></i>
          <span>Failed to load your profile: {error.message}</span>
        </div>
      )}

      {/* SECTION 2: PERSONAL & WORK INFORMATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        <ProfileSection title="Personal Information" fields={personalFields} />
        <ProfileSection title="Work Information" fields={workFields} />
      </div>

      {/* SECTION 3: PERFORMANCE OVERVIEW (from tasks, attendance and work logs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {performance.map((p) => (
          <div key={p.label} className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 'var(--font-medium)', marginBottom: 8 }}>{p.label}</div>
            <div style={{ fontSize: 36, fontWeight: 'var(--font-bold)', color: 'var(--text-main)', marginBottom: 4 }}>{p.value}</div>
          </div>
        ))}
      </div>

      {/* SECTION 5: CHANGE PASSWORD */}
      <ChangePasswordForm empId={session.emp_id} />
    </div>
  );
}
