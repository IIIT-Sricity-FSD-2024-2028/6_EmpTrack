// Converted from front-end/hr/profile.html + js/views/hr/profile.js.
// The original filled in a hard-coded demo person ("Roshan", fixed stats and skills);
// this shows the signed-in user's account and live company figures. The Company
// Admin profile is the same page without the stats row (company_admin/profile.html).
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { PASSWORD_HINT } from '../../utils/validation';
import { changePasswordSchema } from '../../validation/formSchemas';
import { employeesEntity, escalationsEntity, leavesEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { shortDate } from './hrUtils';
import './styles/profile.css';

const EMPTY = { current: '', next: '', confirm: '' };

function PasswordInput({ id, value, onChange, placeholder, toggleable, inputProps }) {
  const [visible, setVisible] = useState(false);
  const toggle = () => setVisible((v) => !v);
  return (
    <div className="input-wrap">
      <input type={visible ? 'text' : 'password'} aria-required="true" maxLength={64} placeholder={placeholder} value={value} onChange={onChange} autoComplete={id === 'currentPwd' ? 'current-password' : 'new-password'} {...inputProps} />
      {toggleable && (
        <i
          className={`ph ${visible ? 'ph-eye-slash' : 'ph-eye'} eye-icon`}
          role="button"
          tabIndex={0}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={toggle}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
        ></i>
      )}
    </div>
  );
}

export default function HrProfile({ title = 'My Profile', roleLabel = 'HR Manager', showStats = true }) {
  usePageTitle(title);
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();
  const dispatch = useDispatch();
  const [pwd, setPwd] = useState(EMPTY);
  const [error, setError] = useState('');
  const saving = useSelector((s) => s.employees.mutations.updatePassword?.status === 'loading');

  // HR stats row, derived from the shared slices. Not requested at all without the row
  // (Company Admin profile): GET /escalations is HR-only. Any failure shows no stats, as before.
  const skip = { skip: !showStats };
  const employees = useEntityQuery(employeesEntity, 'fetchAll', undefined, skip).data;
  const escalations = useEntityQuery(escalationsEntity, 'fetchAll', undefined, skip).data;
  const leaves = useEntityQuery(leavesEntity, 'fetchAll', undefined, skip).data;
  const stats = showStats && employees && escalations && leaves ? {
    openCases: escalations.filter((e) => e.status === 'OPEN').length,
    teamLeads: employees.filter((e) => e.role === 'TEAMLEAD').length,
    employees: employees.filter((e) => e.role === 'EMPLOYEE').length,
    pendingLeaves: leaves.filter((l) => l.status === 'PENDING').length,
  } : null;

  const set = (key) => (e) => setPwd((p) => ({ ...p, [key]: e.target.value }));
  const validation = useFormValidation(changePasswordSchema, pwd, {
    idPrefix: 'hr-pwd',
    serverFieldMap: { currentPassword: 'current', newPassword: 'next', confirmPassword: 'confirm' },
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validation.validateAll()) return;
    try {
      await dispatch(employeesEntity.thunks.updatePassword({
        empId: user.emp_id, currentPassword: pwd.current, newPassword: pwd.next, confirmPassword: pwd.confirm,
      })).unwrap();
      setPwd(EMPTY);
      validation.reset();
      showToast('Password updated successfully!');
    } catch (err) {
      if (!validation.setServerErrors(err)) setError(err.message || 'Failed to update password.');
    }
  };

  const stat = (icon, style, value, label) => (
    <div className="card stat-card">
      <div className="stat-icon" style={style}><i className={`ph-fill ${icon}`}></i></div>
      <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats ? value : '-'}</div><div style={{ fontSize: 13, color: 'var(--prof-muted)', fontWeight: 500 }}>{label}</div></div>
    </div>
  );

  return (
    <div className="hr-prof-root">
      <div className="card profile-banner">
        <div className="avatar-large" id="avatar-circle"><span id="avatar-initials">{user.emp_name.charAt(0).toUpperCase()}</span></div>
        <div className="banner-info">
          <h2 className="banner-name" id="profile-name" style={{ color: '#ffffff' }}>{user.emp_name}</h2>
          <div className="banner-role" id="profile-role">{roleLabel}{user.company_name ? ` - ${user.company_name}` : ''}</div>
          <div className="banner-meta">
            <div className="bm-item"><i className="ph ph-calendar-blank"></i> <span id="profile-joined">Joined {user.date_of_joining || '-'}</span></div>
            {user.company_name && <div className="bm-item"><i className="ph ph-buildings"></i> {user.company_name}</div>}
          </div>
        </div>
      </div>

      {showStats && (
      <div className="stats-grid">
        {stat('ph-briefcase', { background: 'rgba(106, 13, 173, 0.1)', color: 'var(--prof-secondary)' }, stats?.openCases, 'Open Escalations')}
        {stat('ph-users-three', { background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }, stats?.teamLeads, 'Team Leads')}
        {stat('ph-users', { background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }, stats?.employees, 'Employees')}
        {stat('ph-calendar-x', { background: 'rgba(249, 115, 22, 0.1)', color: '#F97316' }, stats?.pendingLeaves, 'Pending Leaves')}
      </div>
      )}

      <div className="split-grid">
        <div className="split-grid" style={{ marginBottom: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--prof-text)', display: 'flex', alignItems: 'center', gap: 8 }}><i className="ph-fill ph-identification-card" style={{ color: 'var(--prof-primary)' }}></i> Personal Information</h3>
            <div className="info-list">
              <div className="il-item"><span className="il-label">Employee ID</span><span className="il-val" id="info-empId">{user.emp_id}</span></div>
              <div className="il-item"><span className="il-label">Email Address</span><span className="il-val" id="info-email">{user.email}</span></div>
              <div className="il-item"><span className="il-label">Phone Number</span><span className="il-val" id="info-phone">{user.phone || '-'}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--prof-text)', display: 'flex', alignItems: 'center', gap: 8 }}><i className="ph-fill ph-buildings" style={{ color: 'var(--prof-secondary)' }}></i> Work Information</h3>
            <div className="info-list">
              <div className="il-item"><span className="il-label">Department</span><span className="il-val" id="info-dept">{user.department_id || '-'}</span></div>
              <div className="il-item"><span className="il-label">Role / Position</span><span className="il-val" id="info-role">{roleLabel}</span></div>
              <div className="il-item"><span className="il-label">Company</span><span className="il-val">{user.company_name || '-'}</span></div>
              <div className="il-item"><span className="il-label">Joined</span><span className="il-val">{shortDate(user.date_of_joining)}</span></div>
            </div>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 16, color: 'var(--prof-text)', display: 'flex', alignItems: 'center', gap: 8 }}><i className="ph-fill ph-lock-key" style={{ color: '#22C55E' }}></i> Security Settings</h3>
          <p style={{ fontSize: 13, color: 'var(--prof-muted)', marginTop: 0 }}>Update your password regularly to keep your account secure.</p>
          <form id="password-form" onSubmit={submit} noValidate>
            <div className="form-group">
              <label htmlFor="currentPwd">Current Password<RequiredMark /></label>
              <PasswordInput id="currentPwd" placeholder="Enter current password" value={pwd.current} onChange={set('current')} inputProps={validation.input('current', 'currentPwd')} />
              <FieldError {...validation.errorProps('current')} />
            </div>
            <div className="form-group">
              <label htmlFor="newPwd">New Password<RequiredMark /></label>
              <PasswordInput id="newPwd" placeholder="Enter new password" value={pwd.next} onChange={set('next')} toggleable inputProps={validation.input('next', 'newPwd')} />
              <span className="form-hint">{PASSWORD_HINT}</span>
              <FieldError {...validation.errorProps('next')} />
            </div>
            <div className="form-group">
              <label htmlFor="confPwd">Confirm New Password<RequiredMark /></label>
              <PasswordInput id="confPwd" placeholder="Re-type new password" value={pwd.confirm} onChange={set('confirm')} toggleable inputProps={validation.input('confirm', 'confPwd')} />
              <FieldError {...validation.errorProps('confirm')} />
              {error && (
                <div id="pwdErr" role="alert" style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}><i className="ph-fill ph-warning-circle"></i> {error}</div>
              )}
            </div>
            <button type="submit" className="btn-save" id="btnUpdatePwd" disabled={saving}>
              {saving ? 'Updating...' : <><i className="ph ph-check-circle" style={{ fontSize: '1.2rem' }}></i> Update Password</>}
            </button>
          </form>
        </div>
      </div>

      {toast}
    </div>
  );
}
