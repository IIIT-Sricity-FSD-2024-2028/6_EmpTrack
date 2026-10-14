import { useState } from 'react';
import Input from '../common/Input';

const EMPTY = { current: '', next: '', confirm: '' };

/**
 * "Security Settings" card from the Platform Admin / Support Member profile pages.
 * Same client checks as the original (current required, new >= 8 chars, match);
 * the backend (PATCH /employees/:id/password) verifies the current password and
 * the strength rules.
 * onSubmit(current, next, confirm) resolves { saved: boolean } - saved is false
 * in demo mode, where the password can be verified but not changed.
 */
export default function ChangePasswordCard({ onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!values.current) return setError('Please enter your current password.');
    if (!values.next || values.next.length < 8) return setError('Password must be at least 8 characters.');
    if (values.next !== values.confirm) return setError('Passwords do not match.');
    setError('');
    setSaving(true);
    try {
      const { saved } = await onSubmit(values.current, values.next, values.confirm);
      setValues(EMPTY);
      setSuccess(saved
        ? 'Password updated successfully.'
        : 'Demo mode: your current password was verified, but passwords can only be changed with a backend.');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card settings-card">
      <div className="card-title"><i className="ph-fill ph-lock-key"></i> Security Settings</div>
      <p className="card-hint">Update your password regularly to keep your account secure.</p>
      <form onSubmit={handleSubmit} noValidate>
        <Input type="password" label="Current Password" autoComplete="current-password" placeholder="Enter current password" value={values.current} onChange={set('current')} />
        <Input type="password" label="New Password" autoComplete="new-password" placeholder="Enter new password" value={values.next} onChange={set('next')} />
        <Input type="password" label="Confirm New Password" autoComplete="new-password" placeholder="Re-type new password" value={values.confirm} onChange={set('confirm')} />
        {error && <div className="form-error" role="alert">{error}</div>}
        {success && <div className="form-success" role="status">{success}</div>}
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Updating...' : <><i className="ph ph-check-circle"></i> Update Password</>}
        </button>
      </form>
    </div>
  );
}
