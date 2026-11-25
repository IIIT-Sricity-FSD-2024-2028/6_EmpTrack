// Team Lead Profile: the account is read through Redux (employees/fetchById), the
// browser-only edits are laid over it on screen and saved locally, unchanged.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import * as authService from '../../services/authService';
import * as employee from '../../services/employeeService';
import * as tl from '../../services/teamLeadService';
import { login, logout } from '../../store/authSlice';
import { queryKey } from '../../store/entitySlice';
import { employeesEntity } from '../../store/entities';
import { makeStore } from '../../store/store';
import Profile from './Profile';

const TL = { emp_id: 'TL001', emp_name: 'Rinku Singh', role: 'TEAMLEAD', email: 'tl@acme.test', phone: '1111111111', date_of_joining: '2024-01-15' };
vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'TL001', emp_name: 'Rinku Singh', role: 'TEAMLEAD' }, role: 'TEAMLEAD' }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/authService', () => ({ getStoredSession: vi.fn(), login: vi.fn(), logout: vi.fn(), verifySession: vi.fn() }));
vi.mock('../../services/employeeService', () => ({ getUserById: vi.fn(), updateUserPassword: vi.fn() }));
vi.mock('../../services/teamLeadService', () => ({ IS_DEMO: false, getProfileEdits: vi.fn(), saveProfile: vi.fn(), changePassword: vi.fn() }));
vi.mock('./components/TeamLeadUI', async (importOriginal) => ({
  ...(await importOriginal()),
  useTeamData: () => ({ data: { members: [], tasks: [], leaves: [], issues: [] } }),
  useToast: () => [null, vi.fn()],
}));

const session = (emp_id, token) => ({ user: { emp_id, role: 'TEAMLEAD' }, token, expiresAt: Date.now() + 60_000 });

beforeEach(() => {
  authService.getStoredSession.mockReturnValue(session('TL001', 't1'));
  tl.getProfileEdits.mockReturnValue({ address: '12 Lake Road', phone: '9999999999' });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function renderProfile() {
  const store = makeStore();
  render(<Provider store={store}><MemoryRouter><Profile /></MemoryRouter></Provider>);
  return store;
}

describe('Team Lead Profile account', () => {
  it('loads the account through Redux and shows browser edits over it, without overwriting the record', async () => {
    employee.getUserById.mockResolvedValue(TL);
    const store = renderProfile();
    expect(await screen.findByRole('heading', { name: 'Rinku Singh' })).toBeTruthy();
    expect(employee.getUserById).toHaveBeenCalledWith('TL001');
    expect(screen.getByText('tl@acme.test')).toBeTruthy(); // backend field
    expect(screen.getByText('12 Lake Road')).toBeTruthy(); // browser-only edit
    expect(store.getState().employees.entities.TL001.phone).toBe('1111111111'); // backend copy untouched
    expect(store.getState().employees.entities.TL001.address).toBeUndefined();
  });

  it('shows the server error with Retry, and recovers', async () => {
    employee.getUserById.mockRejectedValueOnce(new Error('Service unavailable'));
    renderProfile();
    expect(await screen.findByText('Could not load data')).toBeTruthy();
    expect(screen.getByText('Service unavailable')).toBeTruthy();
    employee.getUserById.mockResolvedValueOnce(TL);
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
    expect(await screen.findByRole('heading', { name: 'Rinku Singh' })).toBeTruthy();
  });

  it('saving edits stays browser-only: no backend request, edits re-read', async () => {
    employee.getUserById.mockResolvedValue(TL);
    renderProfile();
    fireEvent.click(await screen.findByRole('button', { name: /Edit Profile/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Address/), { target: { value: '7 Hill Street' } });
    tl.getProfileEdits.mockReturnValue({ address: '7 Hill Street', phone: '9999999999' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('7 Hill Street')).toBeTruthy();
    expect(tl.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ address: '7 Hill Street' }));
    expect(employee.getUserById).toHaveBeenCalledTimes(1);
  });
});

describe('stale account response after an account switch', () => {
  it("TL001's late account response never reaches the next user's state", async () => {
    const store = makeStore(); // signed in as TL001
    let resolveOld;
    employee.getUserById.mockReturnValueOnce(new Promise((r) => { resolveOld = r; }));
    const oldRequest = store.dispatch(employeesEntity.thunks.fetchById('TL001'));

    authService.logout.mockResolvedValue(undefined);
    await store.dispatch(logout());
    authService.login.mockResolvedValueOnce(session('TL002', 't2'));
    await store.dispatch(login({ email: 'tl2@acme.test', password: 'x' }));
    employee.getUserById.mockResolvedValueOnce({ ...TL, emp_id: 'TL002', emp_name: 'Priya' });
    await store.dispatch(employeesEntity.thunks.fetchById('TL002'));

    resolveOld(TL);
    await oldRequest;
    const s = store.getState().employees;
    expect(s.entities.TL001).toBeUndefined();
    expect(s.queries[queryKey('fetchById', 'TL001')]).toBeUndefined();
    await waitFor(() => expect(s.entities.TL002.emp_name).toBe('Priya'));
  });
});
