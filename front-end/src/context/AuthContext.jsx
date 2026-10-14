import { createContext, useCallback, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { resetState } from '../store/store';
import { hasRole as roleAllowed } from '../utils/permissions';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore a persisted session synchronously so protected routes
  // don't flash a redirect to /login on refresh.
  const [session, setSession] = useState(() => authService.getStoredSession());

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

  const user = session?.user ?? null;

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      login,
      logout,
      hasRole: (allowedRoles) => roleAllowed(user?.role, allowedRoles),
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
