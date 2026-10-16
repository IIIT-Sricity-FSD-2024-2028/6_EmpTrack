import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FieldError, { RequiredMark } from '../../components/common/FieldError';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { getTasksForUser } from '../../services/taskService';
import { createWorkLog, getWorkLogsForUser } from '../../services/worklogService';
import { workLogSchema } from '../../validation/formSchemas';
import useWorkTimer from './useWorkTimer';
import WorkTimer, { formatElapsed } from './WorkTimer';

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const labelStyle = { fontWeight: 'var(--font-medium)' };
const rowGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 };
const mutedSmall = { color: 'var(--text-muted)', fontSize: 12 };

const columns = [
  {
    key: 'worklog_id',
    header: 'Log ID',
    render: (l) => <span style={{ color: '#3B82F6', fontWeight: 'var(--font-semibold)' }}>#{l.worklog_id}</span>,
  },
  {
    key: 'task_id',
    header: 'Task ID',
    render: (l) => <span style={{ color: 'var(--text-main)', fontWeight: 'var(--font-medium)' }}>#{l.task_id}</span>,
  },
  {
    key: 'task_title',
    header: 'Task Title',
    cellStyle: { minWidth: 150, whiteSpace: 'normal', lineHeight: 1.4 },
    render: (l) => l.task_title || 'Generic Task',
  },
  { key: 'start_time', header: 'Start Time', cellStyle: mutedSmall, render: (l) => new Date(l.start_time).toLocaleString() },
  { key: 'end_time', header: 'End Time', cellStyle: mutedSmall, render: (l) => new Date(l.end_time).toLocaleString() },
  {
    key: 'duration', header: 'Duration',
    render: (l) => formatElapsed(l.elapsed_ms ?? (Date.parse(l.end_time) - Date.parse(l.start_time))),
  },
  {
    key: 'description',
    header: 'Description',
    cellStyle: { color: 'var(--text-muted)', fontSize: 13, maxWidth: 300, lineHeight: 1.4 },
  },
];

/** Whole hours between two datetime-local values (as the original computed it). */
function hoursBetween(start, end) {
  if (!start || !end) return '';
  const hours = Math.floor((new Date(end) - new Date(start)) / 1000 / 60 / 60);
  return Number.isNaN(hours) ? '' : hours;
}

