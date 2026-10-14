// Converted from front-end/hr/profile.html + js/views/hr/profile.js.
// The original filled in a hard-coded demo person ("Roshan", fixed stats and skills);
// this shows the signed-in user's account and live company figures. The Company
// Admin profile is the same page without the stats row (company_admin/profile.html).
import { useEffect, useState } from 'react';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import * as hr from '../../services/hrService';
import { shortDate } from './hrUtils';
import './styles/profile.css';

const EMPTY = { current: '', next: '', confirm: '' };

function PasswordInput({ id, value, onChange, placeholder, toggleable }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input type={visible ? 'text' : 'password'} id={id} required placeholder={placeholder} value={value} onChange={onChange} autoComplete={id === 'currentPwd' ? 'current-password' : 'new-password'} />
      {toggleable && (
        <i className={`ph ${visible ? 'ph-eye-slash' : 'ph-eye'} eye-icon`} role="button" tabIndex={0} aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((v) => !v)}></i>
      )}
    </div>
  );
}

export default function HrProfile({ title = 'My Profile', roleLabel = 'HR Manager', showStats = true }) {
  usePageTitle(title);
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();
  const [stats, setStats] = useState(null);
  const [pwd, setPwd] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showStats) return;
    Promise.all([hr.getEmployees(), hr.getEscalations().catch(() => []), hr.getLeaves().catch(() => [])])
      .then(([employees, escalations, leaves]) => setStats({
        openCases: escalations.filter((e) => e.status === 'OPEN').length,
        teamLeads: employees.filter((e) => e.role === 'TEAMLEAD').length,
        employees: employees.filter((e) => e.role === 'EMPLOYEE').length,
        pendingLeaves: leaves.filter((l) => l.status === 'PENDING').length,
      }))
      .catch(() => setStats(null));
  }, [showStats]);

  const mismatch = pwd.confirm.length > 0 && pwd.next !== pwd.confirm;
  const set = (key) => (e) => setPwd((p) => ({ ...p, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await hr.updateUserPassword(user.emp_id, pwd.current, pwd.next, pwd.confirm);
      setPwd(EMPTY);
      showToast('Password updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
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
          <form id="password-form" onSubmit={submit}>
            <div className="form-group"><label htmlFor="currentPwd">Current Password</label><PasswordInput id="currentPwd" placeholder="Enter current password" value={pwd.current} onChange={set('current')} /></div>
            <div className="form-group"><label htmlFor="newPwd">New Password</label><PasswordInput id="newPwd" placeholder="Enter new password" value={pwd.next} onChange={set('next')} toggleable /></div>
            <div className="form-group">
              <label htmlFor="confPwd">Confirm New Password</label>
              <PasswordInput id="confPwd" placeholder="Re-type new password" value={pwd.confirm} onChange={set('confirm')} toggleable />
              {(mismatch || error) && (
                <div id="pwdErr" role="alert" style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}><i className="ph-fill ph-warning-circle"></i> {mismatch ? 'Passwords do not match' : error}</div>
              )}
            </div>
            <button type="submit" className="btn-save" id="btnUpdatePwd" disabled={mismatch || saving} style={{ opacity: mismatch ? 0.5 : 1 }}>
              {saving ? 'Updating...' : <><i className="ph ph-check-circle" style={{ fontSize: '1.2rem' }}></i> Update Password</>}
            </button>
          </form>
        </div>
      </div>

      {toast}
    </div>
  );
}
