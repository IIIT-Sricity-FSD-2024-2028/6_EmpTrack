import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { updateLeaveStatus } from '../../services/teamLeadService';
import { formatDate, toTitleCase } from '../../utils/helpers';
import { DemoNotice, LoadState, Person, Progress, StatCard, tlPath, useTeamData, useToast } from './components/TeamLeadUI';
import { buildPerformance, escalationReason, isEscalated, isOverdue, LEAVE_TYPE_LABELS, nameOf, todayKey } from './tlUtils';
import './teamlead.css';

export default function TeamLeadDashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { data, error, reload } = useTeamData({ leaves: true });
  const [busyId, setBusyId] = useState(null);
  const [toast, showToast] = useToast();

  const members = data?.members ?? [];
  const tasks = data?.tasks ?? [];
  const today = todayKey();
  const open = tasks.filter((t) => t.status !== 'COMPLETED');
  const escalated = open.filter((t) => isEscalated(t));
  const pending = (data?.leaves ?? []).filter((l) => l.status === 'PENDING');
  const performance = buildPerformance(members, tasks);

  const distribution = [
    { label: 'Completed', value: tasks.filter((t) => t.status === 'COMPLETED').length, color: 'var(--secondary-color)' },
    { label: 'In Progress', value: tasks.filter((t) => t.status === 'IN_PROGRESS').length, color: 'var(--warning-color)' },
    { label: 'Not Started', value: tasks.filter((t) => t.status === 'NOT_STARTED').length, color: 'var(--primary-color)' },
    { label: 'Overdue', value: open.filter((t) => isOverdue(t, today)).length, color: 'var(--danger-color)' },
  ];
  const maxDist = Math.max(1, ...distribution.map((d) => d.value));

  const decide = async (leave, status) => {
    setBusyId(leave.leave_id);
    try {
      await updateLeaveStatus(leave.leave_id, status, user.emp_id);
      showToast(`Leave ${status === 'APPROVED' ? 'approved' : 'rejected'} for ${nameOf(members, leave.emp_id)}`);
      await reload();
    } catch (err) {
      showToast(err.message || 'Could not update the leave request.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tl-page">
      <div className="tl-welcome-banner">
        <div>
          <h2>Welcome back, {user.emp_name.split(' ')[0]}!</h2>
          <p>Monitor your team&apos;s performance and manage tasks</p>
        </div>
        <i className="ph ph-trend-up" style={{ fontSize: 40 }} aria-hidden="true"></i>
      </div>
      <DemoNotice />

      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-users" tone="blue" label="Team Members" value={members.length} />
          <StatCard icon="ph-clipboard-text" tone="orange" label="Active Tasks" value={open.length} />
          <StatCard icon="ph-warning" tone="red" label="Escalations" value={escalated.length} />
          <StatCard icon="ph-check-circle" tone="green" label="Completed Today" value={tasks.filter((t) => t.completed_at === today).length} />
        </div>

        <div className="tl-grid-main">
          <div className="tl-card">
            <h3 className="tl-card-title">Team Progress Overview</h3>
            {performance.length === 0 && <p className="tl-muted">No team members yet.</p>}
            {performance.map((p) => (
              <div key={p.emp_id} className="tl-progress-item">
                <div className="tl-progress-header">
                  <span className="tl-progress-name">{p.name}</span>
                </div>
                <div className="tl-progress-desc">{p.completed} completed &bull; {p.inProgress} in progress</div>
                <Progress value={p.productivity} />
              </div>
            ))}
          </div>

          <div className="tl-card">
            <h3 className="tl-card-title">
              <i className="ph ph-warning text-red"></i> Escalated Issues
            </h3>
            {escalated.length === 0 && <p className="tl-muted">No tasks are escalated. Nice work!</p>}
            {escalated.slice(0, 4).map((t) => (
              <div key={t.task_id} className="tl-issue-card">
                <div className="tl-issue-header">
                  <span className="tl-issue-title">{nameOf(members, t.assigned_to)}</span>
                  <span className="text-red tl-strong">{t.progress_percentage}%</span>
                </div>
                <div className="tl-issue-desc">Task: {t.task_id} &bull; {escalationReason(t)}</div>
                <Link to={tlPath('escalations')} className="btn btn-danger tl-btn-sm">Take Action</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="tl-grid-2">
          <div className="tl-card">
            <h3 className="tl-card-title">Task Distribution</h3>
            {distribution.map((d) => (
              <div key={d.label} className="tl-dist-row">
                <span>{d.label}</span>
                <div className="tl-progress-bar-bg">
                  <div className="tl-progress-bar-fill" style={{ width: `${(d.value / maxDist) * 100}%`, background: d.color }}></div>
                </div>
                <strong>{d.value}</strong>
              </div>
            ))}
          </div>

          <div className="tl-card">
            <h3 className="tl-card-title">Pending Approvals</h3>
            {pending.length === 0 && <p className="tl-muted">No pending approvals at this time.</p>}
            {pending.map((l) => (
              <div key={l.leave_id} className="tl-approval-card">
                <div className="tl-progress-header">
                  <strong>{nameOf(members, l.emp_id)}</strong>
                  <span className="badge-pending">Pending</span>
                </div>
                <div className="tl-muted" style={{ marginBottom: 12 }}>
                  {LEAVE_TYPE_LABELS[l.leave_type] || toTitleCase(l.leave_type)} &bull; {formatDate(l.start_date)}
                  {l.end_date !== l.start_date && ` - ${formatDate(l.end_date)}`}
                </div>
                <div className="tl-actions">
                  <Button variant="secondary" className="tl-btn-sm" disabled={busyId === l.leave_id} onClick={() => decide(l, 'APPROVED')}>Approve</Button>
                  <Button variant="danger" className="tl-btn-sm" disabled={busyId === l.leave_id} onClick={() => decide(l, 'REJECTED')}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Table
          title="My Team"
          rowKey="emp_id"
          data={members}
          emptyMessage="No employees assigned to your team yet."
          columns={[
            { key: 'emp_name', header: 'Employee', render: (m) => <Person name={m.emp_name} sub={m.emp_id} /> },
            { key: 'email', header: 'Email' },
            { key: 'status', header: 'Status', render: (m) => <Badge variant={m.status === 'ACTIVE' ? 'success' : 'gray'}>{toTitleCase(m.status)}</Badge> },
          ]}
        />
      </LoadState>
      {toast}
    </div>
  );
}
