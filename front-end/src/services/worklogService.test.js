import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { confirmWorkSession, getActiveWorkSession, startWorkSession, stopWorkSession } from './worklogService';

vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('work timer API contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses authenticated endpoints and sends only task ID and final description', async () => {
    api.get.mockResolvedValueOnce({ session_id: 'WS-1' });
    api.post.mockResolvedValue({});
    await getActiveWorkSession();
    await startWorkSession('TK001');
    await stopWorkSession('WS-1');
    await confirmWorkSession('WS-1', 'Implemented a feature.');
    expect(api.get).toHaveBeenCalledWith('/worklogs/timer/active');
    expect(api.post).toHaveBeenNthCalledWith(1, '/worklogs/timer/start', { task_id: 'TK001' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/worklogs/timer/WS-1/stop', {});
    expect(api.post).toHaveBeenNthCalledWith(3, '/worklogs/timer/WS-1/confirm', { description: 'Implemented a feature.' });
  });
});
