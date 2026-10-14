import { useEffect, useState } from 'react';
import ProfileSection from '../../components/profile/ProfileSection';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getUserById, updateUserPassword } from '../../services/employeeService';
import { formatDate } from '../../utils/helpers';

// Skills and performance figures are fixed in the original page (no endpoint yet).
const SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'GraphQL'];
const PERFORMANCE = [
  { label: 'Tasks Completed', value: '142', trend: '+12%' },
  { label: 'Avg. Task Rating', value: '4.8/5', trend: '+0.3' },
  { label: 'On-Time Delivery', value: '94%', trend: '+5%' },
  { label: 'Attendance Rate', value: '96%', trend: '+2%' },
];

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };
const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const invalidBorder = { borderColor: 'var(--danger-color)' };
const sectionTitle = { margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 };

function formatPhone(phone) {
  return phone ? `+1 (${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}` : '--';
}

function ChangePasswordForm({ empId }) {
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [error, setError] = useState(null); // { field, message }
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const update = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // The current password is verified by the backend.
    if (!STRONG_PASSWORD.test(values.next)) {
      setError({ field: 'next', message: 'Weak password! Use 8+ chars, uppercase, lowercase, number & special character.' });
      return;
    }
    if (values.next !== values.confirm) {
      setError({ field: 'confirm', message: 'Passwords do not match!' });
      return;
    }
    if (values.next === values.current) {
      setError({ field: null, message: 'New password cannot be same as current password!' });
      return;
    }

    setSubmitting(true);
    try {
      await updateUserPassword(empId, values.current, values.next, values.confirm);
      setValues(EMPTY_PASSWORDS);
      setSuccess(true);
    } catch (err) {
      const message = err.message || 'Failed to update password. Please try again.';
      setError({ field: /current/i.test(message) ? 'current' : null, message });
    } finally {
      setSubmitting(false);
    }
  };

  const borderFor = (field) => (error?.field === field ? invalidBorder : undefined);

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={sectionTitle}>Change Password</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}>
          <label className="form-label" htmlFor="current_pw">Current Password</label>
          <input
            type="password"
            id="current_pw"
            className="form-control"
            placeholder="Enter current password"
            required
            style={{ ...fieldStyle, ...borderFor('current') }}
            value={values.current}
            onChange={update('current')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="new_pw">New Password</label>
            <input
              type="password"
              id="new_pw"
              className="form-control"
              placeholder="Enter new password"
              required
              minLength={6}
              style={{ ...fieldStyle, ...borderFor('next') }}
              value={values.next}
              onChange={update('next')}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Password must contain: • Minimum 8 characters<br />• Uppercase letter<br />• Lowercase letter<br />• Number
              <br />• Special character (@$!%*?&amp;)
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="confirm_pw">Confirm New Password</label>
            <input
              type="password"
              id="confirm_pw"
              className="form-control"
              placeholder="Confirm new password"
              required
              minLength={6}
              style={{ ...fieldStyle, ...borderFor('confirm') }}
              value={values.confirm}
              onChange={update('confirm')}
            />
            {error && <div style={{ color: 'var(--danger-color)', fontSize: 12, marginTop: 6 }}>{error.message}</div>}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-purple"
          disabled={submitting}
          style={{ padding: '14px 32px', fontSize: 'var(--text-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderRadius: 50 }}
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
        {success && (
          <div style={{ color: '#10B981', fontWeight: 'var(--font-medium)', fontSize: 13, marginTop: 16 }}>
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

  const { data } = useFetch(async () => {
    const user = await getUserById(session.emp_id);
    const manager = user.manager_id ? await getUserById(user.manager_id).catch(() => null) : null;
    return { user, manager };
  }, [session.emp_id]);

  const user = data?.user;
  const joined = user ? formatDate(user.date_of_joining, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const personalFields = [
    { icon: 'ph-identification-badge', label: 'Employee ID', value: user?.emp_id },
    { icon: 'ph-envelope-simple', label: 'Email Address', value: user?.email },
    { icon: 'ph-phone', label: 'Phone Number', value: user ? formatPhone(user.phone) : undefined },
    { icon: 'ph-map-pin', label: 'Address', value: '123 Innovation Drive, Tech Park Zone, CA 94016' },
  ];

  const workFields = [
    { label: 'Department', value: 'Engineering' },
    { label: 'Role', value: 'Software Engineer' },
    { label: 'Direct Manager', value: data ? data.manager?.emp_name || 'N/A' : undefined },
    { label: 'Reporting To', value: user ? `Team Lead - Engineering (${user.team_id})` : 'Team Lead - Engineering' },
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
            <div style={{ fontSize: 18, opacity: 0.9 }}>Software Engineer</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 14, opacity: 0.8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ph ph-briefcase"></i> Engineering Dept ({user?.department_id})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ph ph-calendar-blank"></i> Joined {joined}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PERSONAL & WORK INFORMATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        <ProfileSection title="Personal Information" fields={personalFields} />
        <ProfileSection title="Work Information" fields={workFields} />
      </div>

      {/* SECTION 3: SKILLS & EXPERTISE */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 'var(--text-lg)' }}>Skills &amp; Expertise</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {SKILLS.map((skill) => <span key={skill} className="skill-tag">{skill}</span>)}
        </div>
      </div>

      {/* SECTION 4: PERFORMANCE OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {PERFORMANCE.map((p) => (
          <div key={p.label} className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 'var(--font-medium)', marginBottom: 8 }}>{p.label}</div>
            <div style={{ fontSize: 36, fontWeight: 'var(--font-bold)', color: 'var(--text-main)', marginBottom: 4 }}>{p.value}</div>
            <div className="text-success" style={{ fontSize: 13, fontWeight: 'var(--font-bold)' }}>
              <i className="ph-bold ph-trend-up"></i> {p.trend}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 5: CHANGE PASSWORD */}
      <ChangePasswordForm empId={session.emp_id} />
    </div>
  );
}
