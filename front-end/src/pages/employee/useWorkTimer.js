import { useCallback, useEffect, useRef, useState } from 'react';
import {
  confirmWorkSession,
  getActiveWorkSession,
  startWorkSession,
  stopWorkSession,
} from '../../services/worklogService';

export default function useWorkTimer(onSaved) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSession(await getActiveWorkSession());
    } catch (err) {
      setError(err.message || 'Could not load your active work session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const start = async (taskId) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setSession(await startWorkSession(taskId));
      setMessage('Work timer started.');
      return true;
    } catch (err) {
      setError(err.message || 'Could not start the work timer.');
      return false;
    } finally { setBusy(false); }
  };

  const stop = async () => {
    if (!session) return false;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setSession(await stopWorkSession(session.session_id));
      setMessage('Timer stopped. Add a short summary to save this work log.');
      return true;
    } catch (err) {
      setError(err.message || 'Could not stop the work timer.');
      return false;
    } finally { setBusy(false); }
  };

  const confirm = async (description) => {
    if (!session) return false;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await confirmWorkSession(session.session_id, description);
      setSession(null);
      setMessage('Work log saved.');
      await onSavedRef.current?.();
      return true;
    } catch (err) {
      setError(err.message || 'Could not save the work log.');
      return false;
    } finally { setBusy(false); }
  };

  return { session, loading, busy, error, message, start, stop, confirm, refresh };
}
