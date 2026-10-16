// Protected-route / browser-history behaviour, run against a fake backend that
// behaves like back-end/src/auth (opaque bearer tokens, revoked on logout).
// Back/Forward are driven through a memory router (router.navigate(-1 / 1)),
// which goes through the same popstate-style path as the browser buttons.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter, createMemoryRouter, Link, Navigate, Outlet, Route, RouterProvider, Routes, useNavigate } from 'react-router-dom';
import ExitGuard from '../components/layout/ExitGuard';
import config from '../config/config';
import { AuthProvider } from '../context/AuthContext';
import useAuth from '../hooks/useAuth';
import Login from '../pages/public/Login';
import { PATHS, ROLES, STORAGE_KEYS } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

vi.mock('../config/config', () => ({
  default: { appName: 'EmpTrack', apiUrl: 'http://api.test', useMockAuth: false, sessionDuration: 8 * 60 * 60 * 1000 },
}));

const EMPLOYEE = { emp_id: 'EM001', emp_name: 'John Doe', email: 'emp@emptrack.com', role: ROLES.EMPLOYEE };
const TEAM_LEAD = { emp_id: 'TL001', emp_name: 'Rinku Singh', email: 'tl@emptrack.com', role: ROLES.TEAM_LEAD };
const HR = { emp_id: 'HR001', emp_name: 'HR Manager', email: 'hr@emptrack.com', role: ROLES.HR };
const COMPANY_ADMIN = { emp_id: 'AD001', emp_name: 'Kiran', email: 'cmpadmin@emptrack.com', role: ROLES.COMPANY_ADMIN };
const PLATFORM_ADMIN = { emp_id: 'PA001', emp_name: 'Ravi Kumar', email: 'ravi.platform@emptrack.com', role: ROLES.PLATFORM_ADMIN };
const SUPPORT_MEMBER = { emp_id: 'ST001', emp_name: 'Sam Wilson', email: 'sam.support@emptrack.com', role: ROLES.SUPPORT_MEMBER };
const TECHNICAL_MEMBER = { emp_id: 'TT001', emp_name: 'Wanda Maximoff', email: 'wanda.tech@emptrack.com', role: ROLES.TECHNICAL_MEMBER };
const SUPER_ADMIN = { emp_id: 'SA001', emp_name: 'Alex Morgan', email: 'superadmin@emptrack.com', role: ROLES.SUPER_ADMIN };
const USERS = [EMPLOYEE, TEAM_LEAD, HR, COMPANY_ADMIN, PLATFORM_ADMIN, SUPPORT_MEMBER, TECHNICAL_MEMBER, SUPER_ADMIN];
const DASHBOARD_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.TEAM_LEAD]: 'Team Lead',
  [ROLES.HR]: 'HR',
  [ROLES.COMPANY_ADMIN]: 'Company Admin',
  [ROLES.PLATFORM_ADMIN]: 'Platform Admin',
  [ROLES.SUPPORT_MEMBER]: 'Support Member',
  [ROLES.TECHNICAL_MEMBER]: 'Technical Member',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};
const PASSWORD = 'Password@123';

// ---- Fake backend --------------------------------------------------------
let server;
function resetServer() {
  server = { sessions: new Map(), ttlMs: 8 * 60 * 60 * 1000, calls: [] };
}
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
async function fakeFetch(url, init = {}) {
  const path = new URL(url).pathname;
  const auth = init.headers?.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const session = token && server.sessions.get(token);
  const valid = session && session.expiresAt > Date.now();
  server.calls.push({ path, token, body: init.body ? JSON.parse(init.body) : undefined });

  if (path === '/auth/login') {
    const { email, password } = JSON.parse(init.body);
    const user = USERS.find((u) => u.email === email.toLowerCase());
    if (!user || password !== PASSWORD) return json(401, { message: 'Invalid email or password.' });
    const newToken = `tok-${server.sessions.size + 1}-${Math.random()}`;
    const expiresAt = Date.now() + server.ttlMs;
    server.sessions.set(newToken, { user, expiresAt });
    return json(200, { user, token: newToken, expiresAt });
  }
  if (!valid) return json(401, { message: 'Authentication required.' });
  if (path === '/auth/logout') {
    server.sessions.delete(token);
    return json(200, { success: true });
  }
  if (path === '/auth/me') return json(200, { user: session.user, expiresAt: session.expiresAt });
  return json(200, { ok: true });
}

