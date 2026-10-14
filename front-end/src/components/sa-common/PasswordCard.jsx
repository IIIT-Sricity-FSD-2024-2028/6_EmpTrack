import { useState } from 'react';

const EMPTY = { current: '', next: '', confirm: '' };

/**
 * "Security Settings" card from the original profile pages. Same client checks
 * (current required, new >= 8 chars, match); the backend verifies the current
 * password and the strength rules.
 * onSubmit(current, next, confirm) returns a promise; onSuccess runs once it resolves.
 */
export default function PasswordCard({ onSubmit, onSuccess }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.current) return setError('Please enter your current password.');
    if (!values.next || values.next.length < 8) return setError('Password must be at least 8 characters.');
    if (values.next !== values.confirm) return setError('Passwords do not match.');
    setError('');
    setSaving(true);
    try {
      await onSubmit(values.current, values.next, values.confirm);
      setValues(EMPTY);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card settings-card" style={{ padding: 24 }}>
      <div className="card-title"><i className="ph-fill ph-lock-key"></i> Security Settings</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>Update your password regularly to keep your account secure.</p>
      <form id="password-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="currentPwd">Current Password</label>
          <input type="password" className="form-control" id="currentPwd" autoComplete="current-password" placeholder="Enter current password" value={values.current} onChange={set('current')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="newPwd">New Password</label>
          <input type="password" className="form-control" id="newPwd" autoComplete="new-password" placeholder="Enter new password" value={values.next} onChange={set('next')} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confPwd">Confirm New Password</label>
          <input type="password" className="form-control" id="confPwd" autoComplete="new-password" placeholder="Re-type new password" value={values.confirm} onChange={set('confirm')} />
        </div>
        {error && <div id="pwd-error" className="form-error" style={{ display: 'block' }} role="alert">{error}</div>}
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Updating...' : <><i className="ph ph-check-circle"></i> Update Password</>}
        </button>
      </form>
    </div>
  );
}
