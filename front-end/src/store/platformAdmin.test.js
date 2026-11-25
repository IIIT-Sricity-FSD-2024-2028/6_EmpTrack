// Platform Admin data through Redux: backend-confirmed changes only, failures keep data.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as pa from '../services/platformAdminService';
import { queryKey } from './entitySlice';
import { companiesEntity, employeesEntity, notificationsEntity, paymentsEntity, platformOverviewEntity, ticketsEntity } from './entities';
import { makeStore } from './store';

vi.mock('../services/platformAdminService', () => ({
  getDashboardSummary: vi.fn(), getTeamWorkload: vi.fn(),
  getMyCompanies: vi.fn(), createCompanyAdmin: vi.fn(),
  getPayments: vi.fn(), getPaymentSummary: vi.fn(),
  getTeam: vi.fn(), createTeamMember: vi.fn(), updateTeamMember: vi.fn(), updateTeamMemberStatus: vi.fn(),
  getTickets: vi.fn(), getTicket: vi.fn(), assignTicket: vi.fn(), resolveTicket: vi.fn(), verifyTechnicalIssue: vi.fn(),
  getNotifications: vi.fn(),

}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();

});

const q = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];
const fail = (message, extra = {}) => Object.assign(new Error(message), extra);

describe('dashboard and workload', () => {
  it('stores backend aggregates as query values', async () => {
    const store = makeStore();
    pa.getDashboardSummary.mockResolvedValueOnce({ total_companies: 2, open_tickets: 5 });
    pa.getTeamWorkload.mockResolvedValueOnce({ support: [], technical: [] });
    await store.dispatch(platformOverviewEntity.thunks.fetchDashboardSummary());
    await store.dispatch(platformOverviewEntity.thunks.fetchTeamWorkload());
    expect(q(store, 'platformOverview', 'fetchDashboardSummary').value).toEqual({ total_companies: 2, open_tickets: 5 });
    expect(q(store, 'platformOverview', 'fetchTeamWorkload').value).toEqual({ support: [], technical: [] });
  });

  it('reports a failed summary without inventing numbers', async () => {
    const store = makeStore();
    pa.getDashboardSummary.mockRejectedValueOnce(fail('Forbidden', { status: 403 }));
    await store.dispatch(platformOverviewEntity.thunks.fetchDashboardSummary());
    expect(q(store, 'platformOverview', 'fetchDashboardSummary')).toMatchObject({ status: 'failed', value: null, error: { status: 403 } });

  });

});

describe('companies', () => {
  it('creates a company admin through the backend, then refetches; failures change nothing', async () => {
    const store = makeStore();
    pa.getMyCompanies.mockResolvedValueOnce([{ company_id: 'C001', admin_count: 1 }]);
    await store.dispatch(companiesEntity.thunks.fetchMine());

    pa.createCompanyAdmin.mockRejectedValueOnce(fail('Email already in use', { fieldErrors: { email: ['Email already in use'] } }));
    const bad = await store.dispatch(companiesEntity.thunks.createAdmin({ companyId: 'C001', data: { email: 'x@y.z' } }));
    expect(bad.payload.fieldErrors.email).toEqual(['Email already in use']);
    expect(q(store, 'companies', 'fetchMine').stale).toBeFalsy();

    pa.createCompanyAdmin.mockResolvedValueOnce({ emp_id: 'AD009' });
    await store.dispatch(companiesEntity.thunks.createAdmin({ companyId: 'C001', data: { email: 'a@b.c' } }));
    expect(pa.createCompanyAdmin).toHaveBeenLastCalledWith('C001', { email: 'a@b.c' });
    expect(q(store, 'companies', 'fetchMine').stale).toBe(true);
  });

});

describe('payments', () => {
  it('keeps each backend filter as its own query over shared records', async () => {
    const store = makeStore();
    const t1 = { transaction_id: 'TXN-1', company_id: 'C001', status: 'PAID' };
    const t2 = { transaction_id: 'TXN-2', company_id: 'C002', status: 'FAILED' };
    pa.getPayments.mockResolvedValueOnce([t1, t2]).mockResolvedValueOnce([t2]);
    await store.dispatch(paymentsEntity.thunks.fetchForPlatformAdmin());
    await store.dispatch(paymentsEntity.thunks.fetchForPlatformAdmin({ status: 'FAILED' }));
    expect(pa.getPayments).toHaveBeenLastCalledWith({ status: 'FAILED' });
    expect(q(store, 'payments', 'fetchForPlatformAdmin').ids).toEqual(['TXN-1', 'TXN-2']);
    expect(q(store, 'payments', 'fetchForPlatformAdmin', { status: 'FAILED' }).ids).toEqual(['TXN-2']);
  });

});

