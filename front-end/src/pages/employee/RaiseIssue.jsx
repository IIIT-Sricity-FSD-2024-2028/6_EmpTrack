import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { createIssue } from '../../services/issueService';
import { getTasksForUser } from '../../services/taskService';
import { cx } from '../../utils/helpers';
import { ISSUE_ATTACHMENT_EXTENSIONS, raiseIssueSchema } from '../../validation/formSchemas';
import BackHeading from './components/BackHeading';
import { empPath } from './employeeUtils';

const WHEN_TO_RAISE = ['Productivity blockers', 'Technical issues', 'Resource problems', 'Team conflicts', 'Workload concerns'];

const ISSUE_TYPES = [
  { value: 'Low Productivity / Blocker', icon: 'ph-prohibit' },
  { value: 'Technical Issue / Bug', icon: 'ph-bug' },
  { value: 'Resource Unavailable', icon: 'ph-hard-drives' },
  { value: 'Missing Requirements', icon: 'ph-file-dashed' },
  { value: 'Team Conflict / Communication', icon: 'ph-users' },
  { value: 'Workload / Capacity Issue', icon: 'ph-stack' },
  { value: 'Other Issue', icon: 'ph-dots-three-circle' },
];

const PRIORITIES = [
  { value: 'Low', hint: '"Can wait"' },
  { value: 'Medium', hint: '"Needs attention"' },
  { value: 'High', hint: '"Urgent"', color: 'var(--danger-color)' },
];

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const labelStyle = { fontWeight: 'var(--font-medium)' };

export default function RaiseIssue() {
  usePageTitle('Raise Issue');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: activeTasks = [] } = useFetch(
    async () => (await getTasksForUser(user.emp_id)).filter((t) => t.status !== 'COMPLETED'),
    [user.emp_id],
  );

  const [form, setForm] = useState({
    type: ISSUE_TYPES[0].value,
    priority: 'Low',
    relatedTask: '',
    title: '',
    description: '',
    attachments: [],
  });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const validation = useFormValidation(
    raiseIssueSchema(ISSUE_TYPES.map((t) => t.value), activeTasks.map((t) => t.task_id)),
    form,
    { idPrefix: 'issue', serverFieldMap: { related_task: 'relatedTask' } },
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validation.validateAll()) return;
    setSubmitting(true);
    try {
      await createIssue({
        emp_id: user.emp_id,
        type: form.type,
        priority: form.priority,
        related_task: form.relatedTask,
        title: form.title.trim(),
        description: form.description.trim(),
      });
    } catch (err) {
      if (!validation.setServerErrors(err)) setSubmitError(err.message || 'Failed to raise the issue.');
      setSubmitting(false);
      return;
    }
    navigate(empPath('issues-list'));
  };

  return (
    <>
      <BackHeading to={empPath('issues-list')}>Raise a New Issue</BackHeading>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Info Banner */}
        <div style={{ backgroundColor: 'var(--primary-light)', borderRadius: 12, padding: 24, marginBottom: 24, display: 'flex', gap: 16 }}>
          <div style={{ color: 'var(--primary-color)', fontSize: 24 }}><i className="ph ph-info"></i></div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-hover)', fontSize: 'var(--text-md)' }}>When to Raise an Issue?</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-main)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              {WHEN_TO_RAISE.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
            Issue Details
          </h3>

          <form onSubmit={handleSubmit} noValidate>
            {/* Issue Type */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle}>Issue Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} role="radiogroup" aria-label="Issue Type">
                {ISSUE_TYPES.map(({ value, icon }) => (
                  <div
                    key={value}
                    role="radio"
                    tabIndex={0}
                    aria-checked={form.type === value}
                    className={cx('radio-card', form.type === value && 'selected')}
                    onClick={() => set('type', value)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('type', value)}
                  >
                    <i className={`ph ${icon}`} style={{ fontSize: 20, color: 'var(--text-muted)' }}></i> {value}
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle}>Priority Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }} role="radiogroup" aria-label="Priority Level">
                {PRIORITIES.map(({ value, hint, color }) => (
                  <div
                    key={value}
                    role="radio"
                    tabIndex={0}
                    aria-checked={form.priority === value}
                    className={cx('radio-card', form.priority === value && 'selected')}
                    style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                    onClick={() => set('priority', value)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('priority', value)}
                  >
                    <div style={{ fontWeight: 'bold', color }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Task */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle} htmlFor="related_task">Related Task</label>
              <select className="form-control" style={fieldStyle} value={form.relatedTask} onChange={(e) => set('relatedTask', e.target.value)} {...validation.input('relatedTask', 'related_task')}>
                <option value="">Select a task (if applicable)</option>
                {activeTasks.map((t) => (
                  <option key={t.task_id} value={t.task_id}>#{t.task_id} - {t.task_title}</option>
                ))}
              </select>
              <FieldError {...validation.errorProps('relatedTask')} />
            </div>

            {/* Title */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle} htmlFor="title">Issue Title<RequiredMark /></label>
              <input
                type="text"
                className="form-control"
                aria-required="true"
                maxLength={150}
                placeholder="Brief summary of the issue"
                style={fieldStyle}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                {...validation.input('title', 'title')}
              />
              <FieldError {...validation.errorProps('title')} />
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={labelStyle} htmlFor="description">Detailed Description<RequiredMark /></label>
              <textarea
                className="form-control"
                aria-required="true"
                maxLength={2000}
                rows={5}
                placeholder="Provide detailed information about the issue, what you've tried, and why you need escalation..."
                style={{ borderRadius: 'var(--radius-md)', padding: 16, resize: 'vertical' }}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                {...validation.input('description', 'description')}
              ></textarea>
              <FieldError {...validation.errorProps('description')} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                Include error messages, steps to reproduce...
              </span>
            </div>

            {/* Attachments (selected files are not uploaded; the original page did not send them either) */}
            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" style={labelStyle} htmlFor="attachments">Attachments Section</label>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 40, textAlign: 'center', backgroundColor: 'var(--bg-main)' }}>
                <i className="ph ph-upload-simple" style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 15 }}></i>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept={ISSUE_ATTACHMENT_EXTENSIONS.join(',')}
                  style={fieldStyle}
                  onChange={(e) => { set('attachments', Array.from(e.target.files || [])); validation.touch('attachments'); }}
                  {...validation.input('attachments', 'attachments')}
                />
                <div style={{ marginBottom: 15, color: 'var(--text-main)' }}>Drag and drop files here, or click to browse</div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>Optional. Up to 5 files, max 10MB each ({ISSUE_ATTACHMENT_EXTENSIONS.join(', ')})</div>
                <FieldError {...validation.errorProps('attachments')} />
              </div>
            </div>

            {/* Action Buttons */}
            {submitError && <div className="form-error field-error" role="alert" style={{ marginBottom: 12 }}><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{submitError}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="submit" disabled={submitting} className="btn btn-purple" style={{ padding: '14px 32px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 'var(--text-md)' }}>
                Raise Issue to Team Lead <i className="ph ph-paper-plane-right"></i>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => navigate(empPath('issues-list'))}
                style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '12px 32px', borderRadius: 'var(--radius-full)', background: 'transparent' }}
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
