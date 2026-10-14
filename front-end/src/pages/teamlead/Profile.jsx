import { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ProfileSection from '../../components/profile/ProfileSection';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { changePassword, getProfile, saveProfile } from '../../services/teamLeadService';
import { formatDate, getInitials } from '../../utils/helpers';
import { LoadState, useTeamData, useToast } from './components/TeamLeadUI';
import { isEscalated, teamIssues } from './tlUtils';
import './teamlead.css';

// Same rule as the employee profile page.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' };

const formatPhone = (p) => (p && p.length === 10 ? `+1 (${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : p || '--');

function ChangePassword({ empId }) {
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.current) found.current = 'Enter your current password.';
    if (!STRONG_PASSWORD.test(values.next)) found.next = 'Use 8+ characters with upper and lower case, a number and a special character (@$!%*?&).';
    else if (values.next === values.current) found.next = 'The new password must differ from the current one.';
    if (values.confirm !== values.next) found.confirm = 'Passwords do not match.';
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const { saved } = await changePassword(empId, values.current, values.next, values.confirm);
      setValues(EMPTY_PASSWORDS);
      setStatus(saved
        ? { type: 'success', message: 'Password updated successfully.' }
        : { type: 'success', message: 'Demo mode: your current password was verified, but passwords can only be changed with a backend.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h3 className="tl-section-title">Change Password</h3>
      {status && (
        <div className={`tl-alert tl-alert-${status.type}`} role="alert" style={{ marginBottom: 16 }}>
          <i className={`ph-fill ${status.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i> {status.message}
        </div>
      )}
      <div className="tl-form-grid">
        <Input type="password" label="Current Password" autoComplete="current-password" value={values.current} error={errors.current} onChange={set('current')} />
        <Input type="password" label="New Password" autoComplete="new-password" value={values.next} error={errors.next} onChange={set('next')} />
        <Input type="password" label="Confirm New Password" autoComplete="new-password" value={values.confirm} error={errors.confirm} onChange={set('confirm')} />
      </div>
      <Button type="submit" variant="purple" icon="ph-lock-key" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</Button>
    </form>
  );
}

