import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorkTimer, { formatElapsed } from './WorkTimer';

afterEach(cleanup);

describe('WorkTimer', () => {
  it('renders active task and elapsed time and stops the server session', () => {
    const stop = vi.fn();
    const timer = {
      session: { session_id: 'WS-1', task_id: 'TK001', task_title: 'Layout', start_time: new Date().toISOString(), status: 'ACTIVE', elapsed_ms: 3723000 },
      loading: false, busy: false, error: '', message: '', stop,
    };
    render(<WorkTimer timer={timer} tasks={[]} />);
    expect(screen.getByText(/Layout \(TK001\)/)).toBeTruthy();
    expect(screen.getByText('01:02:03')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Stop Timer' }));
    expect(stop).toHaveBeenCalled();
  });

  it('validates and confirms a stopped session description', async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    const timer = {
      session: { session_id: 'WS-2', task_id: 'TK001', task_title: 'Layout', start_time: '2026-10-17T09:00:00Z', stop_time: '2026-10-17T10:00:00Z', elapsed_ms: 3600000, status: 'STOPPED' },
      loading: false, busy: false, error: '', message: '', confirm,
    };
    render(<WorkTimer timer={timer} tasks={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Timer Work Log' }));
    expect(await screen.findByText(/Work description/)).toBeTruthy();
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Work summary/), { target: { value: 'Completed the assigned layout work.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Timer Work Log' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('Completed the assigned layout work.'));
  });

  it('formats durations safely', () => {
    expect(formatElapsed(0)).toBe('00:00:00');
    expect(formatElapsed(90 * 60 * 1000)).toBe('01:30:00');
    expect(formatElapsed(Number.NaN)).toBe('00:00:00');
  });

  it('shows an empty state when the active-session request succeeded with no session', () => {
    render(<WorkTimer timer={{ session: null, loading: false, busy: false, error: '', message: '' }} showEmptyState />);
    expect(screen.getByRole('status').textContent).toContain('No active work session');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('shows a retry action only when active-session retrieval failed', () => {
    const refresh = vi.fn();
    render(<WorkTimer timer={{ session: null, loading: false, busy: false, error: 'Request failed', message: '', refresh }} showEmptyState />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByText(/No active work session/)).toBeNull();
  });
});