// ---- App under test ------------------------------------------------------
function PortalLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  // Same handler as components/layout/Sidebar.jsx.
  const handleLogout = async () => {
    await logout();
    navigate(PATHS.HOME);
  };
  return (
    <div>
      <button type="button" onClick={handleLogout}>Logout</button>
      <Outlet />
    </div>
  );
}

function makeRouter(initialEntries = [PATHS.LOGIN]) {
  return createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          { path: PATHS.HOME, element: <div><h1>Public home</h1><Link to={PATHS.LOGIN}>Login</Link></div> },
          { path: PATHS.LOGIN, element: <Login /> },
          {
            path: '/employee',
            element: (
              <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.EMPLOYEE]}>
                  <PortalLayout />
                </RoleRoute>
              </ProtectedRoute>
            ),
            children: [
              { path: 'dashboard', element: <h1>Employee dashboard</h1> },
              { path: 'tasks', element: <h1>Employee tasks</h1> },
            ],
          },
          ...USERS.filter((user) => user.role !== ROLES.EMPLOYEE).map((user) => ({
            path: `/${user.role === ROLES.TEAM_LEAD ? 'teamlead' : user.role.toLowerCase().replaceAll('_', '-')}`,
            element: (
              <ProtectedRoute>
                <RoleRoute allowedRoles={[user.role]}>
                  <Outlet />
                </RoleRoute>
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <h1>{DASHBOARD_LABELS[user.role]} dashboard</h1> },
              { path: 'dashboard', element: <h1>{DASHBOARD_LABELS[user.role]} dashboard</h1> },
            ],
          })),
        ],
      },
    ],
    { initialEntries },
  );
}

async function renderApp(initialEntries) {
  const router = makeRouter(initialEntries);
  render(<RouterProvider router={router} />);
  // Let any start-up session verification settle.
  await act(async () => {});
  return router;
}

const go = (router, delta) => act(() => router.navigate(delta));
const onLoginPage = () => screen.findByRole('heading', { name: 'Sign in to your account' });
const protectedContent = () => screen.queryByText(/dashboard|Employee tasks/);

function submitLogin(email = EMPLOYEE.email, password = PASSWORD) {
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Password/), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

async function logIn() {
  submitLogin();
  await screen.findByText('Employee dashboard');
}

function storeSession(session) {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
}

beforeEach(() => {
  resetServer();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// --------------------------------------------------------------------------
describe('while logged in', () => {
  it('keeps normal Back/Forward navigation between protected pages working', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate('/employee/tasks'));
    expect(screen.getByText('Employee tasks')).toBeTruthy();

    await go(router, -1);
    expect(screen.getByText('Employee dashboard')).toBeTruthy();
    await go(router, 1);
    expect(screen.getByText('Employee tasks')).toBeTruthy();
  });

  it('keeps the login form visible for an authenticated user who visits /login', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate(PATHS.LOGIN));
    await onLoginPage();
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);
    expect(screen.queryByText('Employee dashboard')).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).user.role).toBe(ROLES.EMPLOYEE);
  });

  it('redirects to the role home when the URL belongs to another role', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate('/hr'));
    expect(await screen.findByText('Employee dashboard')).toBeTruthy();
  });
});

describe('protected URLs without a session', () => {
  it('redirects direct navigation / refresh on a protected URL to /login', async () => {
    const router = await renderApp(['/employee/tasks']);
    await onLoginPage();
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);
    expect(protectedContent()).toBeNull();
  });

  it('returns to the originally requested page after logging in', async () => {
    const router = await renderApp(['/employee/tasks']);
    await onLoginPage();
    submitLogin();
    expect(await screen.findByText('Employee tasks')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/employee/tasks');
  });

  it("ignores a remembered page from another role's portal", async () => {
    const router = await renderApp([{ pathname: PATHS.LOGIN, state: { from: { pathname: '/hr' } } }]);
    await logIn();
    expect(router.state.location.pathname).toBe('/employee/dashboard');
  });
});