export default function Profile() {
  usePageTitle('My Profile');
  const { user } = useAuth();
  const { data: profile, error, reload } = useFetch(() => getProfile(user), [user.emp_id]);
  const { data: team } = useTeamData({ leaves: true, issues: true });
  const [editing, setEditing] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [toast, showToast] = useToast();

  const members = team?.members ?? [];
  const tasks = team?.tasks ?? [];
  const issues = teamIssues(members, team?.issues ?? []);
  const done = tasks.filter((t) => t.status === 'COMPLETED').length;
  const leadership = [
    { label: 'Team Members', value: members.length, icon: 'ph-users-three' },
    { label: 'Open Tasks Assigned', value: tasks.length - done, icon: 'ph-briefcase' },
    { label: 'Team Completion Rate', value: `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%`, icon: 'ph-chart-line-up' },
    { label: 'Issues Resolved', value: issues.filter((i) => i.status === 'Resolved').length, icon: 'ph-check-circle' },
    { label: 'Pending Approvals', value: (team?.leaves ?? []).filter((l) => l.status === 'PENDING').length, icon: 'ph-hourglass' },
    { label: 'Active Escalations', value: tasks.filter((t) => isEscalated(t)).length, icon: 'ph-warning' },
  ];

  const openEdit = () => {
    setEditErrors({});
    setEditing({ phone: profile.phone || '', address: profile.address || '', experience: profile.experience || '', skills: (profile.skills || []).join(', ') });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const found = {};
    const phone = editing.phone.replace(/\D/g, '');
    if (phone && phone.length !== 10) found.phone = 'Enter a 10 digit phone number.';
    if (editing.address.length > 200) found.address = 'Keep the address under 200 characters.';
    setEditErrors(found);
    if (Object.keys(found).length) return;
    await saveProfile({
      phone,
      address: editing.address.trim(),
      experience: editing.experience.trim(),
      skills: editing.skills.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setEditing(null);
    showToast('Profile updated');
    reload();
  };

  return (
    <div className="tl-page" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <LoadState loading={!profile && !error} error={error} onRetry={reload}>
        {profile && (
          <>
            <div className="profile-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div className="profile-avatar-ph" aria-hidden="true" style={{ fontSize: 28, fontWeight: 700 }}>{getInitials(profile.emp_name)}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 28 }}>{profile.emp_name}</h2>
                  <div style={{ fontSize: 18, opacity: 0.9 }}>{profile.position || 'Team Lead'} - {profile.department || 'Engineering'}</div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 14, opacity: 0.85, flexWrap: 'wrap' }}>
                    {profile.experience && <span><i className="ph ph-briefcase"></i> {profile.experience} experience</span>}
                    <span><i className="ph ph-users"></i> Managing {members.length} members</span>
                    {profile.date_of_joining && <span><i className="ph ph-calendar-blank"></i> Joined {formatDate(profile.date_of_joining)}</span>}
                  </div>
                </div>
              </div>
              <Button variant="outline" icon="ph-pencil-simple" onClick={openEdit} style={{ background: '#fff', color: 'var(--primary-color)' }}>Edit Profile</Button>
            </div>

            <div className="tl-grid-2">
              <ProfileSection
                title="Personal Information"
                fields={[
                  { icon: 'ph-identification-badge', label: 'Employee ID', value: profile.emp_id },
                  { icon: 'ph-envelope-simple', label: 'Email Address', value: profile.email },
                  { icon: 'ph-phone', label: 'Phone Number', value: formatPhone(profile.phone) },
                  { icon: 'ph-map-pin', label: 'Address', value: profile.address || '--' },
                ]}
              />
              <ProfileSection
                title="Work Information"
                fields={[
                  { label: 'Department', value: profile.department || profile.department_id || '--' },
                  { label: 'Position', value: profile.position || 'Team Lead' },
                  { label: 'Team Size', value: `${members.length} members` },
                  { label: 'Reports To', value: profile.reports_to || profile.manager_id || '--' },
                ]}
              />
            </div>

            <div className="card">
              <h3 className="tl-section-title">Leadership Statistics</h3>
              <div className="tl-stats-grid" style={{ marginBottom: 0 }}>
                {leadership.map((s) => (
                  <div key={s.label} className="tl-stats-list-item" style={{ alignItems: 'center' }}>
                    <span><i className={`ph ${s.icon}`}></i> {s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="tl-section-title">Skills &amp; Expertise</h3>
              <div className="tl-skill-row">
                {(profile.skills || []).length === 0 ? (
                  <span className="tl-muted">No skills added yet. Use Edit Profile to add some.</span>
                ) : (
                  profile.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)
                )}
              </div>
            </div>

            <ChangePassword empId={user.emp_id} />
          </>
        )}
      </LoadState>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Profile"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" form="tl-edit-profile">Save Changes</Button>
          </>
        }
      >
        {editing && (
          <form id="tl-edit-profile" className="tl-page" style={{ gap: 0 }} onSubmit={handleSave} noValidate>
            <Input label="Phone Number" inputMode="tel" value={editing.phone} error={editErrors.phone} onChange={(e) => setEditing((v) => ({ ...v, phone: e.target.value }))} />
            <Input label="Address" value={editing.address} error={editErrors.address} onChange={(e) => setEditing((v) => ({ ...v, address: e.target.value }))} />
            <Input label="Experience" placeholder="e.g. 6 years" value={editing.experience} onChange={(e) => setEditing((v) => ({ ...v, experience: e.target.value }))} />
            <Input as="textarea" rows={3} label="Skills (comma separated)" value={editing.skills} onChange={(e) => setEditing((v) => ({ ...v, skills: e.target.value }))} />
            <p className="tl-muted" style={{ margin: 0 }}>There is no self-service profile endpoint yet, so these changes are saved in this browser.</p>
          </form>
        )}
      </Modal>
      {toast}
    </div>
  );
}
