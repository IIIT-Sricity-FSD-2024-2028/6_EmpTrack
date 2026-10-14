import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import usePageTitle from '../../hooks/usePageTitle';
import { CAN_EDIT_ASSIGNMENT, reassignTask, sendNotification, updateTask } from '../../services/teamLeadService';
import { formatDate } from '../../utils/helpers';
import { DemoNotice, LoadState, Person, Progress, StatCard, tlPath, useTeamData, useToast } from './components/TeamLeadUI';
import { escalationReason, isEscalated, isOverdue, nameOf, todayKey } from './tlUtils';
import './teamlead.css';

const TITLES = { warn: 'Send Warning', extend: 'Extend Deadline', reassign: 'Reassign Task' };

export default function Escalations() {
  usePageTitle('Escalation Management');
  const { data, error, reload } = useTeamData();
  const [action, setAction] = useState(null); // { kind, task }
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const members = data?.members ?? [];
  const today = todayKey();
  const escalated = (data?.tasks ?? []).filter((t) => isEscalated(t, today));
  const overdueDays = escalated.filter((t) => isOverdue(t, today)).map((t) => (new Date(today) - new Date(t.deadline)) / 86400000);
  const avgDelay = overdueDays.length ? (overdueDays.reduce((s, d) => s + d, 0) / overdueDays.length).toFixed(1) : '0';
  const avgProgress = escalated.length ? Math.round(escalated.reduce((s, t) => s + Number(t.progress_percentage || 0), 0) / escalated.length) : 0;

  const open = (kind, task) => {
    setFieldError('');
    setValue(
      kind === 'warn'
        ? `Hi ${nameOf(members, task.assigned_to).split(' ')[0]}, task ${task.task_id} (${task.task_title}) is at ${task.progress_percentage}% after ${task.hours_worked ?? 0}h of ${task.est_hours}h. Please update your progress or flag any blockers today.`
        : '',
    );
    setAction({ kind, task });
  };

  const submit = async () => {
    const { kind, task } = action;
    let run;
    let success;
    if (kind === 'warn') {
      if (value.trim().length < 10) return setFieldError('Write a message of at least 10 characters.');
      run = () => sendNotification(task.assigned_to, value.trim(), 'warning');
      success = `Warning sent to ${nameOf(members, task.assigned_to)}`;
    } else if (kind === 'extend') {
      if (!value) return setFieldError('Pick the new deadline.');
      if (value <= (task.deadline || '') || value < today) return setFieldError('The new deadline must be later than the current one and not in the past.');
      run = () => updateTask(task.task_id, { deadline: value });
      success = `${task.task_id} deadline moved to ${formatDate(value)}`;
    } else {
      if (!value) return setFieldError('Select a team member.');
      run = () => reassignTask(task.task_id, value);
      success = `${task.task_id} reassigned to ${nameOf(members, value)}`;
    }
    setSaving(true);
    try {
      await run();
      showToast(success);
      setAction(null);
      await reload();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <div className="tl-page">
      <div className="tl-actions" style={{ justifyContent: 'flex-end' }}>
        <Link to={`${tlPath('employee-raised-issues')}?tab=issues`} className="btn btn-outline">Employee Raised Issues</Link>
        <Link to={tlPath('escalate-to-hr')} className="btn btn-primary"><i className="ph ph-arrow-up"></i> Escalate to HR</Link>
      </div>
      <DemoNotice />

      <div className="tl-criteria">
        <i className="ph ph-warning-circle" aria-hidden="true"></i>
        <div>
          <h3>Escalation Criteria</h3>
          <p>An open task is escalated automatically when its <strong>progress is below 50%</strong> and either <strong>half of the estimated hours are used</strong> or the <strong>deadline has passed</strong>.</p>
          <p style={{ marginTop: 4, opacity: 0.85 }}>Hours used % = (Hours Spent / Estimated Hours) &times; 100</p>
        </div>
      </div>

      <LoadState loading={!data} error={error} onRetry={reload}>
        <div className="tl-stats-grid">
          <StatCard icon="ph-warning" tone="red" label="Total Escalations" value={escalated.length} />
          <StatCard icon="ph-clock" tone="orange" label="Avg. Delay (overdue)" value={`${avgDelay} days`} />
          <StatCard icon="ph-user-minus" label="Employees" value={new Set(escalated.map((t) => t.assigned_to)).size} />
          <StatCard icon="ph-chart-bar" tone="green" label="Avg. Progress" value={`${avgProgress}%`} />
        </div>

        <Table
          title="Escalated Tasks"
          rowKey="task_id"
          data={escalated}
          emptyMessage="No tasks meet the escalation criteria."
          columns={[
            { key: 'emp', header: 'Employee', render: (t) => <Person name={nameOf(members, t.assigned_to)} /> },
            { key: 'task_id', header: 'Task ID', render: (t) => <span className="tl-id">{t.task_id}</span> },
            { key: 'task_title', header: 'Task Title' },
            { key: 'progress', header: 'Progress %', render: (t) => <Progress value={Number(t.progress_percentage || 0)} /> },
            { key: 'hours', header: 'Hours Spent', render: (t) => `${t.hours_worked ?? 0}h` },
            { key: 'est', header: 'Estimated', render: (t) => `${t.est_hours ?? '-'}h` },
            { key: 'reason', header: 'Reason', render: (t) => (
              <div>
                <div>{escalationReason(t, today)}</div>
                <div className="tl-muted">Due {formatDate(t.deadline)}</div>
              </div>
            ) },
            { key: 'actions', header: 'Actions', render: (t) => (
              <div className="tl-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Button variant="orange" className="tl-btn-sm" onClick={() => open('warn', t)}>Send Warning</Button>
                <Button variant="primary" className="tl-btn-sm" onClick={() => open('extend', t)}>Extend Deadline</Button>
                <Button
                  variant="purple"
                  className="tl-btn-sm"
                  disabled={!CAN_EDIT_ASSIGNMENT}
                  title={CAN_EDIT_ASSIGNMENT ? undefined : 'The backend cannot reassign tasks yet'}
                  onClick={() => open('reassign', t)}
                >
                  Reassign Task
                </Button>
              </div>
            ) },
          ]}
        />
      </LoadState>

      <Modal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        title={action ? `${TITLES[action.kind]} - ${action.task.task_id}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button disabled={saving} onClick={submit}>{saving ? 'Saving...' : TITLES[action?.kind]}</Button>
          </>
        }
      >
        {action?.kind === 'warn' && (
          <Input as="textarea" rows={5} label={`Message to ${nameOf(members, action.task.assigned_to)}`} value={value} error={fieldError} onChange={(e) => setValue(e.target.value)} />
        )}
        {action?.kind === 'extend' && (
          <Input type="date" label={`New deadline (currently ${formatDate(action.task.deadline)})`} min={today} value={value} error={fieldError} onChange={(e) => setValue(e.target.value)} />
        )}
        {action?.kind === 'reassign' && (
          <Input as="select" label={`Reassign from ${nameOf(members, action.task.assigned_to)} to`} value={value} error={fieldError} onChange={(e) => setValue(e.target.value)}>
            <option value="">Select team member</option>
            {members.filter((m) => m.emp_id !== action.task.assigned_to).map((m) => <option key={m.emp_id} value={m.emp_id}>{m.emp_name}</option>)}
          </Input>
        )}
      </Modal>
      {toast}
    </div>
  );
}