describe('role-based redirect after login', () => {
  const cases = USERS.map((user) => [
    user,
    `/${user.role === ROLES.TEAM_LEAD ? 'teamlead' : user.role.toLowerCase().replaceAll('_', '-')}/dashboard`,
    `${DASHBOARD_LABELS[user.role]} dashboard`,
  ]);

  it('starts with an empty form instead of prefilled Employee credentials', async () => {
    await renderApp([PATHS.LOGIN]);
    expect(screen.getByLabelText(/Email/).value).toBe('');
    expect(screen.getByLabelText(/Password/).value).toBe('');
  });

  it.each(cases)('sends %o to their own dashboard, also after a refresh', async (user, home, title) => {
    const router = await renderApp([PATHS.LOGIN]);
    submitLogin(user.email);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(router.state.location.pathname).toBe(home);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).user.role).toBe(user.role);

    // Refresh: a new app instance restores the stored session and keeps the role.
    cleanup();
    const reloaded = await renderApp([home]);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(reloaded.state.location.pathname).toBe(home);
  });

  it.each(cases)('%s can visit Home, open Login, and reauthenticate before returning to their dashboard', async (user, home, title) => {
    const router = await renderApp([PATHS.LOGIN]);
    submitLogin(user.email);
    expect(await screen.findByText(title)).toBeTruthy();
    const previousToken = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token;

    await act(() => router.navigate(PATHS.HOME));
    expect(screen.getByText('Public home')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token).toBe(previousToken);
    fireEvent.click(screen.getByRole('link', { name: 'Login' }));
    await onLoginPage();
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);
    expect(server.calls.filter((call) => call.path === '/auth/login')).toHaveLength(1);

    submitLogin(user.email, 'Wrong@123');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Invalid email or password/);
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);
    expect(server.calls.filter((call) => call.path === '/auth/login').at(-1).token).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token).toBe(previousToken);

    await act(() => router.navigate(home));
    await onLoginPage();
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);

    submitLogin(user.email);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(router.state.location.pathname).toBe(home);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token).not.toBe(previousToken);
  });

  it('cancels the reauthentication challenge when the user returns to Home', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate(PATHS.LOGIN));
    await onLoginPage();

    fireEvent.click(screen.getByRole('link', { name: /back to home/i }));
    expect(screen.getByText('Public home')).toBeTruthy();
    await act(() => router.navigate('/employee/dashboard'));
    expect(await screen.findByText('Employee dashboard')).toBeTruthy();
  });

  it.each(cases)("keeps %o out of other roles' portals", async (user, home, title) => {
    const router = await renderApp([PATHS.LOGIN]);
    submitLogin(user.email);
    await screen.findByText(title);
    for (const other of ['/employee/dashboard', '/teamlead/dashboard', '/hr/dashboard'].filter((p) => p !== home)) {
      await act(() => router.navigate(other));
      expect(await screen.findByText(title)).toBeTruthy();
      expect(router.state.location.pathname).toBe(home);
    }
  });

  it('shows an error and stays on /login for wrong credentials', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    submitLogin(TEAM_LEAD.email, 'wrong-password');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Invalid email or password/);
    expect(router.state.location.pathname).toBe(PATHS.LOGIN);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
  });

  it('normalizes a Company Admin email and opens the Company Admin dashboard', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    submitLogin(`  ${COMPANY_ADMIN.email.toUpperCase()}  `);
    expect(await screen.findByText('Company Admin dashboard')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/company-admin/dashboard');
    expect(server.calls.find((call) => call.path === '/auth/login').body.email).toBe(COMPANY_ADMIN.email);
  });

  it('logs in the next user with their own role after a logout', async () => {
    await renderApp([PATHS.LOGIN]);
    await logIn();
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await onLoginPage();
    submitLogin(HR.email);
    expect(await screen.findByText('HR dashboard')).toBeTruthy();
  });

  // Without VITE_API_URL the app logs in against authService's MOCK_USERS; the
  // backend's seed credentials must reach the same roles there.
  it.each(cases)('resolves %o by the backend seed credentials in mock-auth mode', async (user, home, title) => {
    config.useMockAuth = true;
    try {
      const router = await renderApp([PATHS.LOGIN]);
      submitLogin(user.email);
      expect(await screen.findByText(title)).toBeTruthy();
      expect(router.state.location.pathname).toBe(home);
    } finally {
      config.useMockAuth = false;
    }
  });
});

