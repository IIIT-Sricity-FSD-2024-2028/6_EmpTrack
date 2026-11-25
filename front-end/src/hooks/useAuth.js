import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as auth from '../store/authSlice';
import { hasRole as roleAllowed } from '../utils/permissions';

/** { user, role, isAuthenticated, isVerifying, login, logout, hasRole, ... } read from the Redux auth slice. */
export default function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(auth.selectUser);
  const isVerifying = useSelector((s) => s.auth.isVerifying);
  const reauthenticationRequired = useSelector((s) => s.auth.reauthenticationRequired);

  // Resolves to the user returned by the backend; rejects with { message, fieldErrors }.
  const login = useCallback(
    async (email, password) => (await dispatch(auth.login({ email, password })).unwrap()).user,
    [dispatch],
  );
  const logout = useCallback(() => dispatch(auth.logout()), [dispatch]);
  const requireReauthentication = useCallback(() => dispatch(auth.requireReauthentication()), [dispatch]);
  const cancelReauthentication = useCallback(() => dispatch(auth.cancelReauthentication()), [dispatch]);

  return useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isVerifying,
      reauthenticationRequired,
      login,
      logout,
      requireReauthentication,
      cancelReauthentication,
      hasRole: (allowedRoles) => roleAllowed(user?.role, allowedRoles),
    }),
    [user, isVerifying, reauthenticationRequired, login, logout, requireReauthentication, cancelReauthentication],
  );
}
