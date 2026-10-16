import { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useFormValidation from '../../hooks/useFormValidation';
import { workSessionDescriptionSchema } from '../../validation/formSchemas';

export function formatElapsed(ms) {
  const value = Number(ms || 0);
  const total = Number.isFinite(value) ? Math.max(0, Math.floor(value / 1000)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function DescriptionForm({ timer }) {
  const [description, setDescription] = useState('');
  const values = { description };
  const validation = useFormValidation(workSessionDescriptionSchema, values, { idPrefix: 'timer-confirm' });

  const submit = async (event) => {
    event.preventDefault();
    if (!validation.validateAll()) return;
    if (await timer.confirm(description.trim())) {
      setDescription('');
      validation.reset();
    }
  };

  return (
    <form onSubmit={submit} noValidate style={{ marginTop: 16 }}>
      <Input
        as="textarea" rows={3} label="Work summary" maxLength={1000}
        placeholder="Briefly describe what you completed during this session"
        {...validation.field('description', 'timer-confirm-description')}
        value={description} onChange={(event) => setDescription(event.target.value)}
      />
      <Button type="submit" disabled={timer.busy} icon="ph-floppy-disk">
        {timer.busy ? 'Saving...' : 'Save Timer Work Log'}
      </Button>
    </form>
  );
}

export default function WorkTimer({ timer, tasks = [], showIdle = false, showEmptyState = false }) {
  const [tick, setTick] = useState(Date.now());
  const [anchor, setAnchor] = useState({ sessionId: null, receivedAt: Date.now(), elapsedMs: 0 });
  const [taskId, setTaskId] = useState('');
  useEffect(() => {
    if (timer.session?.status !== 'ACTIVE') return undefined;
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer.session?.session_id, timer.session?.status]);
  useEffect(() => {
    if (timer.session?.status === 'ACTIVE') {
      setAnchor({ sessionId: timer.session.session_id, receivedAt: Date.now(), elapsedMs: Number(timer.session.elapsed_ms || 0) });
      setTick(Date.now());
    }
  }, [timer.session?.session_id, timer.session?.status, timer.session?.elapsed_ms]);

  const session = timer.session;
  const task = tasks.find((item) => item.task_id === session?.task_id);
  const elapsedMs = session?.status === 'ACTIVE'
    ? anchor.sessionId === session.session_id
      ? anchor.elapsedMs + Math.max(0, tick - anchor.receivedAt)
      : Math.max(0, tick - Date.parse(session.start_time))
    : Number(session?.elapsed_ms || 0);

  if (timer.loading && !session) return <div className="card" role="status">Checking for an active work timer...</div>;
  if (!session && !showIdle && !showEmptyState && !timer.error && !timer.message) return null;

  return (
    <section className="card" aria-label="Work timer" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>{session ? 'Work session' : 'Work timer'}</h3>
      {timer.error && <div className="form-error field-error" role="alert">{timer.error}</div>}
      {timer.message && <div role="status" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{timer.message}</div>}
      {timer.loading && <div role="status">Refreshing session status...</div>}
      {!session && showEmptyState && !timer.loading && !timer.error && !timer.message && (
        <p role="status" style={{ color: 'var(--text-muted)', margin: 0 }}>
          No active work session. Start a timer from Assigned Tasks when you begin working.
        </p>
      )}
      {session && (
        <>
          <p style={{ margin: '0 0 8px' }}><strong>Task:</strong> {session.task_title || task?.task_title || session.task_id} ({session.task_id})</p>
          <p style={{ margin: '0 0 8px' }}><strong>Started:</strong> {formatTime(session.start_time)}</p>
          {session.status === 'ACTIVE' ? (
            <>
              <p role="timer" aria-label={`Elapsed time ${formatElapsed(elapsedMs)}`} aria-live="off" style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums', margin: '8px 0 14px' }}>
                {formatElapsed(elapsedMs)}
              </p>
              {elapsedMs > 12 * 60 * 60 * 1000 && <p role="status">This timer has been running for over 12 hours. Check that it is still needed; it has not been stopped.</p>}
              <Button variant="orange" disabled={timer.busy} onClick={timer.stop} icon="ph-stop-circle">
                {timer.busy ? 'Stopping...' : 'Stop Timer'}
              </Button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 8px' }}><strong>Stopped:</strong> {formatTime(session.stop_time)}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Recorded duration:</strong> {formatElapsed(elapsedMs)}</p>
              <DescriptionForm timer={timer} />
            </>
          )}
        </>
      )}
      {!session && showIdle && !timer.loading && !timer.error && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <Input as="select" label="Task" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
            <option value="">Choose an assigned task</option>
            {tasks.filter((item) => item.status !== 'COMPLETED').map((item) => (
              <option key={item.task_id} value={item.task_id}>{item.task_title} ({item.task_id})</option>
            ))}
          </Input>
          <Button disabled={timer.busy || !taskId} onClick={() => timer.start(taskId)} icon="ph-play-circle">
            {timer.busy ? 'Starting...' : 'Start Work'}
          </Button>
        </div>
      )}
      {timer.error && !timer.session && <Button variant="outline" onClick={timer.refresh}>Retry</Button>}
    </section>
  );
}
