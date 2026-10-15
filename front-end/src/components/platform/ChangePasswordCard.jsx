import { useState } from 'react';
import Input from '../common/Input';
import useFormValidation from '../../hooks/useFormValidation';
import { PASSWORD_HINT } from '../../utils/validation';
import { changePasswordSchema } from '../../validation/formSchemas';

const EMPTY = { current: '', next: '', confirm: '' };
const SERVER_FIELDS = { currentPassword: 'current', newPassword: 'next', confirmPassword: 'confirm' };

/**
 * "Security Settings" card from the Platform Admin / Support Member profile pages.
 * Field-level checks (current required, new password strength, differs from
 * current, confirmation matches); the backend (PATCH /employees/:id/password)
 * verifies the current password and the same rules.
 * onSubmit(current, next, confirm) resolves { saved: boolean } - saved is false
 * in demo mode, where the password can be verified but not changed.
 */
export default function ChangePasswordCard({ onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const validation = useFormValidation(changePasswordSchema, values, { idPrefix: 'pf-pwd', serverFieldMap: SERVER_FIELDS });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!validation.validateAll()) return;
    setSaving(true);
    try {
      const { saved } = await onSubmit(values.current, values.next, values.confirm);
      setValues(EMPTY);
      validation.reset();
      setSuccess(saved
        ? 'Password updated successfully.'
        : 'Demo mode: your current password was verified, but passwords can only be changed with a backend.');
    } catch (err) {
      if (!validation.setServerErrors(err)) setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card settings-card">
      <div className="card-title"><i className="ph-fill ph-lock-key"></i> Security Settings</div>
      <p className="card-hint">Update your password regularly to keep your account secure.</p>
      <form onSubmit={handleSubmit} noValidate>
        <Input type="password" label="Current Password" required maxLength={64} autoComplete="current-password" placeholder="Enter current password" value={values.current} onChange={set('current')} {...validation.field('current')} />
        <Input type="password" label="New Password" required maxLength={64} autoComplete="new-password" placeholder="Enter new password" hint={PASSWORD_HINT} value={values.next} onChange={set('next')} {...validation.field('next')} />
        <Input type="password" label="Confirm New Password" required maxLength={64} autoComplete="new-password" placeholder="Re-type new password" value={values.confirm} onChange={set('confirm')} {...validation.field('confirm')} />
        {error && <div className="form-error" role="alert">{error}</div>}
        {success && <div className="form-success" role="status">{success}</div>}
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Updating...' : <><i className="ph ph-check-circle"></i> Update Password</>}
        </button>
      </form>
    </div>
  );
}
