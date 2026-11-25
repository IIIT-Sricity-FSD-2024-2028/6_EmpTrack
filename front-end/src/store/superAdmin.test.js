// Super Admin data through Redux: backend-confirmed changes only, failures keep data.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as sa from '../services/superAdminService';
import { queryKey } from './entitySlice';
import {
  activityLogsEntity, companiesEntity, criticalEscalationsEntity, employeesEntity, paymentsEntity,
  platformOverviewEntity, platformSettingsEntity, registrationsEntity, subscriptionsEntity,
} from './entities';
import { makeStore } from './store';

vi.mock('../services/superAdminService', () => ({
  getAnalyticsOverview: vi.fn(), getCompanyGrowth: vi.fn(), getRevenueSummary: vi.fn(), getRevenueTransactions: vi.fn(),
  getCompanies: vi.fn(), createCompany: vi.fn(), updateCompany: vi.fn(), updateCompanyStatus: vi.fn(),
  getRegistrations: vi.fn(), startRegistrationReview: vi.fn(), approveRegistration: vi.fn(), rejectRegistration: vi.fn(),
  getSubscriptionPlans: vi.fn(), createSubscriptionPlan: vi.fn(), updateSubscriptionPlan: vi.fn(),
  getPlatformAdmins: vi.fn(), updatePlatformAdminStatus: vi.fn(),
  getActivityLogs: vi.fn(),
  getCriticalEscalations: vi.fn(), resolveCriticalEscalation: vi.fn(),
  getPlatformSettings: vi.fn(), updatePlatformSettings: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

const q = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];
const fail = (message, extra = {}) => Object.assign(new Error(message), extra);

describe('dashboard, analytics and revenue', () => {
  it('stores aggregates as values and passes the selected range to the backend', async () => {
    const store = makeStore();
    sa.getAnalyticsOverview.mockResolvedValueOnce({ total_companies: 3, monthly_revenue: 1200 });
    sa.getCompanyGrowth.mockResolvedValueOnce([{ period: '2026-10', total: 3 }]);
    await store.dispatch(platformOverviewEntity.thunks.fetchAnalyticsOverview());
    await store.dispatch(platformOverviewEntity.thunks.fetchCompanyGrowth({ range: 'custom', from: '2026-01-01', to: '2026-06-30' }));
    expect(sa.getCompanyGrowth).toHaveBeenCalledWith('custom', '2026-01-01', '2026-06-30');
    expect(q(store, 'platformOverview', 'fetchAnalyticsOverview').value.monthly_revenue).toBe(1200);
  });

  it('keeps revenue transactions in the shared payments slice; a failure keeps the last list', async () => {
    const store = makeStore();
    const filters = { companyId: '', status: '' };
    sa.getRevenueTransactions.mockResolvedValueOnce([{ transaction_id: 'TXN-1', amount: 500 }]);
    await store.dispatch(paymentsEntity.thunks.fetchRevenueTransactions(filters));
    sa.getRevenueTransactions.mockRejectedValueOnce(fail('Server error', { status: 500 }));
    await store.dispatch(paymentsEntity.thunks.fetchRevenueTransactions(filters));
    expect(q(store, 'payments', 'fetchRevenueTransactions', filters)).toMatchObject({ status: 'failed', ids: ['TXN-1'] });
    expect(store.getState().payments.entities['TXN-1'].amount).toBe(500);
  });
});

describe('companies', () => {
  const filters = { search: '', status: 'all' };

  it('creates (wrapped response) by refetching, and stores updated records', async () => {
    const store = makeStore();
    sa.getCompanies.mockResolvedValueOnce([{ company_id: 'C001', company_name: 'Acme', status: 'ACTIVE' }]);
    await store.dispatch(companiesEntity.thunks.fetchAll(filters));

    sa.createCompany.mockResolvedValueOnce({ company: { company_id: 'C009' } });
    await store.dispatch(companiesEntity.thunks.create({ company_name: 'New' }));
    expect(q(store, 'companies', 'fetchAll', filters).stale).toBe(true);

    sa.updateCompany.mockResolvedValueOnce({ company_id: 'C001', company_name: 'Acme Corp', status: 'ACTIVE' });
    await store.dispatch(companiesEntity.thunks.update({ id: 'C001', data: { company_name: 'Acme Corp' } }));
    expect(sa.updateCompany).toHaveBeenCalledWith('C001', { company_name: 'Acme Corp' });
    expect(store.getState().companies.entities.C001.company_name).toBe('Acme Corp');
  });

  it('leaves a company unchanged when a status change is refused', async () => {
    const store = makeStore();
    sa.getCompanies.mockResolvedValueOnce([{ company_id: 'C001', status: 'ACTIVE' }]);
    await store.dispatch(companiesEntity.thunks.fetchAll(filters));
    sa.updateCompanyStatus.mockRejectedValueOnce(fail('Forbidden', { status: 403 }));
    const result = await store.dispatch(companiesEntity.thunks.updateStatus({ id: 'C001', status: 'SUSPENDED' }));
    expect(result.payload.status).toBe(403);
    expect(store.getState().companies.entities.C001.status).toBe('ACTIVE');
  });
});

describe('registration review', () => {
  it('approves through the backend, stores the reviewed registration and refetches companies', async () => {
    const store = makeStore();
    sa.getRegistrations.mockResolvedValueOnce([{ reference: 'REG-1', status: 'under_review' }]);
    sa.getCompanies.mockResolvedValueOnce([]);
    await store.dispatch(registrationsEntity.thunks.fetchAll({ status: '' }));
    await store.dispatch(companiesEntity.thunks.fetchAll());

    const data = { platform_admin_id: 'PA001', subscription_plan_id: 'PLAN-PRO' };
    sa.approveRegistration.mockResolvedValueOnce({ reference: 'REG-1', status: 'approved', company_id: 'C010' });
    await store.dispatch(registrationsEntity.thunks.approve({ reference: 'REG-1', data }));
    expect(sa.approveRegistration).toHaveBeenCalledWith('REG-1', data);
    expect(store.getState().registrations.entities['REG-1'].status).toBe('approved');
    expect(q(store, 'registrations', 'fetchAll', { status: '' }).stale).toBe(true);
    expect(q(store, 'companies', 'fetchAll').stale).toBe(true);
  });

  it('keeps the registration as it was when a rejection fails validation', async () => {
    const store = makeStore();
    sa.getRegistrations.mockResolvedValueOnce([{ reference: 'REG-2', status: 'under_review' }]);
    await store.dispatch(registrationsEntity.thunks.fetchAll({ status: '' }));
    sa.rejectRegistration.mockRejectedValueOnce(fail('Reason is required', { fieldErrors: { reason: ['Reason is required'] } }));
    const result = await store.dispatch(registrationsEntity.thunks.reject({ reference: 'REG-2', reason: '' }));
    expect(result.payload.fieldErrors.reason).toEqual(['Reason is required']);
    expect(store.getState().registrations.entities['REG-2'].status).toBe('under_review');
  });
});

describe('subscriptions, platform admins, activity, escalations, settings', () => {
  it('stores an updated plan from the backend', async () => {
    const store = makeStore();
    sa.getSubscriptionPlans.mockResolvedValueOnce([{ plan_id: 'PLAN-PRO', price: 100 }]);
    await store.dispatch(subscriptionsEntity.thunks.fetchAll());
    sa.updateSubscriptionPlan.mockResolvedValueOnce({ plan_id: 'PLAN-PRO', price: 120, company_count: 2 });
    await store.dispatch(subscriptionsEntity.thunks.update({ id: 'PLAN-PRO', data: { price: 120 } }));
    expect(store.getState().subscriptions.entities['PLAN-PRO']).toMatchObject({ price: 120, company_count: 2 });
  });

  it('changes a Platform Admin status only after confirmation and refetches the filtered list', async () => {
    const store = makeStore();
    const filters = { search: '', status: 'ACTIVE' };
    sa.getPlatformAdmins.mockResolvedValueOnce([{ emp_id: 'PA002', status: 'ACTIVE' }]);
    await store.dispatch(employeesEntity.thunks.fetchPlatformAdmins(filters));
    sa.updatePlatformAdminStatus.mockResolvedValueOnce({ emp_id: 'PA002', status: 'INACTIVE' });
    await store.dispatch(employeesEntity.thunks.updatePlatformAdminStatus({ id: 'PA002', status: 'INACTIVE' }));
    expect(store.getState().employees.entities.PA002.status).toBe('INACTIVE');
    expect(q(store, 'employees', 'fetchPlatformAdmins', filters).stale).toBe(true);
  });

  it('loads activity logs per filter', async () => {
    const store = makeStore();
    sa.getActivityLogs.mockResolvedValueOnce([{ activity_id: 'ACT-1', action: 'Company created' }]);
    await store.dispatch(activityLogsEntity.thunks.fetchAll({ userId: 'PA001', action: '' }));
    expect(sa.getActivityLogs).toHaveBeenCalledWith({ userId: 'PA001', action: '' });
    expect(store.getState().activityLogs.entities['ACT-1'].action).toBe('Company created');
  });

  it('resolves a critical escalation from the returned record and refetches the lists', async () => {
    const store = makeStore();
    const filters = { status: 'OPEN', priority: 'all' };
    sa.getCriticalEscalations.mockResolvedValueOnce([{ issue_id: 'CESC-1', status: 'OPEN' }]);
    await store.dispatch(criticalEscalationsEntity.thunks.fetchAll(filters));
    sa.resolveCriticalEscalation.mockResolvedValueOnce({ issue_id: 'CESC-1', status: 'RESOLVED' });
    await store.dispatch(criticalEscalationsEntity.thunks.resolve({ id: 'CESC-1', notes: 'Fixed' }));
    expect(sa.resolveCriticalEscalation).toHaveBeenCalledWith('CESC-1', 'Fixed');
    expect(store.getState().criticalEscalations.entities['CESC-1'].status).toBe('RESOLVED');
    expect(q(store, 'criticalEscalations', 'fetchAll', filters).stale).toBe(true);
  });

  it('saves settings through the backend and keeps the loaded settings on failure', async () => {
    const store = makeStore();
    sa.getPlatformSettings.mockResolvedValueOnce({ platform_name: 'EmpTrack', role_permissions: {} });
    await store.dispatch(platformSettingsEntity.thunks.fetch());
    sa.updatePlatformSettings.mockRejectedValueOnce(fail('Invalid email', { fieldErrors: { support_email: ['Invalid email'] } }));
    await store.dispatch(platformSettingsEntity.thunks.update({ support_email: 'x' }));
    expect(q(store, 'platformSettings', 'fetch')).toMatchObject({ value: { platform_name: 'EmpTrack' } });
    expect(q(store, 'platformSettings', 'fetch').stale).toBeFalsy();

    sa.updatePlatformSettings.mockResolvedValueOnce({ platform_name: 'EmpTrack Pro' });
    await store.dispatch(platformSettingsEntity.thunks.update({ platform_name: 'EmpTrack Pro' }));
    expect(q(store, 'platformSettings', 'fetch').stale).toBe(true); // refetched from the backend
  });
});

describe('logout cleanup', () => {
  it('drops every Super Admin slice when the session ends', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: { emp_id: 'SA001', role: 'SUPER_ADMIN' }, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = makeStore();
    sa.getRegistrations.mockResolvedValueOnce([{ reference: 'REG-1' }]);
    sa.getSubscriptionPlans.mockResolvedValueOnce([{ plan_id: 'PLAN-1' }]);
    sa.getPlatformSettings.mockResolvedValueOnce({ platform_name: 'EmpTrack' });
    await store.dispatch(registrationsEntity.thunks.fetchAll({ status: '' }));
    await store.dispatch(subscriptionsEntity.thunks.fetchAll());
    await store.dispatch(platformSettingsEntity.thunks.fetch());
    store.dispatch({ type: 'auth/sessionExpired' });
    const s = store.getState();
    expect([s.registrations.ids, s.subscriptions.ids]).toEqual([[], []]);
    expect(s.platformSettings.queries).toEqual({});
  });
});
