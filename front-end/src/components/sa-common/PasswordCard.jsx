import { useState } from 'react';
import FieldError, { RequiredMark } from '../common/FieldError';
import useFormValidation from '../../hooks/useFormValidation';
import { PASSWORD_HINT } from '../../utils/validation';
import { changePasswordSchema } from '../../validation/formSchemas';

const EMPTY = { current: '', next: '', confirm: '' };
const SERVER_FIELDS = { currentPassword: 'current', newPassword: 'next', confirmPassword: 'confirm' };

/**
 * "Security Settings" card from the original profile pages. Field-level checks
 * (current required, new password strength, differs from current, confirmation
 * matches); the backend verifies the current password and the same rules.
 * onSubmit(current, next, confirm) returns a promise; onSuccess runs once it resolves.
 */
export default function PasswordCard({ onSubmit, onSuccess }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const validation = useFormValidation(changePasswordSchema, values, { idPrefix: 'sa-pwd', serverFieldMap: SERVER_FIELDS });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validation.validateAll()) return;
    setSaving(true);
    try {
      await onSubmit(values.current, values.next, values.confirm);
      setValues(EMPTY);
      validation.reset();
      onSuccess?.();
    } catch (err) {
      if (!validation.setServerErrors(err)) setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  const field = (name, id, label, props) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}<RequiredMark /></label>
      <input type="password" className="form-control" aria-required="true" maxLength={64} value={values[name]} onChange={set(name)} {...props} {...validation.input(name, id)} />
      <FieldError {...validation.errorProps(name)} />
    </div>
  );

  return (
    <div className="card settings-card" style={{ padding: 24 }}>
      <div className="card-title"><i className="ph-fill ph-lock-key"></i> Security Settings</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>Update your password regularly to keep your account secure.</p>
      <form id="password-form" onSubmit={handleSubmit} noValidate>
        {field('current', 'currentPwd', 'Current Password', { autoComplete: 'current-password', placeholder: 'Enter current password' })}
        {field('next', 'newPwd', 'New Password', { autoComplete: 'new-password', placeholder: 'Enter new password' })}
        <span className="form-hint" style={{ marginTop: -8, marginBottom: 12 }}>{PASSWORD_HINT}</span>
        {field('confirm', 'confPwd', 'Confirm New Password', { autoComplete: 'new-password', placeholder: 'Re-type new password' })}
        {error && <div id="pwd-error" className="form-error" style={{ display: 'block' }} role="alert">{error}</div>}
        <button type="submit" className="btn-save" disabled={saving}>
          {saving ? 'Updating...' : <><i className="ph ph-check-circle"></i> Update Password</>}
        </button>
      </form>
    </div>
  );
}
