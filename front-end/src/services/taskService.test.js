import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { getTasksForUser, updateTaskStatus } from './taskService';
import { readStorage, writeStorage } from '../utils/helpers';

vi.mock('../config/config', () => ({ default: { apiUrl: 'http://api.test' } }));
vi.mock('./api', () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
vi.mock('../utils/helpers', () => ({ readStorage: vi.fn(() => []), writeStorage: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe('API-backed employee task service', () => {
  it('returns only the backend task list', async () => {
    const tasks = [{ task_id: 'TK-1', assigned_to: 'EM001' }];
    api.get.mockResolvedValueOnce(tasks);

    await expect(getTasksForUser('EM001')).resolves.toBe(tasks);
    expect(api.get).toHaveBeenCalledWith('/tasks/user/EM001');
    expect(readStorage).not.toHaveBeenCalled();
  });

  it('surfaces backend task list failures instead of showing stale local data', async () => {
    const failure = new Error('Task API unavailable');
    api.get.mockRejectedValueOnce(failure);

    await expect(getTasksForUser('EM001')).rejects.toBe(failure);
  });

  it('does not report a failed status update as successful or mutate local tasks', async () => {
    const failure = new Error('Task update rejected');
    api.patch.mockRejectedValueOnce(failure);

    await expect(updateTaskStatus('TK-1', 'IN_PROGRESS', 20)).rejects.toBe(failure);
    expect(writeStorage).not.toHaveBeenCalled();
  });
});
