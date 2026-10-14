import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import {
  clearEscalationDraft,
  escalateToHr,
  getEscalationDraft,
  getHrEscalations,
  getTeamMembers,
  IS_DEMO,
  saveEscalationDraft,
} from '../../services/teamLeadService';
import { cx, formatDate } from '../../utils/helpers';
import { tlPath, useToast } from './components/TeamLeadUI';
import { nameOf, priorityBadge } from './tlUtils';
import './teamlead.css';

const CATEGORIES = [
  ['Conflict', 'ph-users-three'],
  ['Performance', 'ph-chart-line-down'],
  ['Policy', 'ph-scroll'],
  ['Harassment', 'ph-shield-warning'],
  ['Workload', 'ph-stack'],
  ['Leave', 'ph-calendar-x'],
  ['Personal', 'ph-user-circle'],
  ['Other', 'ph-dots-three-circle'],
];
const PRIORITIES = [
  ['Low', 'Can wait a week'],
  ['Medium', 'Within 2-3 days'],
  ['High', 'Needs attention today'],
];

export default function EscalateToHR() {
  usePageTitle('Escalate to HR');
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { data: members = [] } = useFetch(getTeamMembers, []);
  const { data: recent = [], reload: reloadRecent } = useFetch(getHrEscalations, []);
  const [draft, setDraft] = useState(getEscalationDraft);
  const [form, setForm] = useState({
    category: CATEGORIES.some(([c]) => c === params.get('category')) ? params.get('category') : '',
    priority: '',
    employee: params.get('employee') || '',
    personal: false,
    title: params.get('title') || '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.category) found.category = 'Choose a category.';
    if (!form.priority) found.priority = 'Choose a priority.';
    if (!form.personal && form.category !== 'Personal' && !form.employee) found.employee = 'Select the related employee, or mark this as a personal issue.';
    if (form.title.trim().length < 5) found.title = 'Title must be at least 5 characters.';
    if (form.description.trim().length < 20) found.description = 'Describe the issue in at least 20 characters.';
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const record = await escalateToHr(
        {
          category: form.category,
          priority: form.priority,
          title: form.title.trim(),
          description: form.description.trim(),
          personal: form.personal,
          relatedEmployeeId: form.personal ? null : form.employee || null,
          relatedEmployee: form.personal || !form.employee ? 'N/A' : nameOf(members, form.employee),
        },
        user.emp_id,
      );
      setStatus({ type: 'success', message: `${record.id} sent to HR.` });
      setForm({ category: '', priority: '', employee: '', personal: false, title: '', description: '' });
      clearEscalationDraft();
      setDraft(null);
      reloadRecent();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Could not submit the escalation.' });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => {
    saveEscalationDraft(form);
    setDraft(getEscalationDraft());
    showToast('Draft saved in this browser');
  };

  return (
    <div className="tl-page">
      <div>
        <Link to={tlPath('escalations')} className="tl-muted"><i className="ph ph-arrow-left"></i> Back to Escalations</Link>
      </div>
      {IS_DEMO && (
        <div className="tl-demo-notice"><i className="ph ph-info"></i> Demo mode: escalations are stored in this browser only.</div>
      )}

      <div className="tl-grid-main">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 className="tl-section-title">New HR Escalation</h3>
          {status && (
            <div className={`tl-alert tl-alert-${status.type}`} role="alert" style={{ marginBottom: 16 }}>
              <i className={`ph-fill ${status.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i> {status.message}
            </div>
          )}
          {draft && !status && (
            <div className="tl-alert" style={{ background: 'var(--bg-main)', marginBottom: 16 }}>
              <i className="ph ph-floppy-disk"></i> Draft saved {formatDate(draft.savedAt)}
              <Button variant="outline" className="tl-btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setForm(({ ...draft }))}>Restore draft</Button>
            </div>
          )}

          <fieldset className="form-group" style={{ border: 0, padding: 0 }}>
            <legend className="form-label">Category <span className="tl-required">*</span></legend>
            <div className={cx('tl-choice-grid', errors.category && 'is-invalid')}>
              {CATEGORIES.map(([name, icon]) => (
                <button key={name} type="button" className="tl-choice" aria-pressed={form.category === name} onClick={() => set('category', name)}>
                  <i className={`ph ${icon}`}></i> {name}
                </button>
              ))}
            </div>
            {errors.category && <div className="form-error" style={{ display: 'block' }}>{errors.category}</div>}
          </fieldset>

          <fieldset className="form-group" style={{ border: 0, padding: 0 }}>
            <legend className="form-label">Priority <span className="tl-required">*</span></legend>
            <div className={cx('tl-choice-grid', errors.priority && 'is-invalid')}>
              {PRIORITIES.map(([name, hint]) => (
                <button key={name} type="button" className="tl-choice" aria-pressed={form.priority === name} onClick={() => set('priority', name)}>
                  <strong>{name}</strong>
                  <span className="tl-muted">{hint}</span>
                </button>
              ))}
            </div>
            {errors.priority && <div className="form-error" style={{ display: 'block' }}>{errors.priority}</div>}
          </fieldset>

          <label className="tl-switch" style={{ marginBottom: 'var(--spacing-md)' }}>
            <input type="checkbox" checked={form.personal} onChange={(e) => setForm((f) => ({ ...f, personal: e.target.checked, employee: e.target.checked ? '' : f.employee }))} />
            <span>
              <strong>This is a personal issue</strong>
              <div className="tl-muted">It concerns you, not a team member, so no employee is linked.</div>
            </span>
          </label>

          <Input as="select" label="Related Employee" value={form.employee} error={errors.employee} disabled={form.personal} onChange={(e) => set('employee', e.target.value)}>
            <option value="">Select team member</option>
            {members.map((m) => <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>)}
          </Input>
          <Input label="Issue Title" placeholder="Short summary" value={form.title} error={errors.title} onChange={(e) => set('title', e.target.value)} />
          <Input as="textarea" rows={5} label="Detailed Description" placeholder="What happened, when, and what you have tried" value={form.description} error={errors.description} onChange={(e) => set('description', e.target.value)} />

          <div className="tl-form-actions">
            <Button type="submit" variant="orange" icon="ph-paper-plane-tilt" disabled={saving}>{saving ? 'Submitting...' : 'Submit to HR'}</Button>
            <Button variant="outline" icon="ph-floppy-disk" onClick={saveDraft}>Save Draft</Button>
          </div>
        </form>

        <div className="card">
          <h3 className="tl-section-title">Recent Escalations</h3>
          {recent.length === 0 ? (
            <EmptyState icon="ph-paper-plane-tilt" description="No escalations sent yet." />
          ) : (
            recent.slice(0, 8).map((r) => (
              <div key={r.id} className="tl-issue-card">
                <div className="tl-issue-header" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="tl-id">{r.id}</span>
                  <span className="tl-actions">
                    <Badge variant={priorityBadge(r.priority)}>{r.priority}</Badge>
                    <Badge variant="warning">{r.status}</Badge>
                  </span>
                </div>
                <div className="tl-strong">{r.title}</div>
                <div className="tl-muted">{r.category} &bull; Related to: {r.relatedEmployee} &bull; {formatDate(r.date)}</div>
              </div>
            ))
          )}
        </div>
      </div>
      {toast}
    </div>
  );
}
