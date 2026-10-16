import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EmployeeTasks from './EmployeeTasks';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'EM001' } }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/taskService', () => ({
  getTasksForUser: vi.fn().mockRejectedValue(new Error('Task API unavailable')),
  IS_TASK_DEMO: false,
}));

afterEach(cleanup);

describe('Employee task list', () => {
  it('shows API failures instead of presenting an empty task list', async () => {
    render(<MemoryRouter><EmployeeTasks /></MemoryRouter>);
    expect((await screen.findByRole('alert')).textContent).toContain('Failed to load assigned tasks: Task API unavailable');
    expect(screen.queryByText('No tasks currently assigned.')).toBeNull();
  });
});
