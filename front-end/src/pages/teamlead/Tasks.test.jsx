import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Tasks from './Tasks';
import { createTask, deleteTask, updateTask } from '../../services/teamLeadService';
import { useTeamData } from './components/TeamLeadUI';

vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/teamLeadService', () => ({
  createTask: vi.fn(), deleteTask: vi.fn(), updateTask: vi.fn(),
}));
vi.mock('./components/TeamLeadUI', () => ({
  DemoNotice: () => null,
  LoadState: ({ children }) => children,
  StatCard: () => null,
  useTeamData: vi.fn(),
  useToast: () => [null, vi.fn()],
}));

const savedTask = {
  task_id: 'TK001', assigned_to: 'EM001', task_title: 'Build the layout', task_description: '',
  est_hours: 6, deadline: '2026-12-31', priority: 'MEDIUM', status: 'IN_PROGRESS', progress_percentage: 40,
};

describe('Team Lead task estimate editing', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    useTeamData.mockReturnValue({
      data: { members: [{ emp_id: 'EM001', emp_name: 'Anne Employee' }], tasks: [{ ...savedTask }] },
      error: null, reload: vi.fn().mockResolvedValue(undefined),
    });
    updateTask.mockResolvedValue({ ...savedTask, est_hours: 8 });
  });

  it('populates the saved estimate, sends edits, and refreshes the list', async () => {
    const tasks = [{ ...savedTask }];
    const reload = vi.fn(async () => { tasks[0].est_hours = 8; });
    useTeamData.mockReturnValue({
      data: { members: [{ emp_id: 'EM001', emp_name: 'Anne Employee' }], tasks }, error: null, reload,
    });
    render(<Tasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit TK001' }));
    const dialog = screen.getByRole('dialog');
    const estimate = within(dialog).getByRole('spinbutton', { name: /Estimated Hours/ });
    expect(estimate.value).toBe('6');
    fireEvent.change(estimate, { target: { value: '8' } });
    expect(estimate.value).toBe('8');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith('TK001', { est_hours: 8 }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(reload).toHaveBeenCalled();
    expect(screen.getByText('8h')).toBeTruthy();
  });

  it.each(['', '0', '-1', 'abc', '1001'])('shows a field error and blocks saving an invalid estimate: %s', async (value) => {
    render(<Tasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit TK001' }));
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('spinbutton', { name: /Estimated Hours/ }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText(/Estimated hours/)).toBeTruthy();
    expect(updateTask).not.toHaveBeenCalled();
  });

  it('discards an unsaved estimate when cancelled and opens with the saved value again', () => {
    render(<Tasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit TK001' }));
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('spinbutton', { name: /Estimated Hours/ }), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(updateTask).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit TK001' }));
    expect(within(screen.getByRole('dialog')).getByRole('spinbutton', { name: /Estimated Hours/ }).value).toBe('6');
  });

  it('keeps tasks without a saved estimate blank until a valid estimate is entered', () => {
    useTeamData.mockReturnValue({
      data: { members: [{ emp_id: 'EM001', emp_name: 'Anne Employee' }], tasks: [{ ...savedTask, est_hours: undefined }] },
      error: null, reload: vi.fn(),
    });
    render(<Tasks />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit TK001' }));
    expect(within(screen.getByRole('dialog')).getByRole('spinbutton', { name: /Estimated Hours/ }).value).toBe('');
  });
});
