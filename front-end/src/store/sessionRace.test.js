// Requests that finish after the signed-in session changed must not touch the new
// session's state. Each test holds a backend response open, changes the session
// through the real auth actions, then lets the old response arrive.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import * as company from '../services/companyAdminService';
import * as worklog from '../services/worklogService';
import { login, logout, sessionSynced } from './authSlice';
import { queryKey } from './entitySlice';
import { employeesEntity } from './entities';
import { makeStore } from './store';
import { fetchActiveSession } from './workSessionSlice';

vi.mock('../services/authService', () => ({
  getStoredSession: vi.fn(), login: vi.fn(), logout: vi.fn(), verifySession: vi.fn(),
}));
vi.mock('../services/companyAdminService', () => ({ getEmployees: vi.fn(), updateEmployee: vi.fn() }));
vi.mock('../services/worklogService', () => ({ getActiveWorkSession: vi.fn() }));

const session = (emp_id, token) => ({ user: { emp_id, emp_name: emp_id, role: 'COMPANY_ADMIN' }, token, expiresAt: Date.now() + 60_000 });
const A = session('AD001', 'token-a');
const B = session('AD002', 'token-b');

/** A promise the test resolves by hand: the "backend response" held open. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const all = (store) => store.getState().employees.queries[queryKey('fetchAll')];

beforeEach(() => {
  authService.getStoredSession.mockReturnValue(A); // the store starts signed in as A
  authService.logout.mockResolvedValue(undefined);
});

afterEach(() => vi.resetAllMocks());

async function switchToB(store) {
  await store.dispatch(logout());
  authService.login.mockResolvedValueOnce(B);
  await store.dispatch(login({ email: 'b@acme.test', password: 'x' }));
  expect(store.getState().auth.session.user.emp_id).toBe('AD002');
}

describe('Scenario A - stale query', () => {
  it("A's list response, arriving after B signed in, never reaches B's state", async () => {
    const store = makeStore();
    const aResponse = deferred();
    company.getEmployees.mockReturnValueOnce(aResponse.promise);
    const aRequest = store.dispatch(employeesEntity.thunks.fetchAll());

    await switchToB(store);
    // B opens the same list while A's request is still out.
    const bResponse = deferred();
    company.getEmployees.mockReturnValueOnce(bResponse.promise);
    const bRequest = store.dispatch(employeesEntity.thunks.fetchAll());

    aResponse.resolve([{ emp_id: 'EM-A1', emp_name: "A's employee" }]);
    await aRequest;
    expect(store.getState().employees.entities['EM-A1']).toBeUndefined();
    expect(all(store)).toMatchObject({ status: 'loading', ids: [] });

    bResponse.resolve([{ emp_id: 'EM-B1', emp_name: "B's employee" }]);
    await bRequest;
    expect(all(store)).toMatchObject({ status: 'succeeded', ids: ['EM-B1'] });
    expect(store.getState().employees.ids).toEqual(['EM-B1']);
  });

  it("A's late response is ignored even if B never asked for that list", async () => {
    const store = makeStore();
    const aResponse = deferred();
    company.getEmployees.mockReturnValueOnce(aResponse.promise);
    const aRequest = store.dispatch(employeesEntity.thunks.fetchAll());
    await switchToB(store);

    aResponse.resolve([{ emp_id: 'EM-A1' }]);
    await expect(aRequest).resolves.toBeTruthy(); // no crash in the reducer
    expect(store.getState().employees.ids).toEqual([]);
    expect(store.getState().employees.queries).toEqual({});
  });

  it("A's late failure does not mark B's list as failed", async () => {
    const store = makeStore();
    const aResponse = deferred();
    company.getEmployees.mockReturnValueOnce(aResponse.promise);
    const aRequest = store.dispatch(employeesEntity.thunks.fetchAll());
    await switchToB(store);
    company.getEmployees.mockResolvedValueOnce([{ emp_id: 'EM-B1' }]);
    await store.dispatch(employeesEntity.thunks.fetchAll());

    aResponse.reject(Object.assign(new Error('Unauthorized'), { status: 401 }));
    await aRequest;
    expect(all(store)).toMatchObject({ status: 'succeeded', error: null, ids: ['EM-B1'] });
  });
});

describe('Scenario B - stale mutation', () => {
  it("A's update, confirmed after the switch, cannot write into B's state", async () => {
    const store = makeStore();
    const aResponse = deferred();
    company.updateEmployee.mockReturnValueOnce(aResponse.promise);
    const aUpdate = store.dispatch(employeesEntity.thunks.update({ empId: 'EM-A1', data: { name: 'x' } }));

    // Another tab signs in as B (no logout in this tab).
    store.dispatch(sessionSynced(B));
    company.getEmployees.mockResolvedValueOnce([{ emp_id: 'EM-B1' }]);
    await store.dispatch(employeesEntity.thunks.fetchAll());

    aResponse.resolve({ emp_id: 'EM-A1', emp_name: "A's employee (updated)" });
    await aUpdate;
    const s = store.getState().employees;
    expect(s.entities['EM-A1']).toBeUndefined();
    expect(s.mutations.update).toBeUndefined(); // A's request status is not B's
    expect(all(store).stale).toBeFalsy(); // and it did not trigger refetches for B
  });
});

describe('Scenario C - stale work timer', () => {
  it("B never sees A's running timer", async () => {
    const store = makeStore();
    const aResponse = deferred();
    worklog.getActiveWorkSession.mockReturnValueOnce(aResponse.promise);
    const aRequest = store.dispatch(fetchActiveSession());

    await switchToB(store);
    worklog.getActiveWorkSession.mockResolvedValueOnce(null); // B has no timer
    await store.dispatch(fetchActiveSession());

    aResponse.resolve({ session_id: 'WS-A', task_id: 'TK-A', status: 'ACTIVE' });
    await aRequest;
    expect(store.getState().workSession).toMatchObject({ session: null, loading: false, error: '' });
  });
});

describe('same-session requests still apply', () => {
  it('a slow query and mutation that finish in the same session update the state', async () => {
    const store = makeStore();
    const list = deferred();
    company.getEmployees.mockReturnValueOnce(list.promise);
    const q = store.dispatch(employeesEntity.thunks.fetchAll());
    list.resolve([{ emp_id: 'EM-A1', emp_name: 'Anne' }]);
    await q;
    expect(all(store).ids).toEqual(['EM-A1']);

    company.updateEmployee.mockResolvedValueOnce({ emp_id: 'EM-A1', emp_name: 'Anne B.' });
    await store.dispatch(employeesEntity.thunks.update({ empId: 'EM-A1', data: {} }));
    expect(store.getState().employees.entities['EM-A1'].emp_name).toBe('Anne B.');

    worklog.getActiveWorkSession.mockResolvedValueOnce({ session_id: 'WS-1', status: 'ACTIVE' });
    await store.dispatch(fetchActiveSession());
    expect(store.getState().workSession.session.session_id).toBe('WS-1');
  });

  it('logging out and back in as the same user is a new session: the old response is ignored', async () => {
    const store = makeStore();
    const old = deferred();
    company.getEmployees.mockReturnValueOnce(old.promise);
    const oldRequest = store.dispatch(employeesEntity.thunks.fetchAll());
    await store.dispatch(logout());
    authService.login.mockResolvedValueOnce(session('AD001', 'token-a2'));
    await store.dispatch(login({ email: 'a@acme.test', password: 'x' }));

    old.resolve([{ emp_id: 'EM-OLD' }]);
    await oldRequest;
    expect(store.getState().employees.entities['EM-OLD']).toBeUndefined();
  });
});
