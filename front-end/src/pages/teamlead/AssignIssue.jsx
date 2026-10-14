import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getTeams, updateIssue } from '../../services/teamLeadService';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, tlPath, useTeamData } from './components/TeamLeadUI';
import { issueStatusBadge, nameOf, priorityBadge, teamIssues, todayKey } from './tlUtils';
import './teamlead.css';

const ISSUE_TYPES = ['Technical', 'Access Request', 'Hardware', 'HR Query', 'Interpersonal', 'Task Update', 'Other'];
const TIPS = [
  'Choose the team or person closest to the problem.',
  'Set a realistic deadline - High priority issues within 2 days.',
  'Write clear instructions and the expected outcome in the notes.',
  'Raise the priority if the issue blocks a task near its deadline.',
];

function validate(v) {
  const errors = {};
  if (!v.issueId) errors.issueId = 'Select the issue to assign.';
  if (!v.type) errors.type = 'Select the issue type.';
  if (!v.teamId) errors.teamId = 'Select a team.';
  if (v.isMyTeam && !v.assignee) errors.assignee = 'Select who will handle it.';
  if (!v.deadline) errors.deadline = 'Pick a deadline.';
  else if (v.deadline < todayKey()) errors.deadline = 'Deadline cannot be in the past.';
  if (v.notes.trim().length < 10) errors.notes = 'Add instructions (at least 10 characters).';
  return errors;
}

