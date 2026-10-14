// Authentication API calls and session persistence.
// The backend (POST /auth/login) verifies credentials and returns { user }
// with the account's role; the frontend never decides the role itself.
// While VITE_API_URL is empty (config.useMockAuth), login resolves against
// MOCK_USERS below so the UI shell can be opened without a backend
// (data-driven pages will still need the API).
import config from '../config/config';
import { ROLES, STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';

// Same shape as backend users. Password for all: "Password@123".
const MOCK_USERS = [
  { emp_id: 'EM001', emp_name: 'John Doe (EMP)', email: 'emp@emp.com', role: ROLES.EMPLOYEE },
  { emp_id: 'HR001', emp_name: 'Demo HR', email: 'hr@emptrack.com', role: ROLES.HR },
  { emp_id: 'CA001', emp_name: 'Demo Company Admin', email: 'companyadmin@emptrack.com', role: ROLES.COMPANY_ADMIN },
  { emp_id: 'TL001', emp_name: 'Demo Team Lead', email: 'teamlead@emptrack.com', role: ROLES.TEAM_LEAD },
  { emp_id: 'PA001', emp_name: 'Demo Platform Admin', email: 'platformadmin@emptrack.com', role: ROLES.PLATFORM_ADMIN },
  { emp_id: 'SM001', emp_name: 'Demo Support Member', email: 'support@emptrack.com', role: ROLES.SUPPORT_MEMBER },
  { emp_id: 'TM001', emp_name: 'Demo Technical Member', email: 'technical@emptrack.com', role: ROLES.TECHNICAL_MEMBER },
  { emp_id: 'SA001', emp_name: 'Demo Super Admin', email: 'superadmin@emptrack.com', role: ROLES.SUPER_ADMIN },
];
const MOCK_PASSWORD = 'Password@123';

async function mockLogin(email, password) {
  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== MOCK_PASSWORD) {
    throw new Error('Invalid email or password.');
  }
  return { user };
}

/** Returns { user, token?, expiresAt } and persists the session. */
export async function login(email, password) {
  const { user, token } = config.useMockAuth
    ? await mockLogin(email, password)
    : await api.post('/auth/login', { email, password });

  const session = { user, token, expiresAt: Date.now() + config.sessionDuration };
  writeStorage(STORAGE_KEYS.AUTH, session);
  return session;
}

export async function logout() {
  if (!config.useMockAuth) {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear the local session even if the server call fails.
    }
  }
  writeStorage(STORAGE_KEYS.AUTH, null);
}

/** Activates an invited account (POST /invitations/:token/accept). */
export function acceptInvitation(token, password) {
  return api.post(`/invitations/${token}/accept`, { password });
}

/** Returns the persisted session, or null if missing or expired. */
export function getStoredSession() {
  const session = readStorage(STORAGE_KEYS.AUTH);
  if (!session?.user) return null;
  if (session.expiresAt && session.expiresAt < Date.now()) {
    writeStorage(STORAGE_KEYS.AUTH, null);
    return null;
  }
  return session;
}
