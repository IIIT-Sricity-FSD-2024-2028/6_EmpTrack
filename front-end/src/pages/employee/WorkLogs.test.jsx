import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkLogs from './WorkLogs';
import { getTasksForUser } from '../../services/taskService';
import { confirmWorkSession, createWorkLog, getActiveWorkSession, getWorkLogsForUser, startWorkSession, stopWorkSession } from '../../services/worklogService';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'EM001' } }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/taskService', () => ({ getTasksForUser: vi.fn() }));
vi.mock('../../services/worklogService', () => ({
  getWorkLogsForUser: vi.fn(), createWorkLog: vi.fn(), getActiveWorkSession: vi.fn(),
  startWorkSession: vi.fn(), stopWorkSession: vi.fn(), confirmWorkSession: vi.fn(),
}));

afterEach(cleanup);

describe('Employee work logs and timer recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTasksForUser.mockResolvedValue([{ task_id: 'TK001', task_title: 'Layout', status: 'IN_PROGRESS' }]);
    getWorkLogsForUser.mockResolvedValue([]);
    getActiveWorkSession.mockResolvedValue({
      session_id: 'WS-1', task_id: 'TK001', task_title: 'Layout',
      start_time: '2026-10-17T09:00:00.000Z', stop_time: '2026-10-17T10:00:00.000Z',
      elapsed_ms: 3600000, status: 'STOPPED',
    });
    confirmWorkSession.mockResolvedValue({ worklog_id: 'WL-1' });
  });

  it('shows a stopped session for recovery and preserves manual log entry', async () => {
    render(<MemoryRouter><WorkLogs /></MemoryRouter>);
    expect(await screen.findByText(/Recorded duration:/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Timer Work Log' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Work Log' })).toBeTruthy();
    expect(screen.getByLabelText(/Work Start Time/)).toBeTruthy();
  });

  it('saves a stopped timer summary and refreshes logs without removing manual entry', async () => {
    render(<MemoryRouter><WorkLogs /></MemoryRouter>);
    expect(await screen.findByText(/Recorded duration:/)).toBeTruthy();
    const description = screen.getByLabelText(/Work summary/);
    fireEvent.change(description, { target: { value: 'Finished the responsive layout.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Timer Work Log' }));
    await waitFor(() => expect(confirmWorkSession).toHaveBeenCalledWith('WS-1', 'Finished the responsive layout.'));
    expect(createWorkLog).not.toHaveBeenCalled();
    expect(screen.getByText('Log Work Activity')).toBeTruthy();
  });

  it('starts and stops the selected task timer from Work Logs, then collects its description', async () => {
    getActiveWorkSession.mockResolvedValueOnce(null);
    const active = {
      session_id: 'WS-2', task_id: 'TK001', task_title: 'Layout', start_time: '2026-10-17T09:00:00.000Z', elapsed_ms: 3600000, status: 'ACTIVE',
    };
    startWorkSession.mockResolvedValue(active);
    stopWorkSession.mockResolvedValue({ ...active, stop_time: '2026-10-17T10:00:00.000Z', elapsed_ms: 3600000, status: 'STOPPED' });

    render(<MemoryRouter><WorkLogs /></MemoryRouter>);
    const taskSelect = await screen.findByLabelText(/Task ID/);
    fireEvent.change(taskSelect, { target: { value: 'TK001' } });
    const start = screen.getByRole('button', { name: 'Start timer for selected task' });
    await waitFor(() => expect(start.disabled).toBe(false));
    fireEvent.click(start);
    await waitFor(() => expect(startWorkSession).toHaveBeenCalledWith('TK001'));
    expect(await screen.findByRole('timer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Stop Timer' }));
    await waitFor(() => expect(stopWorkSession).toHaveBeenCalledWith('WS-2'));
    expect(await screen.findByLabelText(/Work summary/)).toBeTruthy();
  });

  it('shows the timer API error and does not claim that a failed start succeeded', async () => {
    getActiveWorkSession.mockResolvedValueOnce(null);
    startWorkSession.mockRejectedValueOnce(new Error('Task is not assigned to you.'));
    render(<MemoryRouter><WorkLogs /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText(/Task ID/), { target: { value: 'TK001' } });
    const start = screen.getByRole('button', { name: 'Start timer for selected task' });
    await waitFor(() => expect(start.disabled).toBe(false));
    fireEvent.click(start);
    expect((await screen.findByRole('alert')).textContent).toContain('Task is not assigned to you.');
    expect(screen.queryByText('Work timer started.')).toBeNull();
  });

  it('shows a work-log API failure instead of presenting an empty history', async () => {
    getWorkLogsForUser.mockRejectedValueOnce(new Error('Work log API unavailable'));
    render(<MemoryRouter><WorkLogs /></MemoryRouter>);
    expect((await screen.findByRole('alert')).textContent).toContain('Failed to load work log data: Work log API unavailable');
  });
});