export default function AssignIssue() {
  usePageTitle('Assign Issue');
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { data, error, reload } = useTeamData({ tasks: false, issues: true });
  const { data: teams = [] } = useFetch(getTeams, []);
  const [form, setForm] = useState({ issueId: params.get('id') || '', type: '', teamId: '', assignee: '', priority: '', deadline: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [saving, setSaving] = useState(false);

  const members = data?.members ?? [];
  const openIssues = teamIssues(members, data?.issues ?? []).filter((i) => i.status !== 'Resolved');
  const issue = (data?.issues ?? []).find((i) => i.issue_id === form.issueId);
  const team = teams.find((t) => t.team_id === form.teamId);
  const isMyTeam = Boolean(team && team.team_lead_id === user.emp_id);

  const set = (name) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'issueId') {
        const picked = data?.issues.find((i) => i.issue_id === value);
        Object.assign(next, { type: picked?.type || '', priority: picked?.priority || '' });
      }
      if (name === 'teamId') next.assignee = '';
      return next;
    });
  };
  // Pre-fill type/priority from the issue in the URL once it has loaded.
  const values = { ...form, type: form.type || issue?.type || '', priority: form.priority || issue?.priority || 'Medium' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate({ ...values, isMyTeam });
    setErrors(found);
    setStatus(null);
    if (Object.keys(found).length) return;
    setSaving(true);
    const assignedTo = isMyTeam ? (values.assignee === user.emp_id ? user.emp_name : nameOf(members, values.assignee)) : team.team_name;
    try {
      await updateIssue(values.issueId, {
        type: values.type,
        assigned_to: assignedTo,
        assigned_team: team.team_name,
        priority: values.priority,
        deadline: values.deadline,
        assignment_notes: values.notes.trim(),
        status: 'In Progress',
      });
      setStatus({ type: 'success', message: `${values.issueId} assigned to ${assignedTo}.` });
      await reload();
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to assign the issue.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tl-page">
      <div>
        <Link to={tlPath('issue-management')} className="tl-muted"><i className="ph ph-arrow-left"></i> Back to Issue Management</Link>
      </div>
      <DemoNotice />
      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-grid-main">
          <form className="card" style={{ padding: 0, overflow: 'hidden' }} onSubmit={handleSubmit} noValidate>
            <div className="tl-banner-card">
              <h3>Assignment Form</h3>
              <p>Fill in the details to assign this issue</p>
            </div>
            <div style={{ padding: 24 }}>
              {status && (
                <div className={`tl-alert tl-alert-${status.type}`} role="alert" style={{ marginBottom: 16 }}>
                  <i className={`ph-fill ${status.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i> {status.message}
                  {status.type === 'success' && <Link to={tlPath('issue-management')} style={{ marginLeft: 'auto' }}>View all issues</Link>}
                </div>
              )}
              <Input as="select" label="Issue" value={values.issueId} error={errors.issueId} onChange={set('issueId')}>
                <option value="">Select an open issue</option>
                {openIssues.map((i) => <option key={i.issue_id} value={i.issue_id}>{i.issue_id} - {i.title}</option>)}
                {issue && !openIssues.includes(issue) && <option value={issue.issue_id}>{issue.issue_id} - {issue.title}</option>}
              </Input>
              <div className="tl-form-grid">
                <Input as="select" label="Issue Type" value={values.type} error={errors.type} onChange={set('type')}>
                  <option value="">Select type</option>
                  {[...new Set([...ISSUE_TYPES, values.type].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
                </Input>
                <Input as="select" label="Team" value={values.teamId} error={errors.teamId} onChange={set('teamId')}>
                  <option value="">Route issue to...</option>
                  {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                </Input>
                <Input as="select" label="Assignee" value={values.assignee} error={errors.assignee} onChange={set('assignee')} disabled={!isMyTeam}>
                  <option value="">{team && !isMyTeam ? `Whole team (${team.team_name})` : 'Select assignee'}</option>
                  {isMyTeam && <option value={user.emp_id}>Myself ({user.emp_name})</option>}
                  {isMyTeam && members.map((m) => <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>)}
                </Input>
                <Input as="select" label="Priority Override" value={values.priority} onChange={set('priority')}>
                  {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
                </Input>
                <Input type="date" label="Resolution Deadline" min={todayKey()} value={values.deadline} error={errors.deadline} onChange={set('deadline')} />
              </div>
              <Input as="textarea" rows={4} label="Assignment Notes" placeholder="Instructions for the assignee..." value={values.notes} error={errors.notes} onChange={set('notes')} />
              <div className="tl-form-actions">
                <Button type="submit" variant="purple" icon="ph-user-switch" disabled={saving}>{saving ? 'Saving...' : 'Assign Issue'}</Button>
                <Link to={tlPath('issue-management')} className="btn btn-outline">Cancel</Link>
              </div>
            </div>
          </form>

          <div className="tl-stack">
            <div className="card">
              <h3 className="tl-section-title">Issue Details</h3>
              {issue ? (
                <>
                  <span className="tl-id">{issue.issue_id}</span>
                  <h4 style={{ margin: '4px 0 8px' }}>{issue.title}</h4>
                  <p className="tl-muted" style={{ fontSize: 'var(--text-sm)' }}>{issue.description || 'No description provided.'}</p>
                  <div className="tl-kv"><span>Reported by</span><span>{nameOf(members, issue.emp_id)}</span></div>
                  <div className="tl-kv"><span>Related task</span><span>{issue.related_task || '-'}</span></div>
                  <div className="tl-kv"><span>Raised on</span><span>{formatDate(issue.raised_date)}</span></div>
                  <div className="tl-kv"><span>Priority</span><span><Badge variant={priorityBadge(issue.priority)}>{issue.priority}</Badge></span></div>
                  <div className="tl-kv"><span>Status</span><span><Badge variant={issueStatusBadge(issue.status)}>{issue.status}</Badge></span></div>
                  <div className="tl-kv"><span>Currently assigned</span><span>{issue.assigned_to || 'Unassigned'}</span></div>
                </>
              ) : (
                <p className="tl-muted">{form.issueId ? `Issue ${form.issueId} was not found.` : 'Select an issue to see its details.'}</p>
              )}
            </div>
            <div className="card">
              <h3 className="tl-section-title"><i className="ph-fill ph-lightbulb" style={{ color: 'var(--warning-color)' }}></i> Assignment Tips</h3>
              <ul className="tl-list">{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </div>
      </LoadState>
    </div>
  );
}
