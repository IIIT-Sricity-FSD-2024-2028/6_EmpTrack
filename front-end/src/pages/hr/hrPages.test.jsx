// HR Escalations, Notifications, Profile (and Company Admin Profile) and Reports on
// Redux: real page click-throughs plus the data-layer and session-safety checks.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as authService from '../../services/authService';
import * as company from '../../services/companyAdminService';
import * as employee from '../../services/employeeService';
import * as hr from '../../services/hrService';
import * as notification from '../../services/notificationService';
import { login, logout } from '../../store/authSlice';
import { queryKey } from '../../store/entitySlice';
import { escalationsEntity, notificationsEntity, tasksEntity } from '../../store/entities';
import { makeStore } from '../../store/store';
import StoreProvider from '../../store/StoreProvider';
import CaProfile from '../company-admin/CaProfile';
import HrEscalations from './HrEscalations';
import HrNotifications from './HrNotifications';
import HrProfile from './HrProfile';
import HrReports from './HrReports';

const HR_USER = { emp_id: 'HR001', emp_name: 'Meera HR', role: 'HR', email: 'hr@acme.test', phone: '9000000001', date_of_joining: '2024-02-01' };
const authState = vi.hoisted(() => ({ user: null }));
vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: authState.user, role: authState.user?.role }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../utils/saCommon', async (importOriginal) => ({ ...(await importOriginal()), loadChartJs: vi.fn(() => new Promise(() => {})) }));
vi.mock('../../services/authService', () => ({ getStoredSession: vi.fn(), login: vi.fn(), logout: vi.fn(), verifySession: vi.fn() }));
vi.mock('../../services/companyAdminService', () => ({ getEmployees: vi.fn() }));
vi.mock('../../services/employeeService', () => ({ updateUserPassword: vi.fn(), getUserById: vi.fn() }));
vi.mock('../../services/notificationService', () => ({ getNotificationsForUser: vi.fn() }));
vi.mock('../../services/hrService', () => ({
  getLeaves: vi.fn(), getIssues: vi.fn(), getEscalations: vi.fn(), getLeaveReviewQueue: vi.fn(),
  getAttendanceFor: vi.fn(), getTasksFor: vi.fn(), rejectEscalation: vi.fn(), generateEscalationReport: vi.fn(),
  getHrSettings: vi.fn(() => ({ attendance: { lateThreshold: 15 } })),
}));

const EMPLOYEES = [
  { emp_id: 'EM001', emp_name: 'Anne', role: 'EMPLOYEE', department_id: 'Engineering' },
  { emp_id: 'TL001', emp_name: 'Rinku', role: 'TEAMLEAD', department_id: 'Engineering' },
  { emp_id: 'HR001', emp_name: 'Meera HR', role: 'HR' },
];
const PENDING = { escalation_id: 'ESC-1', status: 'OPEN', reference_type: 'ATTENDANCE', reference_id: 'EM001', escalated_from: 'TL001', escalation_reason: 'Repeated late arrivals: Late five times this month.', escalation_date: '2026-11-20' };

beforeEach(() => {
  authState.user = HR_USER;
  company.getEmployees.mockResolvedValue(EMPLOYEES);
  hr.getEscalations.mockResolvedValue([PENDING]);
  hr.getLeaves.mockResolvedValue([{ leave_id: 'L1', emp_id: 'EM001', status: 'PENDING', start_date: '2026-12-01', end_date: '2026-12-02' }]);
  hr.getIssues.mockResolvedValue([]);
  hr.getAttendanceFor.mockResolvedValue([{ attendance_id: 'A1', emp_id: 'EM001', attendance_date: '2026-11-24', status: 'PRESENT', hours_spent: 7 }]);
  hr.getTasksFor.mockResolvedValue([
    { task_id: 'TK1', assigned_to: 'EM001', status: 'COMPLETED' },
    { task_id: 'TK2', assigned_to: 'EM001', status: 'IN_PROGRESS' },
  ]);
  hr.getHrSettings.mockReturnValue({ attendance: { lateThreshold: 15 } });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  localStorage.clear();
});

const renderPage = (ui) => render(<StoreProvider><MemoryRouter>{ui}</MemoryRouter></StoreProvider>);

