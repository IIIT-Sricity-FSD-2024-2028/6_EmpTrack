import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import FieldError from '../../components/common/FieldError';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
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
import { escalateToHrSchema } from '../../validation/formSchemas';
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
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const validation = useFormValidation(
    escalateToHrSchema(CATEGORIES.map(([c]) => c), PRIORITIES.map(([p]) => p), members.map((m) => m.emp_id)),
    form,
    { idPrefix: 'esc', serverFieldMap: { reference_type: 'category', escalation_reason: 'description' } },
  );
  const errors = validation.errors;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validation.validateAll()) return;

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
      validation.reset();
      clearEscalationDraft();
      setDraft(null);
      reloadRecent();
    } catch (err) {
      if (!validation.setServerErrors(err)) setStatus({ type: 'error', message: err.message || 'Could not submit the escalation.' });
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
            <div className={cx('tl-choice-grid', errors.category && 'is-invalid')} role="group" aria-label="Category" tabIndex={-1} {...validation.input('category', 'esc-category')}>
              {CATEGORIES.map(([name, icon]) => (
                <button key={name} type="button" className="tl-choice" aria-pressed={form.category === name} onClick={() => { set('category', name); validation.touch('category'); }}>
                  <i className={`ph ${icon}`}></i> {name}
                </button>
              ))}
            </div>
            <FieldError {...validation.errorProps('category')} />
          </fieldset>

          <fieldset className="form-group" style={{ border: 0, padding: 0 }}>
            <legend className="form-label">Priority <span className="tl-required">*</span></legend>
            <div className={cx('tl-choice-grid', errors.priority && 'is-invalid')} role="group" aria-label="Priority" tabIndex={-1} {...validation.input('priority', 'esc-priority')}>
              {PRIORITIES.map(([name, hint]) => (
                <button key={name} type="button" className="tl-choice" aria-pressed={form.priority === name} onClick={() => { set('priority', name); validation.touch('priority'); }}>
                  <strong>{name}</strong>
                  <span className="tl-muted">{hint}</span>
                </button>
              ))}
            </div>
            <FieldError {...validation.errorProps('priority')} />
          </fieldset>

          <label className="tl-switch" style={{ marginBottom: 'var(--spacing-md)' }}>
            <input type="checkbox" checked={form.personal} onChange={(e) => setForm((f) => ({ ...f, personal: e.target.checked, employee: e.target.checked ? '' : f.employee }))} />
            <span>
              <strong>This is a personal issue</strong>
              <div className="tl-muted">It concerns you, not a team member, so no employee is linked.</div>
            </span>
          </label>

          <Input as="select" label="Related Employee" required={!form.personal && form.category !== 'Personal'} value={form.employee} disabled={form.personal} onChange={(e) => set('employee', e.target.value)} {...validation.field('employee')}>
            <option value="">Select team member</option>
            {members.map((m) => <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>)}
          </Input>
          <Input label="Issue Title" required maxLength={150} placeholder="Short summary" value={form.title} onChange={(e) => set('title', e.target.value)} {...validation.field('title')} />
          <Input as="textarea" rows={5} required maxLength={1800} hint="At least 20 characters." label="Detailed Description" placeholder="What happened, when, and what you have tried" value={form.description} onChange={(e) => set('description', e.target.value)} {...validation.field('description')} />

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
