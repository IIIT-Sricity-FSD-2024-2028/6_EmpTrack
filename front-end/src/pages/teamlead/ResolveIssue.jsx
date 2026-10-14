import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { updateIssue } from '../../services/teamLeadService';
import { cx, formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, tlPath, useTeamData } from './components/TeamLeadUI';
import { issueStatusBadge, nameOf, priorityBadge, resolutionStats, teamIssues, todayKey } from './tlUtils';
import './teamlead.css';

const RESOLUTION_TYPES = ['Bug Fix', 'Configuration Change', 'Workaround Provided', 'Access Granted', 'Training / User Error', 'Policy Clarification', 'Not an Issue'];
const MAX_FILE_MB = 5;
const EMPTY = { type: '', hours: '', rootCause: '', actions: '', preventive: '', followUp: false };

function validate(v, issueId) {
  const errors = {};
  if (!issueId) errors.issueId = 'Select the issue to resolve.';
  if (!v.type) errors.type = 'Select how it was resolved.';
  const hours = Number(v.hours);
  if (!(hours > 0) || hours > 200) errors.hours = 'Enter the time spent (0.5 - 200 hours).';
  if (v.rootCause.trim().length < 10) errors.rootCause = 'Describe the root cause (at least 10 characters).';
  if (v.actions.trim().length < 10) errors.actions = 'Describe the actions taken (at least 10 characters).';
  return errors;
}

