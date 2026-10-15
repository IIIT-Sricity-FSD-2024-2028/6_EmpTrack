import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import config from '../config/config';
import * as authService from '../services/authService';
import { SESSION_EXPIRED_EVENT } from '../services/api';
import { resetState } from '../store/store';
import { STORAGE_KEYS } from '../utils/constants';
import { hasRole as roleAllowed } from '../utils/permissions';

export const AuthContext = createContext(null);

// setTimeout's maximum delay (~24.8 days); longer waits would fire immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function sameSession(a, b) {
  return (
    a?.token === b?.token &&
    a?.expiresAt === b?.expiresAt &&
    a?.user?.emp_id === b?.user?.emp_id &&
    a?.user?.role === b?.user?.role
  );
}

export function AuthProvider({ children }) {
  // Restore a persisted session synchronously so protected routes
  // don't flash a redirect to /login on refresh.
  const [session, setSession] = useState(() => authService.getStoredSession());
  // A token restored from storage is checked with the backend (GET /auth/me)
  // before any protected page renders - it may have been revoked or lost.
  const [isVerifying, setIsVerifying] = useState(() => Boolean(session?.token) && !config.useMockAuth);

  // Re-reads the stored session (getStoredSession also drops expired ones).
  // localStorage is shared by every tab, and every API call sends whatever token
  // is stored there, so the UI must follow it.
  const syncFromStorage = useCallback(() => {
    const stored = authService.getStoredSession();
    setSession((current) => (sameSession(current, stored) ? current : stored));
  }, []);

  const login = useCallback(async (email, password) => {
    const newSession = await authService.login(email, password);
    setSession(newSession);
    return newSession.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    resetState();
    setSession(null);
  }, []);

  // The API client already cleared storage; drop the in-memory session too so
  // ProtectedRoute sends the user back to /login.
  useEffect(() => {
    const onExpired = () => {
      resetState();
      setSession(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!isVerifying) return undefined;
    let active = true;
    authService
      .verifySession()
      .then((verified) => {
        if (active) setSession(verified);
      })
      .catch(() => {
        // A 401 already cleared the session (SESSION_EXPIRED_EVENT). On a network
        // error keep it: the backend still checks the token on every request.
      })
      .finally(() => {
        if (active) setIsVerifying(false);
      });
    return () => {
      active = false;
    };
    // Only for the session restored at start-up; later logins come from the server.
  }, []);

  // Follow logins/logouts in other tabs (`storage`), and re-check when a page is
  // restored from the back/forward cache or the tab becomes active again - this
  // copy of the app may have missed events while frozen or in the background.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.AUTH || event.key === null) syncFromStorage();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromStorage();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncFromStorage]);

  // End the session in the UI when it expires, not only on the next API call.
  const expiresAt = session?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return undefined;
    const delay = Math.min(Math.max(expiresAt - Date.now() + 1, 0), MAX_TIMEOUT_MS);
    const timer = setTimeout(syncFromStorage, delay);
    return () => clearTimeout(timer);
  }, [expiresAt, syncFromStorage]);

  const user = session?.user ?? null;

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isVerifying,
      login,
      logout,
      hasRole: (allowedRoles) => roleAllowed(user?.role, allowedRoles),
    }),
    [user, isVerifying, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
