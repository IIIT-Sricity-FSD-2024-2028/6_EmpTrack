// Converted from front-end/super_admin/settings.html + js/views/super_admin/settings.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import { Field } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import * as sa from '../../services/superAdminService';
import { SA_BASE, SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/settings.css';

/** Server settings -> flat form values (same defaults as the original). */
function toForm(s) {
  const sec = s.security_settings || {};
  const notif = s.notification_settings || {};
  return {
    platform_name: s.platform_name || '',
    support_email: s.support_email || '',
    default_currency: s.default_currency || '',
    timezone: s.timezone || '',
    maintenance_mode: !!s.maintenance_mode,
    passwordMinLength: sec.passwordMinLength || 8,
    sessionTimeoutMinutes: sec.sessionTimeoutMinutes || 60,
    invitationExpiryHours: sec.invitationExpiryHours || 72,
    twoFactorRequired: !!sec.twoFactorRequired,
    emailNotifications: !!notif.emailNotifications,
    criticalEscalationAlerts: !!notif.criticalEscalationAlerts,
    weeklyDigest: !!notif.weeklyDigest,
    newCompanyAlerts: !!notif.newCompanyAlerts,
  };
}

function Toggle({ id, title, desc, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <span className="toggle-title">{title}</span>
        <span className="toggle-desc">{desc}</span>
      </div>
      <label className="switch">
        <input type="checkbox" id={id} aria-label={title} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="slider"></span>
      </label>
    </div>
  );
}

export default function SaSettings() {
  const [toast, showToast] = useSaToast();
  const [form, setForm] = useState(() => toForm({}));
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    sa.getPlatformSettings()
      .then((s) => {
        setForm(toForm(s));
        setPermissions(s.role_permissions || {});
      })
      .catch(() => showToast('Failed to load platform settings.', 'error'));
  }, [showToast]);

  const text = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const toggle = (key) => ({ checked: form[key], onChange: (value) => setForm((f) => ({ ...f, [key]: value })) });

  const save = async (data, success) => {
    try {
      const updated = await sa.updatePlatformSettings(data);
      if (updated?.role_permissions) setPermissions(updated.role_permissions);
      showToast(success);
    } catch (e) {
      showToast(e.message || 'Failed to save.', 'error');
    }
  };

  const savePlatform = () => save({
    platform_name: form.platform_name.trim(),
    support_email: form.support_email.trim(),
    default_currency: form.default_currency.trim().toUpperCase(),
    timezone: form.timezone.trim(),
    maintenance_mode: form.maintenance_mode,
  }, 'Platform configuration saved.');

  const saveSecurity = () => save({
    security_settings: {
      passwordMinLength: Number(form.passwordMinLength) || 8,
      sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes) || 60,
      invitationExpiryHours: Number(form.invitationExpiryHours) || 72,
      twoFactorRequired: form.twoFactorRequired,
    },
  }, 'Security settings saved.');

  const saveNotifications = () => save({
    notification_settings: {
      emailNotifications: form.emailNotifications,
      criticalEscalationAlerts: form.criticalEscalationAlerts,
      weeklyDigest: form.weeklyDigest,
      newCompanyAlerts: form.newCompanyAlerts,
    },
  }, 'Notification settings saved.');

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Super Admin Settings" title="Settings" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="settings-grid">
          <div className="card settings-card">
            <div className="card-title"><i className="ph-fill ph-sliders-horizontal"></i> Platform Configuration</div>
            <Field label="Platform Name" htmlFor="st-name"><input type="text" className="form-control" id="st-name" {...text('platform_name')} /></Field>
            <Field label="Support Email" htmlFor="st-support-email"><input type="email" className="form-control" id="st-support-email" {...text('support_email')} /></Field>
            <Field label="Default Currency" htmlFor="st-currency"><input type="text" className="form-control" id="st-currency" maxLength={3} style={{ textTransform: 'uppercase' }} {...text('default_currency')} /></Field>
            <Field label="Timezone" htmlFor="st-timezone"><input type="text" className="form-control" id="st-timezone" {...text('timezone')} /></Field>
            <Toggle id="st-maintenance" title="Maintenance Mode" desc="Temporarily restrict access for non-Super-Admin users" {...toggle('maintenance_mode')} />
            <button type="button" className="btn-save" id="btn-save-platform" onClick={savePlatform}><i className="ph ph-check-circle"></i> Save Platform Configuration</button>
          </div>

          <div className="card settings-card">
            <div className="card-title"><i className="ph-fill ph-shield-check"></i> Security Settings</div>
            <Field label="Minimum Password Length" htmlFor="st-pwd-len"><input type="number" min="6" max="32" className="form-control" id="st-pwd-len" {...text('passwordMinLength')} /></Field>
            <Field label="Session Timeout (minutes)" htmlFor="st-session"><input type="number" min="5" className="form-control" id="st-session" {...text('sessionTimeoutMinutes')} /></Field>
            <Field label="Invitation Expiry (hours)" htmlFor="st-invite-expiry"><input type="number" min="1" className="form-control" id="st-invite-expiry" {...text('invitationExpiryHours')} /></Field>
            <Toggle id="st-2fa" title="Require Two-Factor Authentication" desc="Applies to Platform Admin and Company Admin accounts" {...toggle('twoFactorRequired')} />
            <button type="button" className="btn-save" id="btn-save-security" onClick={saveSecurity}><i className="ph ph-check-circle"></i> Save Security Settings</button>
          </div>

          <div className="card settings-card">
            <div className="card-title"><i className="ph-fill ph-bell"></i> Notification Settings</div>
            <Toggle id="st-notif-email" title="Email Notifications" desc="Platform-wide email notifications" {...toggle('emailNotifications')} />
            <Toggle id="st-notif-escalation" title="Critical Escalation Alerts" desc="Notify Super Admin of new critical escalations" {...toggle('criticalEscalationAlerts')} />
            <Toggle id="st-notif-digest" title="Weekly Digest" desc="Weekly summary of platform activity" {...toggle('weeklyDigest')} />
            <Toggle id="st-notif-company" title="New Company Alerts" desc="Notify when a company is onboarded" {...toggle('newCompanyAlerts')} />
            <button type="button" className="btn-save" id="btn-save-notifications" onClick={saveNotifications}><i className="ph ph-check-circle"></i> Save Notification Settings</button>
          </div>

          <div className="card settings-card">
            <div className="card-title"><i className="ph-fill ph-users-three"></i> Roles &amp; Permissions</div>
            <div id="role-permissions-list">
              {Object.entries(permissions).map(([role, capabilities]) => (
                <div key={role} className="role-perm-block">
                  <div className="role-perm-title">{role.replace('_', ' ')}</div>
                  {(capabilities || []).map((cap) => <div key={cap} className="role-perm-item"><i className="ph-fill ph-check-circle"></i> {cap}</div>)}
                </div>
              ))}
            </div>
            <div className="form-hint" style={{ marginTop: 8 }}><i className="ph ph-info"></i> Role capabilities are enforced by the backend and shown here for reference.</div>
          </div>

          <div className="card settings-card">
            <div className="card-title"><i className="ph-fill ph-credit-card"></i> Subscription Configuration</div>
            <p style={{ fontSize: 13, color: 'var(--set-muted)', marginTop: 0 }}>Subscription plans, pricing, and billing cycles are managed from the dedicated Subscriptions section.</p>
            <Link to={`${SA_BASE}/subscriptions`} className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>Go to Subscriptions</Link>
          </div>
        </div>
      </div>

      {toast}
    </>
  );
}
