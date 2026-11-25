// Technical Member issues through Redux: they are the same TECHNICAL platform tickets the
// Platform Admin and Support Member see, so they live in the shared tickets slice.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as tm from '../services/technicalMemberService';
import { queryKey } from './entitySlice';
import { employeesEntity, notificationsEntity, platformOverviewEntity, ticketsEntity } from './entities';
import { makeStore } from './store';

vi.mock('../services/technicalMemberService', () => ({
  getTechnicalMemberStats: vi.fn(), getTechnicalMemberRecentUpdates: vi.fn(),
  getMyTechnicalIssues: vi.fn(), getMyTechnicalIssueById: vi.fn(),
  updateMyIssueStatus: vi.fn(), updateMyIssueProgress: vi.fn(), resolveMyIssue: vi.fn(),
  submitMyIssueForVerification: vi.fn(), addMyIssueComment: vi.fn(), addMyIssueWorkNote: vi.fn(),
  uploadMyIssueAttachment: vi.fn(), deleteMyIssueAttachment: vi.fn(), getMyIssueAttachment: vi.fn(),
}));
vi.mock('../services/notificationService', () => ({ getNotificationsForUser: vi.fn() }));
vi.mock('../services/employeeService', () => ({ updateUserPassword: vi.fn() }));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

const q = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];
const fail = (message, extra = {}) => Object.assign(new Error(message), extra);
const ACTIVE = { scope: 'active' };
const HISTORY = { scope: 'history' };
const issue = { ticket_id: 'TIX-11', ticket_type: 'TECHNICAL', status: 'IN_PROGRESS', progress_percentage: 60, comments: [], internal_notes: [], attachments: [] };

async function loaded() {
  const store = makeStore();
  tm.getMyTechnicalIssues.mockImplementation(async (f) => (f.scope === 'active' ? [issue] : []));
  tm.getTechnicalMemberStats.mockResolvedValue({ assigned_issues: 1 });
  tm.getTechnicalMemberRecentUpdates.mockResolvedValue([{ ticket_id: 'TIX-11', kind: 'NOTE', message: 'Looking into it' }]);
  await store.dispatch(ticketsEntity.thunks.fetchTechnicalAssigned(ACTIVE));
  await store.dispatch(ticketsEntity.thunks.fetchTechnicalAssigned(HISTORY));
  await store.dispatch(platformOverviewEntity.thunks.fetchTechnicalStats());
  await store.dispatch(platformOverviewEntity.thunks.fetchTechnicalRecentUpdates(10));
  return store;
}

describe('dashboard and queues', () => {
  it('loads active/history queues, stats and the activity feed', async () => {
    const store = await loaded();
    expect(tm.getMyTechnicalIssues).toHaveBeenCalledWith(ACTIVE);
    expect(q(store, 'tickets', 'fetchTechnicalAssigned', ACTIVE).ids).toEqual(['TIX-11']);
    expect(q(store, 'tickets', 'fetchTechnicalAssigned', HISTORY).ids).toEqual([]);
    expect(q(store, 'platformOverview', 'fetchTechnicalStats').value).toEqual({ assigned_issues: 1 });
    // Feed items have no id: kept as a list, not normalized into tickets.
    expect(q(store, 'platformOverview', 'fetchTechnicalRecentUpdates', 10).value).toHaveLength(1);
    expect(tm.getTechnicalMemberRecentUpdates).toHaveBeenCalledWith(10);
  });

  it('is the same record the Platform Admin sees (one tickets collection, no duplicate)', async () => {
    const store = await loaded();
    tm.getMyTechnicalIssueById.mockResolvedValueOnce({ ...issue, progress_percentage: 70 });
    await store.dispatch(ticketsEntity.thunks.fetchTechnicalById('TIX-11'));
    expect(store.getState().tickets.ids.filter((id) => id === 'TIX-11')).toHaveLength(1);
    expect(store.getState().tickets.entities['TIX-11'].progress_percentage).toBe(70);
  });
});