describe('support / technical team members', () => {
  const arg = { role: 'SUPPORT_MEMBER', filters: { status: 'ACTIVE' } };

  it('changes status only after the backend confirms, then refetches the filtered list', async () => {
    const store = makeStore();
    pa.getTeam.mockResolvedValueOnce([{ emp_id: 'ST001', status: 'ACTIVE' }]);
    await store.dispatch(employeesEntity.thunks.fetchPlatformTeam(arg));

    pa.updateTeamMemberStatus.mockRejectedValueOnce(fail('Member has open tickets'));
    await store.dispatch(employeesEntity.thunks.updatePlatformMemberStatus({ role: 'SUPPORT_MEMBER', id: 'ST001', status: 'INACTIVE' }));
    expect(store.getState().employees.entities.ST001.status).toBe('ACTIVE');

    pa.updateTeamMemberStatus.mockResolvedValueOnce({ emp_id: 'ST001', status: 'INACTIVE' });
    await store.dispatch(employeesEntity.thunks.updatePlatformMemberStatus({ role: 'SUPPORT_MEMBER', id: 'ST001', status: 'INACTIVE' }));
    expect(pa.updateTeamMemberStatus).toHaveBeenLastCalledWith('SUPPORT_MEMBER', 'ST001', 'INACTIVE');
    expect(store.getState().employees.entities.ST001.status).toBe('INACTIVE');
    expect(q(store, 'employees', 'fetchPlatformTeam', arg).stale).toBe(true);
  });
});

describe('tickets', () => {
  const list = { type: 'TECHNICAL', filters: { status: 'all', priority: 'all' } };

  it('stores the ticket the backend returns after a workflow action', async () => {
    const store = makeStore();
    pa.getTickets.mockResolvedValueOnce([{ ticket_id: 'TIX-1', status: 'OPEN', assigned_to: null }]);
    await store.dispatch(ticketsEntity.thunks.fetchAll(list));
    pa.assignTicket.mockResolvedValueOnce({ ticket_id: 'TIX-1', status: 'IN_PROGRESS', assigned_to: 'TT001' });
    await store.dispatch(ticketsEntity.thunks.assign({ type: 'TECHNICAL', id: 'TIX-1', assignedTo: 'TT001' }));
    expect(pa.assignTicket).toHaveBeenCalledWith('TECHNICAL', 'TIX-1', 'TT001');
    expect(store.getState().tickets.entities['TIX-1']).toMatchObject({ status: 'IN_PROGRESS', assigned_to: 'TT001' });
  });

  it('keeps the ticket unchanged when verification is refused', async () => {
    const store = makeStore();
    pa.getTicket.mockResolvedValueOnce({ ticket_id: 'TIX-2', status: 'PENDING_VERIFICATION' });
    await store.dispatch(ticketsEntity.thunks.fetchById({ type: 'TECHNICAL', id: 'TIX-2' }));
    pa.verifyTechnicalIssue.mockRejectedValueOnce(fail('Not submitted for verification', { status: 409 }));
    const result = await store.dispatch(ticketsEntity.thunks.verify({ id: 'TIX-2', note: 'ok' }));
    expect(result.payload).toMatchObject({ message: 'Not submitted for verification', status: 409 });
    expect(store.getState().tickets.entities['TIX-2'].status).toBe('PENDING_VERIFICATION');
  });
  
});


describe('notifications and session boundaries', () => {
  it('loads platform notifications into the shared slice', async () => {
    const store = makeStore();
    pa.getNotifications.mockResolvedValueOnce([{ id: 'N1', message: 'TIX-1 escalated' }]);
    await store.dispatch(notificationsEntity.thunks.fetchForPlatform('PA001'));
    expect(pa.getNotifications).toHaveBeenCalledWith('PA001');
    expect(store.getState().notifications.entities.N1.message).toBe('TIX-1 escalated');
  });

  it('drops companies, payments and tickets when the Platform Admin session ends', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: { emp_id: 'PA001', role: 'PLATFORM_ADMIN' }, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = makeStore();
    pa.getMyCompanies.mockResolvedValueOnce([{ company_id: 'C001' }]);
    pa.getTickets.mockResolvedValueOnce([{ ticket_id: 'TIX-1' }]);
    await store.dispatch(companiesEntity.thunks.fetchMine());
    await store.dispatch(ticketsEntity.thunks.fetchAll({ type: 'SUPPORT', filters: {} }));
    store.dispatch({ type: 'auth/sessionExpired' });
    const state = store.getState();
    expect([state.companies.ids, state.tickets.ids, state.payments.ids]).toEqual([[], [], []]);
  });

});