describe('logout', () => {
  it('revokes the token on the server and clears the stored session', async () => {
    await renderApp([PATHS.LOGIN]);
    await logIn();
    const token = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token;

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await onLoginPage();
    expect(server.calls.some((c) => c.path === '/auth/logout' && c.token === token)).toBe(true);
    expect(server.sessions.has(token)).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
  });

  it('keeps Back/Forward on /login after logout instead of showing protected pages', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate('/employee/tasks'));

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await onLoginPage();

    for (const delta of [-1, -1, 1, 1, -1]) {
      await go(router, delta);
      await onLoginPage();
      expect(protectedContent()).toBeNull();
    }
  });

  it('logs this tab out when another tab logs out (shared localStorage session)', async () => {
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate('/employee/tasks'));

    // Another tab logged out: it removed the stored session and the browser
    // fires a `storage` event in every other tab.
    await act(async () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.AUTH, newValue: null }));
    });
    await onLoginPage();

    await go(router, -1);
    await onLoginPage();
    expect(protectedContent()).toBeNull();
  });

  it('re-checks the session when a page is restored from the back/forward cache', async () => {
    await renderApp([PATHS.LOGIN]);
    await logIn();

    // Session ended while this page sat in the bfcache (e.g. logout in another
    // tab whose storage event this frozen page never received).
    await act(async () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      const event = new Event('pageshow');
      event.persisted = true;
      window.dispatchEvent(event);
    });
    await onLoginPage();
  });
});

describe('expired sessions', () => {
  it('logs out when the session reaches its expiry while the app is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    server.ttlMs = 60_000;
    const router = await renderApp([PATHS.LOGIN]);
    await logIn();
    await act(() => router.navigate('/employee/tasks'));

    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });
    await onLoginPage();

    await go(router, -1);
    await onLoginPage();
    expect(protectedContent()).toBeNull();
  });

  it('drops an expired stored session on refresh', async () => {
    storeSession({ user: EMPLOYEE, token: 'old', expiresAt: Date.now() - 1000 });
    await renderApp(['/employee/dashboard']);
    await onLoginPage();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
  });

  it('does not render protected pages on refresh when the server no longer accepts the token', async () => {
    // Unexpired locally, but unknown to the server (revoked, or backend restarted).
    storeSession({ user: EMPLOYEE, token: 'revoked', expiresAt: Date.now() + 60_000 });
    await renderApp(['/employee/dashboard']);
    await onLoginPage();
    expect(screen.queryByText('Employee dashboard')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
  });

  it('keeps a valid stored session on refresh after the server confirms it', async () => {
    server.sessions.set('good', { user: EMPLOYEE, expiresAt: Date.now() + 60_000 });
    storeSession({ user: EMPLOYEE, token: 'good', expiresAt: Date.now() + 60_000 });
    await renderApp(['/employee/tasks']);
    expect(await screen.findByText('Employee tasks')).toBeTruthy();
    expect(server.calls.some((c) => c.path === '/auth/me' && c.token === 'good')).toBe(true);
  });

  it('does not log the user out when the backend is unreachable during the check', async () => {
    storeSession({ user: EMPLOYEE, token: 'good', expiresAt: Date.now() + 60_000 });
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await renderApp(['/employee/tasks']);
    expect(await screen.findByText('Employee tasks')).toBeTruthy();
  });

  it('uses the server-side identity, not a tampered role in localStorage', async () => {
    server.sessions.set('real', { user: EMPLOYEE, expiresAt: Date.now() + 60_000 });
    storeSession({ user: { ...EMPLOYEE, role: ROLES.HR }, token: 'real', expiresAt: Date.now() + 60_000 });
    await renderApp(['/hr']);
    expect(await screen.findByText('Employee dashboard')).toBeTruthy();
    expect(screen.queryByText('HR dashboard')).toBeNull();
  });
});

