// Converted from front-end/hr/settings.html + js/views/hr/settings.js.
// The original only simulated saving. The backend has no HR settings endpoint, so
// settings are kept in this browser (hrService) and restored on the next visit;
// the late-arrival threshold is used by the Attendance page.
import { useState } from 'react';
import useSaToast from '../../components/sa-common/useSaToast';
import usePageTitle from '../../hooks/usePageTitle';
import { getHrSettings, saveHrSettings } from '../../services/hrService';
import './styles/settings.css';

function Toggle({ title, desc, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <span className="toggle-title">{title}</span>
        <span className="toggle-desc">{desc}</span>
      </div>
      <label className="switch"><input type="checkbox" aria-label={title} checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="slider"></span></label>
    </div>
  );
}

const ROLE_PERMISSIONS = [
  { title: 'Employee Role', items: ['View assigned tasks', 'Report issues', 'Log work hours', 'Request leave'] },
  { title: 'Team Lead Role', items: ['Assign tasks', 'Manage escalations', 'Monitor team work', 'Approve team leave'] },
  { title: 'HR Role', items: ['View employee directory', 'Approve leave', 'Review escalations', 'View reports'] },
];

export default function HrSettings() {
  usePageTitle('System Settings');
  const [toast, showToast] = useSaToast();
  const [settings, setSettings] = useState(getHrSettings);

  const field = (section, key) => ({
    value: settings[section][key],
    onChange: (e) => setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: e.target.value } })),
  });
  const toggle = (section, key) => ({
    checked: Boolean(settings[section][key]),
    onChange: (value) => setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } })),
  });

  const save = (section) => (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    saveHrSettings(section, settings[section]);
    showToast('Settings saved successfully!');
  };

  const saveButton = <><br /><button type="submit" className="btn-save"><i className="ph ph-floppy-disk"></i> Save Changes</button></>;

  return (
    <div className="hr-settings-root">
      <p style={{ marginTop: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        <i className="ph ph-info"></i> These preferences are saved in this browser.
      </p>
      <div className="settings-grid">
        <div className="card">
          <div className="card-title"><i className="ph-fill ph-buildings"></i> General Settings</div>
          <form className="settings-form" onSubmit={save('general')}>
            <div className="form-group"><label htmlFor="hs-company">Company Name</label><input id="hs-company" type="text" required {...field('general', 'companyName')} /></div>
            <div className="form-group"><label htmlFor="hs-hours">Working Hours Per Day</label><input id="hs-hours" type="number" required min="1" max="24" {...field('general', 'hoursPerDay')} /></div>
            <div className="form-group"><label htmlFor="hs-days">Working Days Per Week</label><input id="hs-days" type="number" required min="1" max="7" {...field('general', 'daysPerWeek')} /></div>
            {saveButton}
          </form>
        </div>

        <div className="card">
          <div className="card-title"><i className="ph-fill ph-calendar-check"></i> Attendance Settings</div>
          <form className="settings-form" onSubmit={save('attendance')}>
            <div className="form-group"><label htmlFor="hs-progress">Min Progress for Full Attendance (%)</label><input id="hs-progress" type="number" required min="1" max="100" {...field('attendance', 'minProgress')} /></div>
            <div className="form-group"><label htmlFor="hs-late">Late Check-in Threshold (mins after 09:00)</label><input id="hs-late" type="number" required min="0" {...field('attendance', 'lateThreshold')} /></div>
            <div style={{ marginTop: 16 }}>
              <Toggle title="Auto Mark Attendance" desc="Automatically determine attendance based on tasks" {...toggle('attendance', 'autoMark')} />
            </div>
            <Toggle title="Daily Summary Emails" desc="Send end-of-day attendance reports to HR" {...toggle('attendance', 'dailySummary')} />
            {saveButton}
          </form>
        </div>

        <div className="card">
          <div className="card-title"><i className="ph-fill ph-bell-ringing"></i> Notification Settings</div>
          <form className="settings-form" onSubmit={save('notifications')}>
            <Toggle title="Task Assignments" desc="Notify employees when new tasks arrive" {...toggle('notifications', 'taskAssignments')} />
            <Toggle title="Issue Escalations" desc="Alert HR team instantly for critical matters" {...toggle('notifications', 'issueEscalations')} />
            <Toggle title="Leave Requests" desc="Trigger manager approval notifications" {...toggle('notifications', 'leaveRequests')} />
            <Toggle title="Weekly Performance" desc="Summarized automated analytics every Friday" {...toggle('notifications', 'weeklyPerformance')} />
            {saveButton}
          </form>
        </div>

        <div className="card">
          <div className="card-title"><i className="ph-fill ph-envelope-simple"></i> Email Settings</div>
          <form className="settings-form" onSubmit={save('email')}>
            <div className="form-group"><label htmlFor="hs-smtp">SMTP Server</label><input id="hs-smtp" type="text" required {...field('email', 'smtpServer')} /></div>
            <div className="form-group"><label htmlFor="hs-port">SMTP Port</label><input id="hs-port" type="number" required {...field('email', 'smtpPort')} /></div>
            <div className="form-group"><label htmlFor="hs-from-email">From Email</label><input id="hs-from-email" type="email" required {...field('email', 'fromEmail')} /></div>
            <div className="form-group"><label htmlFor="hs-from-name">From Name</label><input id="hs-from-name" type="text" required {...field('email', 'fromName')} /></div>
            {saveButton}
          </form>
        </div>

        <div className="card">
          <div className="card-title"><i className="ph-fill ph-shield-check"></i> Security Settings</div>
          <form className="settings-form" onSubmit={save('security')}>
            <Toggle title="Two-Factor Auth (2FA)" desc="Require OTP for all admin accounts" {...toggle('security', 'twoFactor')} />
            <Toggle title="Session Timeout" desc="Logout inactive users after 30 minutes" {...toggle('security', 'sessionTimeout')} />
            <div style={{ marginTop: 16 }}>
              <span style={{ display: 'block', marginBottom: 12 }}>Password Policy Requirements:</span>
              {[['minLength', 'Minimum 8 characters'], ['mixedCase', 'Uppercase & Lowercase letters'], ['number', 'At least one number'], ['special', 'At least one special character']].map(([key, label]) => (
                <label key={key} className="check-row">
                  <input type="checkbox" checked={Boolean(settings.security[key])} onChange={(e) => toggle('security', key).onChange(e.target.checked)} /> {label}
                </label>
              ))}
            </div>
            {saveButton}
          </form>
        </div>

        <div className="card">
          <div className="card-title"><i className="ph-fill ph-users"></i> User Roles &amp; Permissions</div>
          {ROLE_PERMISSIONS.map((block, i) => (
            <div key={block.title} className="role-block" style={i === ROLE_PERMISSIONS.length - 1 ? { marginBottom: 0 } : undefined}>
              <div className="role-block-title">{block.title}</div>
              {block.items.map((item) => <label key={item} className="check-row"><input type="checkbox" checked readOnly disabled /> {item}</label>)}
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>Role permissions are enforced by the backend and shown here for reference.</p>
        </div>
      </div>

      {toast}
    </div>
  );
}