export default function ResolveIssue() {
  usePageTitle('Resolve Issue');
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { data, error, reload } = useTeamData({ tasks: false, issues: true });
  const [issueId, setIssueId] = useState(params.get('id') || '');
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const members = data?.members ?? [];
  const issues = teamIssues(members, data?.issues ?? []);
  const issue = (data?.issues ?? []).find((i) => i.issue_id === issueId);
  const stats = resolutionStats(issues);
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addFiles = (list) => {
    const all = Array.from(list);
    const ok = all.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    setFileError(ok.length < all.length ? `Files over ${MAX_FILE_MB} MB were skipped.` : '');
    setFiles((current) => [...current, ...ok]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form, issueId);
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await updateIssue(issueId, {
        status: 'Resolved',
        resolved_date: todayKey(),
        resolution: {
          type: form.type,
          time_spent: Number(form.hours),
          root_cause: form.rootCause.trim(),
          actions_taken: form.actions.trim(),
          preventive_measures: form.preventive.trim(),
          followup_required: form.followUp,
          // ponytail: only file names are recorded; upload them once the backend has an attachments endpoint for issues.
          evidence: files.map((f) => f.name),
          resolved_by: user.emp_id,
        },
      });
      setStatus({ type: 'success', message: `${issueId} marked as resolved.` });
      setForm(EMPTY);
      setFiles([]);
      await reload();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to resolve the issue.' });
    } finally {
      setSaving(false);
    }
  };

  const daysOpen = issue?.raised_date ? Math.max(0, Math.floor((Date.now() - new Date(issue.raised_date)) / 86400000)) : null;

  return (
    <div className="tl-page">
      <div>
        <Link to={tlPath('issue-management')} className="tl-muted"><i className="ph ph-arrow-left"></i> Back to Issue Management</Link>
      </div>
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-grid-main">
          <div className="tl-stack">
            <div className="card">
              <Input as="select" label="Issue" value={issueId} error={errors.issueId} onChange={(e) => setIssueId(e.target.value)}>
                <option value="">Select an issue</option>
                {issues.map((i) => (
                  <option key={i.issue_id} value={i.issue_id}>{i.issue_id} - {i.title} ({i.status})</option>
                ))}
              </Input>
              {issue && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{issue.title}</h3>
                    <Badge variant={issueStatusBadge(issue.status)}>{issue.status}</Badge>
                  </div>
                  <p className="tl-muted" style={{ fontSize: 'var(--text-sm)' }}>{issue.description || 'No description provided.'}</p>
                  <div className="tl-form-grid">
                    <div className="tl-kv"><span>Reported by</span><span>{nameOf(members, issue.emp_id)}</span></div>
                    <div className="tl-kv"><span>Priority</span><span><Badge variant={priorityBadge(issue.priority)}>{issue.priority}</Badge></span></div>
                    <div className="tl-kv"><span>Assigned to</span><span>{issue.assigned_to || 'Unassigned'}</span></div>
                    <div className="tl-kv"><span>Deadline</span><span>{formatDate(issue.deadline) || 'Not set'}</span></div>
                    <div className="tl-kv"><span>Open for</span><span>{daysOpen === null ? '-' : `${daysOpen} day${daysOpen === 1 ? '' : 's'}`}</span></div>
                  </div>
                  {issue.assignment_notes && <p className="tl-muted"><i className="ph ph-note-pencil"></i> {issue.assignment_notes}</p>}
                </>
              )}
            </div>

            <form className="card" style={{ padding: 0, overflow: 'hidden' }} onSubmit={handleSubmit} noValidate>
              <div className="tl-banner-card" style={{ background: 'linear-gradient(to right, var(--secondary-color), var(--secondary-hover))' }}>
                <h3>Resolution Form</h3>
                <p>Document the fix so the issue is closed cleanly</p>
              </div>
              <div style={{ padding: 24 }}>
                {status && (
                  <div className={`tl-alert tl-alert-${status.type}`} role="alert" style={{ marginBottom: 16 }}>
                    <i className={`ph-fill ${status.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i> {status.message}
                  </div>
                )}
                {issue?.status === 'Resolved' && !status && (
                  <div className="tl-alert tl-alert-success" style={{ marginBottom: 16 }}>
                    <i className="ph-fill ph-check-circle"></i> This issue is already resolved.
                  </div>
                )}
                <div className="tl-form-grid">
                  <Input as="select" label="Resolution Type" value={form.type} error={errors.type} onChange={set('type')}>
                    <option value="">Select how it was resolved</option>
                    {RESOLUTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </Input>
                  <Input type="number" min="0.5" step="0.5" label="Time Spent (hours)" placeholder="e.g. 2.5" value={form.hours} error={errors.hours} onChange={set('hours')} />
                </div>
                <Input as="textarea" rows={2} label="Root Cause" placeholder="Why did this happen?" value={form.rootCause} error={errors.rootCause} onChange={set('rootCause')} />
                <Input as="textarea" rows={3} label="Actions Taken" placeholder="Step by step, what was done" value={form.actions} error={errors.actions} onChange={set('actions')} />
                <Input as="textarea" rows={2} label="Preventive Measures (optional)" placeholder="How do we avoid this next time?" value={form.preventive} onChange={set('preventive')} />

                <div className="form-group">
                  <span className="form-label">Supporting Evidence (optional)</span>
                  <div
                    className={cx('tl-dropzone', dragging && 'is-dragging')}
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInput.current.click()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileInput.current.click())}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                  >
                    <i className="ph ph-upload-simple" style={{ fontSize: 28 }}></i>
                    <div>Click to upload or drag &amp; drop</div>
                    <div className="tl-muted">Logs, screenshots or diffs (max {MAX_FILE_MB} MB each)</div>
                  </div>
                  <input ref={fileInput} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                  {fileError && <div className="form-error" style={{ display: 'block' }}>{fileError}</div>}
                  {files.map((f, index) => (
                    <div key={`${f.name}-${index}`} className="tl-file">
                      <span><i className="ph-fill ph-file-text"></i> {f.name} <span className="tl-muted">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                      <button type="button" className="tl-icon-btn danger" aria-label={`Remove ${f.name}`} onClick={() => setFiles((list) => list.filter((_, i) => i !== index))}>
                        <i className="ph ph-x"></i>
                      </button>
                    </div>
                  ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <input type="checkbox" checked={form.followUp} onChange={set('followUp')} /> Follow-up required with the reporter
                </label>
                <div className="tl-form-actions">
                  <Button type="submit" variant="secondary" icon="ph-check-square-offset" disabled={saving || issue?.status === 'Resolved'}>
                    {saving ? 'Saving...' : 'Mark as Resolved'}
                  </Button>
                  <Link to={tlPath('issue-management')} className="btn btn-outline">Cancel</Link>
                </div>
              </div>
            </form>
          </div>

          <div className="tl-stack">
            <div className="card">
              <h3 className="tl-section-title">Team Resolution Stats</h3>
              <div className="tl-kv"><span>Resolved this month</span><span className="text-success">{stats.resolvedThisMonth}</span></div>
              <div className="tl-kv"><span>Avg. resolution time</span><span>{stats.avgDays === null ? '-' : `${stats.avgDays.toFixed(1)} days`}</span></div>
              <div className="tl-kv"><span>Resolution rate</span><span>{stats.rate}%</span></div>
              <div className="tl-kv"><span>Open issues</span><span>{issues.filter((i) => i.status !== 'Resolved').length}</span></div>
            </div>
            <div className="card">
              <h3 className="tl-section-title"><i className="ph-fill ph-info" style={{ color: 'var(--primary-color)' }}></i> Best Practices</h3>
              <ul className="tl-list">
                <li><strong>Document thoroughly:</strong> every step keeps the fix traceable.</li>
                <li><strong>Find the root cause:</strong> fix the cause, not just the symptom.</li>
                <li><strong>Prevent repeats:</strong> suggest measures for the whole team.</li>
              </ul>
            </div>
          </div>
        </div>
      </LoadState>
    </div>
  );
}
