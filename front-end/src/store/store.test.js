// Redux data-flow contract: state changes only after the backend confirms.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as company from '../services/companyAdminService';
import * as leave from '../services/leaveService';
import { queryKey } from './entitySlice';
import { employeesEntity, leavesEntity } from './entities';
import { makeStore } from './store';

vi.mock('../services/companyAdminService', () => ({
  getEmployees: vi.fn(), createEmployee: vi.fn(), updateEmployee: vi.fn(), deleteEmployee: vi.fn(),
}));
vi.mock('../services/leaveService', () => ({ getLeavesForUser: vi.fn(), createLeave: vi.fn() }));

afterEach(() => vi.resetAllMocks());

const A = { emp_id: 'EM001', emp_name: 'Anne' };
const B = { emp_id: 'EM002', emp_name: 'Bob' };
const ids = (store, op = 'fetchAll', arg) => store.getState().employees.queries[queryKey(op, arg)];

async function loaded() {
  const store = makeStore();
  company.getEmployees.mockResolvedValueOnce([A, B]);
  await store.dispatch(employeesEntity.thunks.fetchAll());
  return store;
}

describe('entity slices', () => {
  it('stores fetched records and tracks loading -> succeeded', async () => {
    const store = makeStore();
    let resolve;
    company.getEmployees.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const pending = store.dispatch(employeesEntity.thunks.fetchAll());
    expect(ids(store).status).toBe('loading');
    resolve([A, B]);
    await pending;
    expect(ids(store)).toMatchObject({ status: 'succeeded', ids: ['EM001', 'EM002'] });
    expect(store.getState().employees.entities.EM002).toEqual(B);
  });

  it('keeps existing records and stores the message when a fetch fails', async () => {
    const store = await loaded();
    company.getEmployees.mockRejectedValueOnce(Object.assign(new Error('Server down'), { status: 500 }));
    await store.dispatch(employeesEntity.thunks.fetchAll());
    expect(ids(store)).toMatchObject({ status: 'failed', error: { message: 'Server down', status: 500 }, ids: ['EM001', 'EM002'] });
  });

  it('stores the record the backend returns on update, and nothing on failure', async () => {
    const store = await loaded();
    company.updateEmployee.mockResolvedValueOnce({ ...A, emp_name: 'Anne (server)' });
    await store.dispatch(employeesEntity.thunks.update({ empId: 'EM001', data: { name: 'Anne 2' } }));
    expect(store.getState().employees.entities.EM001.emp_name).toBe('Anne (server)');

    company.updateEmployee.mockRejectedValueOnce(Object.assign(new Error('Invalid'), { fieldErrors: { name: ['Too short'] } }));
    const result = await store.dispatch(employeesEntity.thunks.update({ empId: 'EM001', data: { name: 'x' } }));
    expect(result.payload).toMatchObject({ message: 'Invalid', fieldErrors: { name: ['Too short'] } });
    expect(store.getState().employees.entities.EM001.emp_name).toBe('Anne (server)');
    expect(store.getState().employees.mutations.update.status).toBe('failed');
  });

  it('removes a record only after the backend confirms the delete', async () => {
    const store = await loaded();
    company.deleteEmployee.mockRejectedValueOnce(new Error('Forbidden'));
    await store.dispatch(employeesEntity.thunks.remove('EM002'));
    expect(ids(store).ids).toEqual(['EM001', 'EM002']);

    company.deleteEmployee.mockResolvedValueOnce({ success: true });
    await store.dispatch(employeesEntity.thunks.remove('EM002'));
    expect(ids(store).ids).toEqual(['EM001']);
    expect(store.getState().employees.entities.EM002).toBeUndefined();
  });

  it('adds a created record and marks lists stale so they refetch from the backend', async () => {
    const store = makeStore();
    leave.getLeavesForUser.mockResolvedValueOnce([]);
    await store.dispatch(leavesEntity.thunks.fetchForUser('EM001'));
    leave.createLeave.mockResolvedValueOnce({ leave_id: 'L1', status: 'PENDING' });
    await store.dispatch(leavesEntity.thunks.create({ empId: 'EM001' }));
    const q = store.getState().leaves.queries[queryKey('fetchForUser', 'EM001')];
    expect(store.getState().leaves.entities.L1.status).toBe('PENDING');
    expect(q.stale).toBe(true);
  });
});

describe('session changes', () => {
  it('clears every user-specific slice when the signed-in user changes', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: A, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = await loaded();
    expect(store.getState().auth.session.user.emp_id).toBe('EM001');
    store.dispatch({ type: 'auth/sessionExpired' });
    expect(store.getState().employees.ids).toEqual([]);
    expect(store.getState().employees.queries).toEqual({});
    localStorage.clear();
  });
});
