import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';
import { getTasksForUser } from '../../services/taskService';
import { getActiveWorkSession, startWorkSession } from '../../services/worklogService';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'EM001', emp_name: 'Anne Employee' } }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/taskService', () => ({ getTasksForUser: vi.fn() }));
vi.mock('../../services/attendanceService', () => ({ getAttendanceForUser: vi.fn().mockResolvedValue([]) }));
vi.mock('../../services/leaveService', () => ({ getLeavesForUser: vi.fn().mockResolvedValue([]) }));
vi.mock('../../services/worklogService', () => ({
  getActiveWorkSession: vi.fn(), startWorkSession: vi.fn(), stopWorkSession: vi.fn(), confirmWorkSession: vi.fn(),
}));

afterEach(cleanup);

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('Employee dashboard task navigation and timer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTasksForUser.mockResolvedValue([{ task_id: 'TK/001', task_title: 'Prepare report', status: 'IN_PROGRESS', progress_percentage: 40 }]);
    getActiveWorkSession.mockResolvedValue(null);
  });

  it('opens the selected task progress page from the keyboard-accessible card', async () => {
    render(
      <MemoryRouter initialEntries={['/employee/dashboard']}>
        <Location />
        <Routes><Route path="/employee/dashboard" element={<EmployeeDashboard />} /><Route path="/employee/update-task" element={<div>Task progress page</div>} /></Routes>
      </MemoryRouter>,
    );
    const card = await screen.findByRole('link', { name: /Prepare report/ });
    expect(card.getAttribute('href')).toBe('/employee/update-task?id=TK%2F001');
    card.focus();
    expect(document.activeElement).toBe(card);
    fireEvent.click(card);
    expect(await screen.findByText('Task progress page')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/employee/update-task?id=TK%2F001');
  });

  it('keeps View All navigation separate from task navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/employee/dashboard']}>
        <Location />
        <Routes><Route path="/employee/dashboard" element={<EmployeeDashboard />} /><Route path="/employee/tasks" element={<div>All assigned tasks</div>} /></Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('link', { name: 'View All' }));
    expect(await screen.findByText('All assigned tasks')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/employee/tasks');
  });

  it('starts the same shared timer session from a dashboard task action', async () => {
    startWorkSession.mockResolvedValue({ session_id: 'WS-1', task_id: 'TK/001', task_title: 'Prepare report', status: 'ACTIVE', start_time: '2026-10-17T09:00:00Z', elapsed_ms: 0 });
    render(<MemoryRouter><EmployeeDashboard /></MemoryRouter>);
    const start = await screen.findByRole('button', { name: 'Start Timer' });
    await waitFor(() => expect(start.disabled).toBe(false));
    fireEvent.click(start);
    await waitFor(() => expect(startWorkSession).toHaveBeenCalledWith('TK/001'));
    expect(await screen.findByText(/Work timer started/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop Timer' })).toBeTruthy();
  });
});
