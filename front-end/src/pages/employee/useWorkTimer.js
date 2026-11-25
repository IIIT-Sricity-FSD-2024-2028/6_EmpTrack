import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { confirmSession, fetchActiveSession, startSession, stopSession } from '../../store/workSessionSlice';

/** The employee's work timer, read from the Redux workSession slice. Actions resolve to true on backend success. */
export default function useWorkTimer(onSaved) {
  const dispatch = useDispatch();
  const { session, loading, busy, error, message } = useSelector((s) => s.workSession);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const refresh = useCallback(() => dispatch(fetchActiveSession()), [dispatch]);
  useEffect(() => { refresh(); }, [refresh]);

  const ok = (action) => !action.error;
  const start = async (taskId) => ok(await dispatch(startSession(taskId)));
  const stop = async () => Boolean(session) && ok(await dispatch(stopSession(session.session_id)));
  const confirm = async (description) => {
    if (!session) return false;
    if (!ok(await dispatch(confirmSession({ sessionId: session.session_id, description })))) return false;
    await onSavedRef.current?.();
    return true;
  };

  return { session, loading, busy, error, message, start, stop, confirm, refresh };
}
