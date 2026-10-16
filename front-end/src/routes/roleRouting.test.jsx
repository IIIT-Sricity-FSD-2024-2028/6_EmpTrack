// Role-based routing for every role on the real route table (routes.jsx) with the
// app's real providers. Config is pinned to "no backend" so auth uses the mock users,
// which mirror the backend seed accounts (back-end/src/data/mock-data.service.ts).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PATHS, ROLES, STORAGE_KEYS } from '../utils/constants';
import { getHomePath } from '../utils/permissions';

vi.mock('../config/config', () => ({
  default: { appName: 'EmpTrack', apiUrl: '', useMockAuth: true, sessionDuration: 8 * 60 * 60 * 1000 },
}));

const ACCOUNTS = [
  ['superadmin@emptrack.com', ROLES.SUPER_ADMIN],
  ['ravi.platform@emptrack.com', ROLES.PLATFORM_ADMIN],
  ['sam.support@emptrack.com', ROLES.SUPPORT_MEMBER],
  ['wanda.tech@emptrack.com', ROLES.TECHNICAL_MEMBER],
  ['cmpadmin@emptrack.com', ROLES.COMPANY_ADMIN],
  ['hr@emptrack.com', ROLES.HR],
  ['tl@emptrack.com', ROLES.TEAM_LEAD],
  ['emp@emptrack.com', ROLES.EMPLOYEE],
];

async function openApp(path) {
  window.history.replaceState(null, '', path);
  render(<App />);
  await act(async () => {});
}

async function logIn(email) {
  await openApp(PATHS.LOGIN);
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password@123' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  });
}

function storeSession(user) {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ user, expiresAt: Date.now() + 60 * 60 * 1000 }));
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('role-based routing', () => {
  it.each(ACCOUNTS)('logs %s in to the %s dashboard', async (email, role) => {
    await logIn(email);
    expect(window.location.pathname).toBe(getHomePath(role));
    expect(document.querySelector('#main-content')).toBeTruthy();
  });

  it.each(ACCOUNTS)('keeps %s (%s) on its dashboard after a refresh', async (email, role) => {
    storeSession({ emp_id: 'X', emp_name: 'X', email, role });
    await openApp(getHomePath(role));
    expect(window.location.pathname).toBe(getHomePath(role));
    expect(document.querySelector('#main-content')).toBeTruthy();
  });

  it('sends a non-admin who types the Super Admin URL back to their own dashboard', async () => {
    storeSession({ emp_id: 'EM001', emp_name: 'John Doe', role: ROLES.EMPLOYEE });
    await openApp('/super-admin/dashboard');
    expect(window.location.pathname).toBe(getHomePath(ROLES.EMPLOYEE));
  });

  it('sends a Super Admin who types another portal URL back to the Super Admin dashboard', async () => {
    storeSession({ emp_id: 'SA001', emp_name: 'Alex Morgan', role: ROLES.SUPER_ADMIN });
    await openApp('/hr/dashboard');
    expect(window.location.pathname).toBe(getHomePath(ROLES.SUPER_ADMIN));
  });

  it.each(['/login', '/employee/dashboard', '/super-admin/dashboard'])(
    'shows the fallback page with a logout button for an unknown role (from %s)',
    async (start) => {
      storeSession({ emp_id: 'X1', emp_name: 'Mystery User', role: 'MANAGER' });
      await openApp(start);
      expect(window.location.pathname).toBe(PATHS.UNSUPPORTED_ROLE);
      expect(screen.getByText('No dashboard for this account')).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /log out/i }));
      });
      expect(window.location.pathname).toBe(PATHS.LOGIN);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
    },
  );

  it('sends a logged-out visitor on the fallback page to /login', async () => {
    await openApp(PATHS.UNSUPPORTED_ROLE);
    expect(window.location.pathname).toBe(PATHS.LOGIN);
  });
});
