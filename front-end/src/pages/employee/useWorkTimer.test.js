import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmWorkSession, getActiveWorkSession, startWorkSession, stopWorkSession } from '../../services/worklogService';
import useWorkTimer from './useWorkTimer';

vi.mock('../../services/worklogService', () => ({
  getActiveWorkSession: vi.fn(), startWorkSession: vi.fn(), stopWorkSession: vi.fn(), confirmWorkSession: vi.fn(),
}));

afterEach(cleanup);

describe('useWorkTimer recovery and actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveWorkSession.mockResolvedValue(null);
  });

  it('restores a persisted session on mount, then stops and confirms it', async () => {
    const active = { session_id: 'WS-1', task_id: 'TK001', status: 'ACTIVE' };
    const stopped = { ...active, status: 'STOPPED', stop_time: '2026-10-17T10:00:00.000Z', elapsed_ms: 3600000 };
    getActiveWorkSession.mockResolvedValueOnce(active);
    stopWorkSession.mockResolvedValue(stopped);
    confirmWorkSession.mockResolvedValue({ worklog_id: 'WL-1' });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useWorkTimer(onSaved));
    await waitFor(() => expect(result.current.session).toEqual(active));
    await act(async () => { await result.current.stop(); });
    expect(result.current.session).toEqual(stopped);
    await act(async () => { await result.current.confirm('Completed the work.'); });
    expect(confirmWorkSession).toHaveBeenCalledWith('WS-1', 'Completed the work.');
    expect(onSaved).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('surfaces active-session lookup failures rather than treating them as no timer', async () => {
    getActiveWorkSession.mockRejectedValueOnce(new Error('Network unavailable'));
    const { result } = renderHook(() => useWorkTimer());
    await waitFor(() => expect(result.current.error).toBe('Network unavailable'));
    expect(result.current.session).toBeNull();
  });
});