describe('HR Escalations', () => {
  async function openActionCenter() {
    renderPage(<HrEscalations />);
    fireEvent.click(await screen.findByRole('button', { name: 'Take Action' }));
  }

  it('lists the escalations sent to HR and opens their details', async () => {
    renderPage(<HrEscalations />);
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }));
    expect(await screen.findByRole('button', { name: 'Proceed to Take Action' })).toBeTruthy();
    expect(screen.getAllByText(/Repeated late arrivals/).length).toBeGreaterThan(0);
  });

  it('rejects: toast from the backend, list re-read before returning to the queue', async () => {
    await openActionCenter();
    hr.rejectEscalation.mockResolvedValueOnce({ success: true, message: 'Escalation ESC-1 has been rejected.' });
    hr.getEscalations.mockResolvedValue([{ ...PENDING, status: 'REJECTED' }]);
    fireEvent.click(screen.getByRole('button', { name: /Reject Escalation/ }));
    expect(await screen.findByText('Escalation ESC-1 has been rejected.')).toBeTruthy();
    expect(hr.rejectEscalation).toHaveBeenCalledWith('ESC-1');
    expect(await screen.findByRole('button', { name: 'Review' })).toBeTruthy(); // back on the queue
    await waitFor(() => expect(hr.getEscalations).toHaveBeenCalledTimes(2)); // re-read from the backend
    expect(screen.queryByText(/condition/i)).toBeNull();
  });

  it('a refused reject shows the server message and keeps the escalation pending', async () => {
    await openActionCenter();
    hr.rejectEscalation.mockRejectedValueOnce(new Error('This escalation is already rejected.'));
    fireEvent.click(screen.getByRole('button', { name: /Reject Escalation/ }));
    expect(await screen.findByText('This escalation is already rejected.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reject Escalation/ })).toBeTruthy(); // still Pending
    expect(hr.getEscalations).toHaveBeenCalledTimes(1);
  });

  it('downloads the backend report as CSV', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:report');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await openActionCenter();
    hr.generateEscalationReport.mockResolvedValueOnce({ report: { escalation_id: 'ESC-1', employee: 'Anne' } });
    fireEvent.click(screen.getByRole('button', { name: /Download CSV Report/ }));
    expect(await screen.findByText('Escalation report downloaded.')).toBeTruthy();
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(await blob.text()).toBe('"escalation_id","ESC-1"\r\n"employee","Anne"');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});

describe('HR Notifications', () => {
  it('shows the signed-in user\'s notifications; read/dismiss are display flags only', async () => {
    notification.getNotificationsForUser.mockResolvedValue([
      { id: 'N1', message: 'Leave request from Anne', type: 'info', timestamp: '2026-11-24T09:00:00Z' },
      { id: 'N2', message: 'Escalation ESC-1 received', type: 'warning', timestamp: '2026-11-24T10:00:00Z' },
    ]);
    renderPage(<HrNotifications />);
    expect(await screen.findByText('Leave request from Anne')).toBeTruthy();
    expect(notification.getNotificationsForUser).toHaveBeenCalledWith('HR001');
    expect(screen.getByText('2', { selector: '#met-unread' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as read' })[0]);
    expect(screen.getByText('1', { selector: '#met-unread' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);
    expect(screen.queryByText('Leave request from Anne')).toBeNull();
    expect(notification.getNotificationsForUser).toHaveBeenCalledTimes(1); // nothing written to the backend
  });

  it('shows the empty state', async () => {
    notification.getNotificationsForUser.mockResolvedValue([]);
    renderPage(<HrNotifications />);
    expect(await screen.findByText('No notifications yet.')).toBeTruthy();
  });
});

describe('HR Profile and Company Admin Profile', () => {
  it('HR: account from the session, stats from the shared slices', async () => {
    renderPage(<HrProfile />);
    expect(screen.getAllByText('Meera HR').length).toBeGreaterThan(0);
    const openCases = (await screen.findByText('Open Escalations')).previousSibling;
    await waitFor(() => expect(openCases.textContent).toBe('1'));
    expect(screen.getByText('Pending Leaves').previousSibling.textContent).toBe('1');
    expect(screen.getByText('Team Leads').previousSibling.textContent).toBe('1');
  });

  it('Company Admin: same page, no stats row, and no HR-only requests', async () => {
    authState.user = { ...HR_USER, emp_id: 'AD001', emp_name: 'Kiran', role: 'COMPANY_ADMIN' };
    renderPage(<CaProfile />);
    expect(screen.getAllByText('Kiran').length).toBeGreaterThan(0);
    expect(screen.queryByText('Open Escalations')).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    expect(hr.getEscalations).not.toHaveBeenCalled();
    expect(company.getEmployees).not.toHaveBeenCalled();
  });

  async function changePassword() {
    fireEvent.change(screen.getByLabelText(/^Current Password/), { target: { value: 'OldPass@123' } });
    fireEvent.change(screen.getByLabelText(/^New Password/), { target: { value: 'NewPass@456' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/), { target: { value: 'NewPass@456' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }));
  }

  it('password change: success only after the backend confirms', async () => {
    employee.updateUserPassword.mockResolvedValueOnce({ message: 'ok' });
    renderPage(<HrProfile />);
    await changePassword();
    expect(await screen.findByText('Password updated successfully!')).toBeTruthy();
    expect(employee.updateUserPassword).toHaveBeenCalledWith('HR001', 'OldPass@123', 'NewPass@456', 'NewPass@456');
  });

  it('password change: a refused change shows the server message, no success', async () => {
    employee.updateUserPassword.mockRejectedValueOnce(new Error('Current password is incorrect.'));
    renderPage(<HrProfile />);
    await changePassword();
    expect(await screen.findByText('Current password is incorrect.')).toBeTruthy();
    expect(screen.queryByText('Password updated successfully!')).toBeNull();
  });
});

describe('HR Reports', () => {
  it('computes the report from the backend data it loaded through Redux', async () => {
    renderPage(<HrReports />);
    const tasksDone = await screen.findByText('1', { selector: '.bs-val' });
    expect(tasksDone).toBeTruthy(); // one COMPLETED task
    expect(screen.getByText('7 hrs', { selector: '.bs-val' })).toBeTruthy(); // hours from attendance
    // Staff only (employee + team lead), one request each through the shared loaders.
    const staffArg = [{ emp_id: 'EM001' }, { emp_id: 'TL001' }];
    expect(hr.getTasksFor).toHaveBeenCalledWith(staffArg);
    expect(hr.getAttendanceFor).toHaveBeenCalledWith(staffArg);
  });

  it('shows the error state when a source fails', async () => {
    hr.getIssues.mockRejectedValue(new Error('Server error'));
    renderPage(<HrReports />);
    expect(await screen.findByText(/Failed to load reports/)).toBeTruthy();
  });
});

describe('data layer and session safety', () => {
  const session = (emp_id, token) => ({ user: { emp_id, role: 'HR' }, token, expiresAt: Date.now() + 60_000 });

  it('staff tasks are a tasks-slice query keyed by employee ids', async () => {
    authService.getStoredSession.mockReturnValue(session('HR001', 't1'));
    const store = makeStore();
    await store.dispatch(tasksEntity.thunks.fetchForUsers(['EM001']));
    expect(store.getState().tasks.queries[queryKey('fetchForUsers', ['EM001'])].ids).toEqual(['TK1', 'TK2']);
  });

  it("an HR user's late notifications/escalations never reach the next account", async () => {
    authService.getStoredSession.mockReturnValue(session('HR001', 't1'));
    authService.logout.mockResolvedValue(undefined);
    const store = makeStore();
    let resolveNotes;
    let resolveEsc;
    notification.getNotificationsForUser.mockReturnValueOnce(new Promise((r) => { resolveNotes = r; }));
    hr.getEscalations.mockReturnValueOnce(new Promise((r) => { resolveEsc = r; }));
    const notes = store.dispatch(notificationsEntity.thunks.fetchForUser('HR001'));
    const escs = store.dispatch(escalationsEntity.thunks.fetchAll());

    await store.dispatch(logout());
    authService.login.mockResolvedValueOnce(session('HR002', 't2'));
    await store.dispatch(login({ email: 'hr2@acme.test', password: 'x' }));
    resolveNotes([{ id: 'N-OLD', message: "HR001's notification" }]);
    resolveEsc([PENDING]);
    await Promise.all([notes, escs]);

    const s = store.getState();
    expect(s.notifications.ids).toEqual([]);
    expect(s.escalations.ids).toEqual([]);
  });
});
