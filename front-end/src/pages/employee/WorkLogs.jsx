import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Table from '../../components/common/Table';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getTasksForUser } from '../../services/taskService';
import { createWorkLog, getWorkLogsForUser } from '../../services/worklogService';

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
  { key: 'start_time', header: 'Start Time', cellStyle: mutedSmall, render: (l) => l.start_time.replace('T', ' ') },
  { key: 'end_time', header: 'End Time', cellStyle: mutedSmall, render: (l) => l.end_time.replace('T', ' ') },
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

  const { data: tasks = [] } = useFetch(
    async () => (await getTasksForUser(user.emp_id)).filter((t) => t.status !== 'COMPLETED'),
    [user.emp_id],
  );
  const { data: logs = [], reload: reloadLogs } = useFetch(() => getWorkLogsForUser(user.emp_id), [user.emp_id]);

  const emptyForm = { taskId: presetTaskId, start: '', end: '', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [toastVisible, setToastVisible] = useState(false);

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
    if (new Date(form.end) <= new Date(form.start)) {
      window.alert('Error: Work End Time must be strictly greater than Work Start Time.');
      return;
    }
    const task = tasks.find((t) => t.task_id === form.taskId);
    await createWorkLog({
      emp_id: user.emp_id,
      task_id: form.taskId,
      task_title: task?.task_title,
      hours_spent: Number(hoursSpent),
      start_time: form.start,
      end_time: form.end,
      description: form.description,
    });
    setToastVisible(true);
    setForm(emptyForm); // keeps the task pre-selected from the URL, like the original
    reloadLogs();
  };

  const totalHours = logs.reduce((sum, l) => sum + parseInt(l.hours_spent || 0, 10), 0);
  const metrics = [
    { label: 'Total Hours This Week', value: totalHours },
    { label: 'Total Logs this Month', value: logs.length },
    { label: 'Average Hours Per Day', value: (totalHours / (logs.length || 1)).toFixed(1) },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      {/* SECTION 1: LOG WORK ACTIVITY */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
          Log Work Activity
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={rowGrid}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={labelStyle} htmlFor="wl_task_id">Task ID</label>
              <select id="wl_task_id" className="form-control" style={fieldStyle} required value={form.taskId} onChange={update('taskId')}>
                <option value="" disabled>Select assigned task</option>
                {tasks.map((t) => (
                  <option key={t.task_id} value={t.task_id}>#{t.task_id} - {t.task_title}</option>
                ))}
              </select>
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
              <label className="form-label" style={labelStyle} htmlFor="wl_start">Work Start Time</label>
              <input type="datetime-local" id="wl_start" className="form-control" required style={fieldStyle} value={form.start} onChange={update('start')} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={labelStyle} htmlFor="wl_end">Work End Time</label>
              <input type="datetime-local" id="wl_end" className="form-control" required style={fieldStyle} value={form.end} onChange={update('end')} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={labelStyle} htmlFor="wl_desc">Work Description</label>
            <textarea
              id="wl_desc"
              className="form-control"
              rows={4}
              placeholder="Describe the work completed in this session"
              required
              style={{ borderRadius: 'var(--radius-md)', padding: 16, resize: 'vertical' }}
              value={form.description}
              onChange={update('description')}
            ></textarea>
          </div>

          <button
            type="submit"
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
