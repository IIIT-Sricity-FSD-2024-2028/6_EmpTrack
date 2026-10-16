import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EmployeeTasks from './EmployeeTasks';
import { getTasksForUser } from '../../services/taskService';
import { getActiveWorkSession, startWorkSession } from '../../services/worklogService';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'EM001' } }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/taskService', () => ({
  getTasksForUser: vi.fn(),
  IS_TASK_DEMO: false,
}));
vi.mock('../../services/worklogService', () => ({
  getActiveWorkSession: vi.fn(), startWorkSession: vi.fn(), stopWorkSession: vi.fn(), confirmWorkSession: vi.fn(),
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  getTasksForUser.mockRejectedValue(new Error('Task API unavailable'));
  getActiveWorkSession.mockResolvedValue(null);
});

describe('Employee task list', () => {
  it('shows API failures instead of presenting an empty task list', async () => {
    render(<MemoryRouter><EmployeeTasks /></MemoryRouter>);
    expect((await screen.findByRole('alert')).textContent).toContain('Failed to load assigned tasks: Task API unavailable');
    expect(screen.queryByText('No tasks currently assigned.')).toBeNull();
  });

  it('starts a timer directly from an assigned task and prevents a second start', async () => {
    getTasksForUser.mockResolvedValue([
      { task_id: 'TK-A', task_title: 'Assigned task', status: 'IN_PROGRESS' },
      { task_id: 'TK-B', task_title: 'Another task', status: 'NOT_STARTED' },
    ]);
    const active = { session_id: 'WS-1', task_id: 'TK-A', task_title: 'Assigned task', status: 'ACTIVE', start_time: new Date().toISOString(), elapsed_ms: 0 };
    startWorkSession.mockResolvedValue(active);
    render(<MemoryRouter><EmployeeTasks /></MemoryRouter>);
    const start = await screen.findAllByRole('button', { name: 'Start Work' });
    fireEvent.click(start[0]);
    await waitFor(() => expect(startWorkSession).toHaveBeenCalledWith('TK-A'));
    expect(await screen.findByText('Tracking')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Work' }).disabled).toBe(true);
  });
});