export default function WorkLogs() {
  usePageTitle('Work Logs');
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const presetTaskId = searchParams.get('id') || '';

  const { data: tasks = [], error: taskError, reload: reloadTasks } = useFetch(
    async () => (await getTasksForUser(user.emp_id)).filter((t) => t.status !== 'COMPLETED'),
    [user.emp_id],
  );
  const { data: logs = [], error: logsError, reload: reloadLogs } = useFetch(() => getWorkLogsForUser(user.emp_id), [user.emp_id]);

  const emptyForm = { taskId: presetTaskId, start: '', end: '', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [toastVisible, setToastVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timer = useWorkTimer(async () => { await Promise.all([reloadTasks(), reloadLogs()]); });
  const validation = useFormValidation(workLogSchema(tasks.map((t) => t.task_id)), form, {
    idPrefix: 'wl',
    serverFieldMap: { task_id: 'taskId', start_time: 'start', end_time: 'end', hours_spent: 'end' },
  });

  useEffect(() => {
    setForm((f) => ({ ...f, taskId: presetTaskId }));
  }, [presetTaskId]);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timer = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const hoursSpent = hoursBetween(form.start, form.end);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validation.validateAll()) return;
    setSubmitting(true);
    const task = tasks.find((t) => t.task_id === form.taskId);
    try {
      await createWorkLog({
        emp_id: user.emp_id,
        task_id: form.taskId,
        task_title: task?.task_title,
        hours_spent: Number(hoursSpent),
        start_time: form.start,
        end_time: form.end,
        description: form.description.trim(),
      });
    } catch (err) {
      if (!validation.setServerErrors(err)) setSubmitError(err.message || 'Failed to save the work log.');
      return;
    } finally {
      setSubmitting(false);
    }
    setToastVisible(true);
    setForm(emptyForm);
    validation.reset(); // keeps the task pre-selected from the URL, like the original
    reloadLogs();
  };

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hours_spent || 0), 0);
  const metrics = [
    { label: 'Total Hours This Week', value: totalHours },
    { label: 'Total Logs this Month', value: logs.length },
    { label: 'Average Hours Per Day', value: (totalHours / (logs.length || 1)).toFixed(1) },
  ];

  if (taskError || logsError) {
    const failure = taskError || logsError;
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <WorkTimer timer={timer} tasks={tasks} />
        <div className="card" role="alert">
          Failed to load work log data: {failure.message} <button type="button" onClick={() => { reloadTasks(); reloadLogs(); }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      <WorkTimer timer={timer} tasks={tasks} showEmptyState />
      {/* SECTION 1: LOG WORK ACTIVITY */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
          Log Work Activity
        </h3>
        <form onSubmit={handleSubmit} noValidate>
          <div style={rowGrid}>
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <label className="form-label" style={labelStyle} htmlFor="wl_task_id">Task ID<RequiredMark /></label>
                  <select className="form-control" style={fieldStyle} aria-required="true" value={form.taskId} onChange={update('taskId')} {...validation.input('taskId', 'wl_task_id')}>
                    <option value="" disabled>Select assigned task</option>
                    {tasks.map((t) => (
                      <option key={t.task_id} value={t.task_id}>#{t.task_id} - {t.task_title}</option>
                    ))}
                  </select>
                </div>
                {!timer.session && (
                  <Button
                    variant="purple"
                    icon="ph-play-circle"
                    disabled={!form.taskId || timer.loading || timer.busy || Boolean(timer.error)}
                    onClick={() => timer.start(form.taskId)}
                    aria-label="Start timer for selected task"
                  >Start Timer</Button>
                )}
              </div>
              <FieldError {...validation.errorProps('taskId')} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={labelStyle} htmlFor="hours-spent-wl">Hours Spent</label>
              <input
                type="number"
                id="hours-spent-wl"
                className="form-control"
                placeholder="Enter Hours"
                min="1"
                max="24"
                style={fieldStyle}
                value={hoursSpent}
                disabled
                readOnly
              />
            </div>
          </div>

          <div style={rowGrid}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={labelStyle} htmlFor="wl_start">Work Start Time<RequiredMark /></label>
              <input type="datetime-local" className="form-control" aria-required="true" style={fieldStyle} value={form.start} onChange={update('start')} {...validation.input('start', 'wl_start')} />
              <FieldError {...validation.errorProps('start')} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={labelStyle} htmlFor="wl_end">Work End Time<RequiredMark /></label>
              <input type="datetime-local" className="form-control" aria-required="true" min={form.start || undefined} style={fieldStyle} value={form.end} onChange={update('end')} {...validation.input('end', 'wl_end')} />
              <FieldError {...validation.errorProps('end')} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={labelStyle} htmlFor="wl_desc">Work Description<RequiredMark /></label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe the work completed in this session"
              aria-required="true"
              maxLength={1000}
              {...validation.input('description', 'wl_desc')}
              style={{ borderRadius: 'var(--radius-md)', padding: 16, resize: 'vertical' }}
              value={form.description}
              onChange={update('description')}
            ></textarea>
            <FieldError {...validation.errorProps('description')} />
          </div>

          {submitError && <div className="form-error field-error" role="alert" style={{ marginBottom: 12 }}><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{submitError}</span></div>}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-purple"
            style={{
              width: '100%',
              padding: 16,
              fontSize: 'var(--text-md)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              borderRadius: 50,
              boxShadow: '0 4px 6px rgba(91, 46, 255, 0.2)',
            }}
          >
            <i className="ph ph-floppy-disk" style={{ fontSize: 20 }}></i> Save Work Log
          </button>
        </form>
      </div>

      {/* SECTION 2: PREVIOUS WORK LOGS */}
      <Table
        title="Previous Work Logs"
        columns={columns}
        data={[...logs].reverse()}
        rowKey="worklog_id"
        emptyMessage="No logs found."
      />

      {/* SECTION 3: SUMMARY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'var(--font-bold)', color: 'var(--text-main)', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 'var(--font-medium)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {toastVisible && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: '#10B981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-medium)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
          }}
        >
          Work log successfully logged!
        </div>
      )}
    </div>
  );
}
