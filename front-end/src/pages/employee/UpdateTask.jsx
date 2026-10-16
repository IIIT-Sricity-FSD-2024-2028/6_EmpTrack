import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FieldError from '../../components/common/FieldError';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import useFormValidation from '../../hooks/useFormValidation';
import usePageTitle from '../../hooks/usePageTitle';
import { getTasksForUser, updateTaskStatus } from '../../services/taskService';
import { updateTaskSchema } from '../../validation/formSchemas';
import BackHeading from './components/BackHeading';
import { empPath } from './employeeUtils';

const fieldStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px' };
const labelRowStyle = { fontWeight: 'var(--font-medium)', color: 'var(--text-main)' };

export default function UpdateTask() {
  usePageTitle('Update Task Progress');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('id');

  const { data: task, loading, error } = useFetch(
    async () => (await getTasksForUser(user.emp_id)).find((t) => t.task_id === taskId) ?? null,
    [user.emp_id, taskId],
  );

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('NOT_STARTED');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const validation = useFormValidation(updateTaskSchema, { progress: String(progress), status }, {
    idPrefix: 'task',
    serverFieldMap: { progress_percentage: 'progress' },
  });

  useEffect(() => {
    if (!task) return;
    setProgress(task.progress_percentage ?? 0);
    setStatus(task.status);
  }, [task]);

  const handleSlider = (e) => {
    const value = Number(e.target.value);
    setProgress(value);
    if (value === 100) setStatus('COMPLETED');
    else if (value > 0 && status === 'NOT_STARTED') setStatus('IN_PROGRESS');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validation.validateAll()) return;
    setSubmitting(true);
    try {
      await updateTaskStatus(taskId, status, progress);
    } catch (err) {
      if (!validation.setServerErrors(err)) setSubmitError(err.message || 'Failed to update the task.');
      setSubmitting(false);
      return;
    }
    navigate(empPath('tasks'));
  };

  return (
    <>
      <BackHeading to={empPath('tasks')} gap={10} as="h2">Update Task Progress</BackHeading>

      {loading && <div className="card" role="status" style={{ textAlign: 'center', padding: 40 }}>Loading task...</div>}

      {!loading && !task && (
        <div className="card">
          <div role={error ? 'alert' : undefined} style={{ textAlign: 'center', padding: 40 }}>
            {error ? `Failed to load task: ${error.message}` : 'Task Not Found.'} <Link to={empPath('tasks')}>Return</Link>
          </div>
        </div>
      )}

      {task && (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', borderRadius: 12, padding: 32 }}>
          {/* Task Info Section */}
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ margin: '0 0 12px' }}>{task.task_title}</h3>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 16 }}>{task.task_description}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              <span>Assigned to: {user.emp_name}</span><span>Priority: {task.priority}</span><span>Deadline: {task.deadline}</span><span>Status: {task.status.replaceAll('_', ' ')}</span>
            </div>
            {task.status !== 'COMPLETED' && <Link to={`${empPath('work-logs')}?id=${encodeURIComponent(task.task_id)}`} className="btn btn-purple">Log Work for This Task</Link>}
            <div
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--bg-surface)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-main)' }}>Task ID:</span> {task.task_id}{' '}
              <span style={{ margin: '0 10px', color: 'var(--border-color)' }}>|</span>{' '}
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-main)' }}>Estimated Hours:</span>{' '}
              {task.est_hours || '-'}h
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Progress Section */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={labelRowStyle}>
                  Current Progress: <span style={{ color: 'var(--primary-color)' }}>{task.progress_percentage}%</span>
                </span>
                <span style={labelRowStyle}>
                  New Progress: <span style={{ color: 'var(--primary-color)' }}>{progress}%</span>
                </span>
              </div>

              <div style={{ position: 'relative', marginBottom: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  disabled={submitting}
                  onChange={handleSlider}
                  aria-label="Task progress"
                  {...validation.input('progress', 'task_progress')}
                  style={{
                    width: '100%',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    height: 12,
                    borderRadius: 'var(--radius-full)',
                    background: '#E5E7EB',
                    outline: 'none',
                    zIndex: 2,
                    position: 'relative',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 12,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-color)',
                    width: `${progress}%`,
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <span>0%</span>
                <span>25%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Status is an explicit part of the PATCH contract; 100% requires completion. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="status_input">Status</label>
                <select className="form-control" style={fieldStyle} value={status} disabled={submitting} onChange={(e) => setStatus(e.target.value)} {...validation.input('status', 'status_input')}>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <FieldError {...validation.errorProps('status')} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 24 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(empPath('tasks'))}
                style={{ border: 'none', color: 'var(--text-muted)', fontWeight: 'var(--font-medium)' }}
              >
                Cancel
              </button>
              {submitError && <div className="form-error field-error" role="alert"><i className="ph ph-warning-circle" aria-hidden="true"></i><span>{submitError}</span></div>}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-purple"
                style={{ padding: '14px 32px', fontSize: 'var(--text-md)', display: 'flex', gap: 8, alignItems: 'center' }}
              >
                Update Progress <i className="ph ph-upload-simple" style={{ fontSize: 18 }}></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