describe('issue workflow', () => {
  it('updates status/progress from the returned issue, then refetches queues, stats and feed', async () => {
    const store = await loaded();
    tm.updateMyIssueProgress.mockResolvedValueOnce({ ...issue, progress_percentage: 80 });
    await store.dispatch(ticketsEntity.thunks.tmUpdateProgress({ id: 'TIX-11', progress: 80, note: 'Patched' }));
    expect(tm.updateMyIssueProgress).toHaveBeenCalledWith('TIX-11', 80, 'Patched');
    expect(store.getState().tickets.entities['TIX-11'].progress_percentage).toBe(80);
    expect(q(store, 'tickets', 'fetchTechnicalAssigned', ACTIVE).stale).toBe(true);
    expect(q(store, 'platformOverview', 'fetchTechnicalStats').stale).toBe(true);
    expect(q(store, 'platformOverview', 'fetchTechnicalRecentUpdates', 10).stale).toBe(true);
  });

  it('a refused status transition leaves the issue and the lists untouched', async () => {
    const store = await loaded();
    tm.updateMyIssueStatus.mockRejectedValueOnce(fail('Cannot move from IN_PROGRESS to OPEN', { status: 400 }));
    const result = await store.dispatch(ticketsEntity.thunks.tmUpdateStatus({ id: 'TIX-11', status: 'OPEN' }));
    expect(result.payload).toMatchObject({ message: 'Cannot move from IN_PROGRESS to OPEN', status: 400 });
    expect(store.getState().tickets.entities['TIX-11'].status).toBe('IN_PROGRESS');
    expect(q(store, 'tickets', 'fetchTechnicalAssigned', ACTIVE).stale).toBeFalsy();
  });

  it('an issue reassigned away (404 from the ownership check) changes nothing', async () => {
    const store = await loaded();
    tm.addMyIssueComment.mockRejectedValueOnce(fail('Technical issue not found or not assigned to you', { status: 404 }));
    const result = await store.dispatch(ticketsEntity.thunks.tmComment({ id: 'TIX-11', message: 'hi' }));
    expect(result.payload.status).toBe(404);
    expect(store.getState().tickets.entities['TIX-11'].comments).toEqual([]);
  });

  it('adds replies and notes only once the backend returns them', async () => {
    const store = await loaded();
    const reply = { author: 'Wanda', message: 'Deployed a fix' };
    tm.addMyIssueComment.mockResolvedValueOnce({ ...issue, comments: [reply] });
    tm.addMyIssueWorkNote.mockResolvedValueOnce({ ...issue, comments: [reply], internal_notes: [{ message: 'Root cause: cron lock' }] });
    await store.dispatch(ticketsEntity.thunks.tmComment({ id: 'TIX-11', message: 'Deployed a fix' }));
    await store.dispatch(ticketsEntity.thunks.tmAddNote({ id: 'TIX-11', message: 'Root cause: cron lock' }));
    expect(store.getState().tickets.entities['TIX-11']).toMatchObject({ comments: [reply], internal_notes: [{ message: 'Root cause: cron lock' }] });
  });

  it('resolves and submits for verification from the returned issue', async () => {
    const store = await loaded();
    tm.resolveMyIssue.mockResolvedValueOnce({ ...issue, status: 'RESOLVED' });
    await store.dispatch(ticketsEntity.thunks.tmResolve({ id: 'TIX-11', notes: 'Fixed the cron lock' }));
    expect(tm.resolveMyIssue).toHaveBeenCalledWith('TIX-11', 'Fixed the cron lock');
    tm.submitMyIssueForVerification.mockResolvedValueOnce({ ...issue, status: 'RESOLVED', verification_status: 'PENDING_VERIFICATION' });
    await store.dispatch(ticketsEntity.thunks.tmSubmitVerification({ id: 'TIX-11', note: undefined }));
    expect(store.getState().tickets.entities['TIX-11'].verification_status).toBe('PENDING_VERIFICATION');
  });

  it('attachment upload/delete (metadata responses) refetch the issue lists instead of guessing', async () => {
    const store = await loaded();
    tm.uploadMyIssueAttachment.mockResolvedValueOnce({ attachment_id: 'ATT-1', file_name: 'log.txt' });
    await store.dispatch(ticketsEntity.thunks.tmUploadAttachment({ id: 'TIX-11', attachment: { file_name: 'log.txt' } }));
    expect(store.getState().tickets.entities['TIX-11'].attachments).toEqual([]); // not invented locally
    expect(q(store, 'tickets', 'fetchTechnicalAssigned', ACTIVE).stale).toBe(true);
    // Deleting someone else's upload is refused by the backend.
    tm.deleteMyIssueAttachment.mockRejectedValueOnce(fail('You can only remove attachments you uploaded.', { status: 403 }));
    const result = await store.dispatch(ticketsEntity.thunks.tmDeleteAttachment({ id: 'TIX-11', attachmentId: 'ATT-9' }));
    expect(result.payload.status).toBe(403);
  });
});

describe('notifications, password and session cleanup', () => {
  it('loads notifications and changes the password through the shared slices', async () => {
    const { getNotificationsForUser } = await import('../services/notificationService');
    const { updateUserPassword } = await import('../services/employeeService');
    getNotificationsForUser.mockResolvedValueOnce([{ id: 'N1', message: 'TIX-11 assigned to you' }]);
    updateUserPassword.mockResolvedValueOnce({ message: 'ok' });
    const store = makeStore();
    await store.dispatch(notificationsEntity.thunks.fetchForUser('TT001'));
    await store.dispatch(employeesEntity.thunks.updatePassword({ empId: 'TT001', currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' }));
    expect(store.getState().notifications.entities.N1.message).toBe('TIX-11 assigned to you');
    expect(updateUserPassword).toHaveBeenCalledWith('TT001', 'a', 'b', 'b');
  });

  it('drops issues, stats and the feed when the Technical Member logs out', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: { emp_id: 'TT001', role: 'TECHNICAL_MEMBER' }, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = await loaded();
    store.dispatch({ type: 'auth/sessionExpired' });
    expect(store.getState().tickets.ids).toEqual([]);
    expect(store.getState().platformOverview.queries).toEqual({});
  });
});
