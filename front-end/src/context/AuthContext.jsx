// Session side effects. The session itself lives in the Redux auth slice
// (store/authSlice.js); this component keeps it in step with the backend,
// localStorage and the clock. Must be rendered inside the Redux <Provider>.
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as authService from '../services/authService';
import { SESSION_EXPIRED_EVENT } from '../services/api';
import { sessionExpired, sessionSynced, verifySession } from '../store/authSlice';
import { STORAGE_KEYS } from '../utils/constants';

// setTimeout's maximum delay (~24.8 days); longer waits would fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const isVerifying = useSelector((s) => s.auth.isVerifying);
  const expiresAt = useSelector((s) => s.auth.session?.expiresAt);

  // A token restored from storage is checked with GET /auth/me before any
  // protected page renders (ProtectedRoute waits for isVerifying).
  useEffect(() => {
    if (isVerifying) dispatch(verifySession());
    // Only for the session restored at start-up; later logins come from the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The API client already cleared storage on a 401; drop the session in Redux too.
  useEffect(() => {
    const onExpired = () => dispatch(sessionExpired());
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [dispatch]);

  // localStorage is shared by every tab and every API call sends the token stored
  // there, so follow logins/logouts in other tabs and re-check after bfcache
  // restores or when the tab becomes active again.
  useEffect(() => {
    const sync = () => dispatch(sessionSynced(authService.getStoredSession()));
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.AUTH || event.key === null) sync();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch]);

  // End the session in the UI when it expires, not only on the next API call.
  useEffect(() => {
    if (!expiresAt) return undefined;
    const delay = Math.min(Math.max(expiresAt - Date.now() + 1, 0), MAX_TIMEOUT_MS);
    const timer = setTimeout(() => dispatch(sessionSynced(authService.getStoredSession())), delay);
    return () => clearTimeout(timer);
  }, [expiresAt, dispatch]);

  return children;
}