// --------------------------------------------------------------------------
// Exit confirmation on the browser Back button (components/layout/ExitGuard).
// These use BrowserRouter and jsdom's real window.history, because the guard
// works on browser history entries; history.back()/forward() fire popstate
// asynchronously, like the browser buttons.
describe('exit confirmation on browser Back', () => {
  function BrowserApp() {
    return (
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path={PATHS.HOME} element={<Navigate to={PATHS.LOGIN} replace />} />
            <Route path={PATHS.LOGIN} element={<Login />} />
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={[ROLES.EMPLOYEE]}>
                    <div>
                      <Link to="/employee/tasks">Tasks link</Link>
                      <Outlet />
                      <ExitGuard />
                    </div>
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<h1>Employee dashboard</h1>} />
              <Route path="tasks" element={<h1>Employee tasks</h1>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  const dialog = () => screen.queryByRole('dialog');
  const traverse = async (step) => {
    const before = window.history.state;
    await act(async () => {
      step();
      await waitFor(() => expect(window.history.state).not.toBe(before));
    });
  };
  const back = () => traverse(() => window.history.back());
  const forward = () => traverse(() => window.history.forward());

  beforeEach(async () => {
    // Fresh "page load": React Router treats an entry without state as the first one.
    window.history.replaceState(null, '', PATHS.LOGIN);
    render(<BrowserApp />);
    await act(async () => {});
    await logIn();
  });

  it('asks before leaving, and Cancel keeps the user on the same page, logged in', async () => {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token;

    await back();
    expect(await screen.findByText('Are you sure you want to exit EmpTrack?')).toBeTruthy();
    expect(window.location.pathname).toBe('/employee/dashboard');
    expect(screen.getByText('Employee dashboard')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialog()).toBeNull();
    expect(window.location.pathname).toBe('/employee/dashboard');
    expect(screen.getByText('Employee dashboard')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token).toBe(token);
    expect(server.calls.some((c) => c.path === '/auth/logout')).toBe(false);

    // Still usable, and asks again (once) on the next Back.
    fireEvent.click(screen.getByText('Tasks link'));
    expect(await screen.findByText('Employee tasks')).toBeTruthy();
    await back();
    expect(screen.getByText('Employee dashboard')).toBeTruthy();
    expect(dialog()).toBeNull();
    await back();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('Yes, Exit logs out on the server and Forward does not restore the session', async () => {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH)).token;

    await back();
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, Exit' }));
    await onLoginPage();
    expect(window.location.pathname).toBe(PATHS.LOGIN);
    expect(server.sessions.has(token)).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).toBeNull();
    expect(dialog()).toBeNull();

    await forward();
    await onLoginPage();
    expect(window.location.pathname).toBe(PATHS.LOGIN);
    expect(protectedContent()).toBeNull();
    expect(dialog()).toBeNull();
  });

  it('does not ask for Back/Forward between pages inside the app', async () => {
    fireEvent.click(screen.getByText('Tasks link'));
    expect(await screen.findByText('Employee tasks')).toBeTruthy();

    await back();
    expect(screen.getByText('Employee dashboard')).toBeTruthy();
    expect(dialog()).toBeNull();
    await forward();
    expect(screen.getByText('Employee tasks')).toBeTruthy();
    expect(dialog()).toBeNull();
  });

  it('treats Forward while the dialog is open as staying', async () => {
    await back();
    await screen.findByRole('dialog');
    await forward();
    expect(dialog()).toBeNull();
    expect(screen.getByText('Employee dashboard')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH)).not.toBeNull();
  });
});
