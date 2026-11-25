// Team Lead operations through the shared slices: Redux changes only after the backend confirms.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as tl from '../services/teamLeadService';
import { queryKey } from './entitySlice';
import { escalationsEntity, issuesEntity, leavesEntity, tasksEntity } from './entities';
import { makeStore } from './store';

vi.mock('../services/teamLeadService', () => ({
  getTeamTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn(),
  getTeamLeaves: vi.fn(), updateLeaveStatus: vi.fn(),
  getIssues: vi.fn(), updateIssue: vi.fn(),
  getHrEscalations: vi.fn(), escalateToHr: vi.fn(),
}));

afterEach(() => vi.resetAllMocks());

const T1 = { task_id: 'TK001', status: 'IN_PROGRESS', deadline: '2026-12-01', hours_worked: 3 };
const query = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];

async function withTasks() {
  const store = makeStore();
  tl.getTeamTasks.mockResolvedValueOnce([T1]);
  await store.dispatch(tasksEntity.thunks.fetchForTeam('TL001'));
  return store;
}

describe('team tasks', () => {
  it('fetches team tasks into the shared tasks slice', async () => {
    const store = await withTasks();
    expect(tl.getTeamTasks).toHaveBeenCalledWith('TL001');
    expect(query(store, 'tasks', 'fetchForTeam', 'TL001')).toMatchObject({ status: 'succeeded', ids: ['TK001'] });
  });

  it('creates from the returned record and refetches the team list', async () => {
    const store = await withTasks();
    tl.createTask.mockResolvedValueOnce({ task_id: 'TK002', status: 'NOT_STARTED' });
    await store.dispatch(tasksEntity.thunks.create({ task_title: 'New' }));
    expect(store.getState().tasks.entities.TK002.status).toBe('NOT_STARTED');
    expect(query(store, 'tasks', 'fetchForTeam', 'TL001').stale).toBe(true);
  });

  it('merges the updated record (keeping hours_worked) and leaves data alone on failure', async () => {
    const store = await withTasks();
    tl.updateTask.mockResolvedValueOnce({ task_id: 'TK001', status: 'IN_PROGRESS', deadline: '2026-12-15' });
    await store.dispatch(tasksEntity.thunks.update({ taskId: 'TK001', changes: { deadline: '2026-12-15' } }));
    expect(tl.updateTask).toHaveBeenCalledWith('TK001', { deadline: '2026-12-15' });
    expect(store.getState().tasks.entities.TK001).toMatchObject({ deadline: '2026-12-15', hours_worked: 3 });

    tl.updateTask.mockRejectedValueOnce(new Error('Deadline is in the past'));
    const result = await store.dispatch(tasksEntity.thunks.update({ taskId: 'TK001', changes: { deadline: '2020-01-01' } }));
    expect(result.payload.message).toBe('Deadline is in the past');
    expect(store.getState().tasks.entities.TK001.deadline).toBe('2026-12-15');
  });

  it('deletes only after the backend confirms', async () => {
    const store = await withTasks();
    tl.deleteTask.mockRejectedValueOnce(new Error('Forbidden'));
    await store.dispatch(tasksEntity.thunks.remove('TK001'));
    expect(query(store, 'tasks', 'fetchForTeam', 'TL001').ids).toEqual(['TK001']);
    tl.deleteTask.mockResolvedValueOnce({ success: true });
    await store.dispatch(tasksEntity.thunks.remove('TK001'));
    expect(query(store, 'tasks', 'fetchForTeam', 'TL001').ids).toEqual([]);
  });
});

describe('team leave decisions', () => {
  it('approves/rejects through the backend, then refetches; a refusal changes nothing', async () => {
    const store = makeStore();
    const pending = { leave_id: 'L1', emp_id: 'EM001', status: 'PENDING' };
    tl.getTeamLeaves.mockResolvedValueOnce([pending]);
    await store.dispatch(leavesEntity.thunks.fetchForTeam(['EM001']));

    tl.updateLeaveStatus.mockRejectedValueOnce(Object.assign(new Error('Reason required'), { fieldErrors: { reject_reason: ['Required'] } }));
    const failed = await store.dispatch(leavesEntity.thunks.updateTeamStatus({ leaveId: 'L1', status: 'REJECTED', approverId: 'TL001' }));
    expect(failed.payload.fieldErrors.reject_reason).toEqual(['Required']);
    expect(store.getState().leaves.entities.L1.status).toBe('PENDING');
    expect(query(store, 'leaves', 'fetchForTeam', ['EM001']).stale).toBeFalsy();

    tl.updateLeaveStatus.mockResolvedValueOnce({ ...pending, status: 'REJECTED' });
    await store.dispatch(leavesEntity.thunks.updateTeamStatus({ leaveId: 'L1', status: 'REJECTED', approverId: 'TL001', rejectReason: 'Busy week' }));
    expect(tl.updateLeaveStatus).toHaveBeenLastCalledWith('L1', 'REJECTED', 'TL001', 'Busy week');
    expect(store.getState().leaves.entities.L1.status).toBe('REJECTED');
    expect(query(store, 'leaves', 'fetchForTeam', ['EM001']).stale).toBe(true);
  });
});

describe('issues and escalations', () => {
  it('stores the issue record returned by the backend', async () => {
    const store = makeStore();
    tl.getIssues.mockResolvedValueOnce([{ issue_id: 'I1', status: 'Open' }]);
    await store.dispatch(issuesEntity.thunks.fetchForTeam());
    tl.updateIssue.mockResolvedValueOnce({ issue_id: 'I1', status: 'In Progress', assigned_to: 'Anne' });
    await store.dispatch(issuesEntity.thunks.updateForTeam({ issueId: 'I1', changes: { status: 'In Progress' } }));
    expect(store.getState().issues.entities.I1).toMatchObject({ status: 'In Progress', assigned_to: 'Anne' });
  });

  it('keys reshaped HR escalations by their backend id and refetches after a new one', async () => {
    const store = makeStore();
    tl.getHrEscalations.mockResolvedValueOnce([{ id: 'ESC-1', title: 'Conduct', status: 'PENDING' }]);
    await store.dispatch(escalationsEntity.thunks.fetchMine());
    expect(store.getState().escalations.entities['ESC-1'].title).toBe('Conduct');

    tl.escalateToHr.mockResolvedValueOnce({ id: 'ESC-2', status: 'PENDING' });
    const done = await store.dispatch(escalationsEntity.thunks.escalateToHr({ escalation: { title: 'x' }, actorId: 'TL001' }));
    expect(tl.escalateToHr).toHaveBeenCalledWith({ title: 'x' }, 'TL001');
    expect(done.payload.id).toBe('ESC-2');
    expect(query(store, 'escalations', 'fetchMine').stale).toBe(true);
  });
});
