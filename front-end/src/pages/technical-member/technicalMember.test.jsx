// Click-through checks of the real Technical Member pages: success toasts only after
// the backend confirms, server messages on failure, lists refreshed from the backend.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as tm from '../../services/technicalMemberService';
import StoreProvider from '../../store/StoreProvider';
import AssignedIssues from './AssignedIssues';
import TmDashboard from './TmDashboard';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'TT001', emp_name: 'Wanda' }, role: 'TECHNICAL_MEMBER' }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
// Charts are a progressive enhancement; keep Chart.js out of jsdom.
vi.mock('../../utils/saCommon', async (importOriginal) => ({ ...(await importOriginal()), loadChartJs: vi.fn(() => new Promise(() => {})) }));
vi.mock('../../services/technicalMemberService', () => ({
  getTechnicalMemberStats: vi.fn(), getTechnicalMemberRecentUpdates: vi.fn(),
  getMyTechnicalIssues: vi.fn(), getMyTechnicalIssueById: vi.fn(),
  updateMyIssueStatus: vi.fn(), updateMyIssueProgress: vi.fn(), resolveMyIssue: vi.fn(),
  submitMyIssueForVerification: vi.fn(), addMyIssueComment: vi.fn(), addMyIssueWorkNote: vi.fn(),
  uploadMyIssueAttachment: vi.fn(), deleteMyIssueAttachment: vi.fn(), getMyIssueAttachment: vi.fn(),
}));

const issue = {
  ticket_id: 'TIX-11', ticket_type: 'TECHNICAL', title: 'Night shift sync failing', status: 'IN_PROGRESS', priority: 'High',
  progress_percentage: 60, company_id: 'C001', company_name: 'Acme', comments: [], internal_notes: [], attachments: [],
  created_date: '2026-11-18', updated_date: '2026-11-23',
};

beforeEach(() => {
  tm.getMyTechnicalIssues.mockResolvedValue([issue]);
  tm.getTechnicalMemberStats.mockResolvedValue({ assigned_issues: 7, open_issues: 2, in_progress_issues: 1, resolved_today: 0, high_priority_issues: 1, by_status: {}, by_priority: {}, work_progress: [] });
  tm.getTechnicalMemberRecentUpdates.mockResolvedValue([{ ticket_id: 'TIX-11', title: issue.title, kind: 'NOTE', message: 'Checked the worker logs', timestamp: '2026-11-23T10:00:00Z' }]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const renderPage = (ui) => render(<StoreProvider><MemoryRouter>{ui}</MemoryRouter></StoreProvider>);

async function openIssue() {
  renderPage(<AssignedIssues />);
  fireEvent.click(await screen.findByTitle('View / Manage'));
  return screen.findByRole('dialog');
}

describe('Assigned Issues detail', () => {
  it('sends a reply and shows it from the backend-returned issue', async () => {
    const dialog = await openIssue();
    const replied = { ...issue, comments: [{ author: 'Wanda', message: 'Fix deployed to staging', timestamp: '2026-11-24T09:00:00Z' }] };
    tm.addMyIssueComment.mockResolvedValueOnce(replied);
    tm.getMyTechnicalIssueById.mockResolvedValueOnce(replied);
    fireEvent.change(within(dialog).getByLabelText('Message the Platform Admin'), { target: { value: 'Fix deployed to staging' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Send$/ }));
    expect(await within(dialog).findByText('Fix deployed to staging')).toBeTruthy();
    expect(tm.addMyIssueComment).toHaveBeenCalledWith('TIX-11', 'Fix deployed to staging');
  });

  it('resolves: success toast after confirmation, then the queue refetches', async () => {
    const dialog = await openIssue();
    const resolved = { ...issue, status: 'RESOLVED', progress_percentage: 100 };
    tm.resolveMyIssue.mockResolvedValueOnce(resolved);
    tm.getMyTechnicalIssueById.mockResolvedValueOnce(resolved);
    const before = tm.getMyTechnicalIssues.mock.calls.length;
    fireEvent.click(within(dialog).getByRole('button', { name: /Mark as Resolved/ }));
    fireEvent.change(within(dialog).getByPlaceholderText('Describe what was done to resolve this issue...'), { target: { value: 'Fixed the date-boundary bug' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm Resolution/ }));
    expect(await screen.findByText('Issue marked as resolved.')).toBeTruthy();
    expect(tm.resolveMyIssue).toHaveBeenCalledWith('TIX-11', 'Fixed the date-boundary bug');
    await waitFor(() => expect(tm.getMyTechnicalIssues.mock.calls.length).toBeGreaterThan(before));
  });

  it('shows the server message and no success toast when resolving is refused', async () => {
    const dialog = await openIssue();
    tm.resolveMyIssue.mockRejectedValueOnce(new Error('Technical issue not found or not assigned to you'));
    fireEvent.click(within(dialog).getByRole('button', { name: /Mark as Resolved/ }));
    fireEvent.change(within(dialog).getByPlaceholderText('Describe what was done to resolve this issue...'), { target: { value: 'Fixed the date-boundary bug' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm Resolution/ }));
    await waitFor(() => expect(tm.resolveMyIssue).toHaveBeenCalledWith('TIX-11', 'Fixed the date-boundary bug'));
    expect(await screen.findByText('Technical issue not found or not assigned to you')).toBeTruthy();
    expect(screen.queryByText('Issue marked as resolved.')).toBeNull();
    expect(tm.getMyTechnicalIssueById).not.toHaveBeenCalled();
  });
});

describe('Technical Member dashboard', () => {
  it('shows backend stats, the active queue and the activity feed', async () => {
    renderPage(<TmDashboard />);
    // The title shows in the active queue and in the activity feed.
    expect((await screen.findAllByText('Night shift sync failing')).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Checked the worker logs/)).toBeTruthy();
    expect(tm.getMyTechnicalIssues).toHaveBeenCalledWith({ scope: 'active' });
    expect(tm.getTechnicalMemberRecentUpdates).toHaveBeenCalledWith(10);
    expect(tm.getTechnicalMemberStats).toHaveBeenCalled();
  });
});

describe('Issue modal busy guard', () => {
  it('a double-click sends one reply and never reports a false error', async () => {
    const dialog = await openIssue();
    const replied = { ...issue, comments: [{ author: 'Wanda', message: 'Rolled back the release', timestamp: '2026-11-25T09:00:00Z' }] };
    tm.addMyIssueComment.mockResolvedValue(replied);
    // Hold the re-read open, as a slow backend would, while the second click lands.
    let finishRefresh;
    tm.getMyTechnicalIssueById.mockReturnValue(new Promise((r) => { finishRefresh = () => r(replied); }));

    fireEvent.change(within(dialog).getByLabelText('Message the Platform Admin'), { target: { value: 'Rolled back the release' } });
    const send = within(dialog).getByRole('button', { name: /Send$/ });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(tm.getMyTechnicalIssueById).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20)); // let a second action, if any, run

    expect(tm.addMyIssueComment).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/condition callback/i)).toBeNull();
    expect(screen.queryByText('Failed to send message.')).toBeNull();
    finishRefresh();
    expect(await within(dialog).findByText('Rolled back the release', { selector: '.comment-message' })).toBeTruthy();
  });
});
