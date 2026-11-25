// Increment 10: password changes on the Platform Admin, Support Member and Team Lead
// profiles go through Redux (demo-aware), and the header calendar never shows a
// previous user's events after an account switch.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/layout/Header';
import api from '../services/api';
import * as pa from '../services/platformAdminService';
import * as tl from '../services/teamLeadService';
import StoreProvider from '../store/StoreProvider';
import PlatformAdminProfile from './platform-admin/Profile';
import SupportMemberProfile from './support-member/Profile';
import TeamLeadProfile from './teamlead/Profile';

const authState = vi.hoisted(() => ({ user: null }));
vi.mock('../hooks/useAuth', () => ({ default: () => ({ user: authState.user, role: authState.user?.role }) }));
vi.mock('../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../hooks/useTheme', () => ({ default: () => ({ isDark: false, toggleTheme: vi.fn() }) }));
vi.mock('../services/api', async (importOriginal) => ({ ...(await importOriginal()), default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../services/notificationService', () => ({ getNotificationsForUser: vi.fn(async () => []) }));
vi.mock('../services/platformAdminService', () => ({ IS_DEMO: false, changePassword: vi.fn(), getDashboardSummary: vi.fn(), getNotifications: vi.fn() }));
vi.mock('../services/supportMemberService', () => ({ IS_DEMO: false, getStats: vi.fn() }));
vi.mock('../services/teamLeadService', () => ({ IS_DEMO: false, changePassword: vi.fn(), getProfileEdits: vi.fn(() => ({})), saveProfile: vi.fn() }));
vi.mock('../services/employeeService', () => ({ getUserById: vi.fn(), updateUserPassword: vi.fn() }));
vi.mock('./teamlead/components/TeamLeadUI', () => ({
  LoadState: ({ children }) => children,
  useTeamData: () => ({ data: { members: [], tasks: [], leaves: [], issues: [] } }),
  useToast: () => [null, vi.fn()],
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderPage = (ui) => render(<StoreProvider><MemoryRouter>{ui}</MemoryRouter></StoreProvider>);

async function fillPassword() {
  // The Team Lead form appears once the profile has loaded.
  fireEvent.change(await screen.findByLabelText(/^Current Password/), { target: { value: 'OldPass@123' } });
  fireEvent.change(screen.getByLabelText(/^New Password/), { target: { value: 'NewPass@456' } });
  fireEvent.change(screen.getByLabelText(/^Confirm New Password/), { target: { value: 'NewPass@456' } });
}
const form = () => screen.getByLabelText(/^Current Password/).closest('form');

const PAGES = [
  {
    name: 'Platform Admin', user: { emp_id: 'PA001', emp_name: 'Ravi', role: 'PLATFORM_ADMIN' },
    Page: PlatformAdminProfile, changePassword: () => pa.changePassword,
    setup: () => pa.getDashboardSummary.mockResolvedValue({ total_companies: 2 }),
  },
  {
    name: 'Support Member', user: { emp_id: 'ST001', emp_name: 'Sam', role: 'SUPPORT_MEMBER' },
    Page: SupportMemberProfile, changePassword: () => pa.changePassword, // re-exported by supportMemberService
    setup: async () => (await import('../services/supportMemberService')).getStats.mockResolvedValue({ open: 1 }),
  },
  {
    name: 'Team Lead', user: { emp_id: 'TL001', emp_name: 'Rinku', role: 'TEAMLEAD', email: 'tl@acme.test' },
    Page: TeamLeadProfile, changePassword: () => tl.changePassword,
    setup: async () => {
      tl.getProfileEdits.mockReturnValue({});
      (await import('../services/employeeService')).getUserById.mockResolvedValue({ emp_id: 'TL001', emp_name: 'Rinku', email: 'tl@acme.test' });
    },
  },
];

describe.each(PAGES)('$name profile password change', ({ user, Page, changePassword, setup }) => {
  beforeEach(async () => {
    authState.user = user;
    await setup();
  });

  it('reports success only after the backend confirms', async () => {
    changePassword().mockResolvedValueOnce({ saved: true });
    renderPage(<Page />);
    await fillPassword();
    fireEvent.submit(form());
    expect(await screen.findByText('Password updated successfully.')).toBeTruthy();
    expect(changePassword()).toHaveBeenCalledWith(user.emp_id, 'OldPass@123', 'NewPass@456', 'NewPass@456');
  });

  it('shows the server message and no success when the backend refuses', async () => {
    changePassword().mockRejectedValueOnce(new Error('Current password is incorrect.'));
    renderPage(<Page />);
    await fillPassword();
    fireEvent.submit(form());
    expect(await screen.findByText('Current password is incorrect.')).toBeTruthy();
    expect(screen.queryByText('Password updated successfully.')).toBeNull();
  });

  it('keeps the demo-mode message when nothing was saved', async () => {
    changePassword().mockResolvedValueOnce({ saved: false });
    renderPage(<Page />);
    await fillPassword();
    fireEvent.submit(form());
    expect(await screen.findByText(/Demo mode: your current password was verified/)).toBeTruthy();
  });

  it('a second submit while the first is running is not sent', async () => {
    let finish;
    changePassword().mockReturnValueOnce(new Promise((r) => { finish = () => r({ saved: true }); }));
    renderPage(<Page />);
    await fillPassword();
    fireEvent.submit(form());
    fireEvent.submit(form()); // e.g. Enter pressed twice
    await waitFor(() => expect(changePassword()).toHaveBeenCalledTimes(1));
    finish();
    expect(await screen.findByText('Password updated successfully.')).toBeTruthy();
    expect(changePassword()).toHaveBeenCalledTimes(1);
  });
});

describe('Header calendar across an account switch', () => {
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = dateKey(new Date());

  it("a different signed-in user never sees the previous user's events", async () => {
    // The backend answers for whoever the session belongs to.
    api.get.mockImplementation(async (path) => (path === '/calendar/my-calendar'
      ? [{ id: `EV-${authState.user.emp_id}`, type: 'PERSONAL', title: `${authState.user.emp_name}'s appointment`, date: today }]
      : []));
    authState.user = { emp_id: 'EM001', emp_name: 'Anne', role: 'EMPLOYEE' };
    const view = renderPage(<Header onMenuClick={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(await screen.findByTitle("Anne's appointment")).toBeTruthy();

    // Another tab signs in as a different employee: same role, so the header stays mounted.
    authState.user = { emp_id: 'EM002', emp_name: 'Bilal', role: 'EMPLOYEE' };
    view.rerender(<StoreProvider><MemoryRouter><Header onMenuClick={() => {}} /></MemoryRouter></StoreProvider>);
    expect(screen.queryByTitle("Anne's appointment")).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(await screen.findByTitle("Bilal's appointment")).toBeTruthy();
    expect(screen.queryByTitle("Anne's appointment")).toBeNull();
  });
});
