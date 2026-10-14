import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/** { user, role, isAuthenticated, login, logout, hasRole } */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
