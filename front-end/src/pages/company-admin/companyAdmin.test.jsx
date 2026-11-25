// Company Admin billing and raise-issue through Redux: data layer and real page click-throughs.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as ca from '../../services/companyAdminService';
import { queryKey } from '../../store/entitySlice';
import { paymentsEntity, ticketsEntity } from '../../store/entities';
import { makeStore } from '../../store/store';
import StoreProvider from '../../store/StoreProvider';
import CaBilling from './CaBilling';
import CaRaiseIssue from './CaRaiseIssue';

vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/companyAdminService', () => ({
  getMySubscription: vi.fn(), getMyPaymentHistory: vi.fn(), completeMockPayment: vi.fn(), raiseCompanyIssue: vi.fn(),
}));

const subscription = { company_id: 'C001', company_name: 'Acme', plan_id: 'PLAN-PRO', plan_name: 'Professional', price: 499, status: 'ACTIVE', last_transaction_id: 'TXN-006' };
const txn = { transaction_id: 'TXN-006', company_id: 'C001', plan_name: 'Professional', amount: 499, currency: 'USD', status: 'PAID', payment_date: '2026-10-01' };
const receipt = { transaction_id: 'MOCK-TXN-20261124-123456', amount: 499, currency: 'USD', paid_at: '2026-11-24T10:00:00Z' };

beforeEach(() => {
  ca.getMySubscription.mockResolvedValue(subscription);
  ca.getMyPaymentHistory.mockResolvedValue([txn]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  localStorage.clear();
});

const q = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];

describe('billing data (payments slice)', () => {
  it('keeps the subscription as a value and the history as shared transaction records', async () => {
    const store = makeStore();
    await store.dispatch(paymentsEntity.thunks.fetchMySubscription());
    await store.dispatch(paymentsEntity.thunks.fetchMyHistory());
    expect(q(store, 'payments', 'fetchMySubscription').value).toEqual(subscription);
    expect(q(store, 'payments', 'fetchMyHistory').ids).toEqual(['TXN-006']);
    // Not merged into the Super Admin's plan records.
    expect(store.getState().subscriptions.ids).toEqual([]);
  });

  it('a completed payment stores the receipt and refetches subscription and history; a failure changes nothing', async () => {
    const store = makeStore();
    await store.dispatch(paymentsEntity.thunks.fetchMySubscription());
    await store.dispatch(paymentsEntity.thunks.fetchMyHistory());

    ca.completeMockPayment.mockRejectedValueOnce(Object.assign(new Error('Subscription is already paid'), { status: 409 }));
    const failed = await store.dispatch(paymentsEntity.thunks.completeMockPayment({ companyId: 'C001', subscriptionId: 'PLAN-PRO' }));
    expect(failed.payload).toMatchObject({ message: 'Subscription is already paid', status: 409 });
    expect(q(store, 'payments', 'fetchMyHistory').stale).toBeFalsy();

    ca.completeMockPayment.mockResolvedValueOnce(receipt);
    await store.dispatch(paymentsEntity.thunks.completeMockPayment({ companyId: 'C001', subscriptionId: 'PLAN-PRO' }));
    expect(ca.completeMockPayment).toHaveBeenLastCalledWith({ companyId: 'C001', subscriptionId: 'PLAN-PRO' });
    expect(store.getState().payments.entities[receipt.transaction_id].amount).toBe(499);
    expect(q(store, 'payments', 'fetchMySubscription').stale).toBe(true);
    expect(q(store, 'payments', 'fetchMyHistory').stale).toBe(true);
  });

  it('raising an issue stores the backend ticket; logout clears billing and tickets', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: { emp_id: 'AD001', role: 'COMPANY_ADMIN' }, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = makeStore();
    await store.dispatch(paymentsEntity.thunks.fetchMyHistory());
    ca.raiseCompanyIssue.mockResolvedValueOnce({ ticket_id: 'TIX-30', ticket_type: 'SUPPORT', status: 'OPEN' });
    await store.dispatch(ticketsEntity.thunks.raiseCompanyTicket({ title: 'Login issue', description: 'x', priority: 'HIGH' }));
    expect(store.getState().tickets.entities['TIX-30'].status).toBe('OPEN');
    store.dispatch({ type: 'auth/sessionExpired' });
    expect([store.getState().payments.ids, store.getState().tickets.ids]).toEqual([[], []]);
  });
});

describe('Subscription & Billing page', () => {
  const renderBilling = () => render(<StoreProvider><MemoryRouter><CaBilling /></MemoryRouter></StoreProvider>);

  it('pays, shows the backend receipt, and reloads billing from the backend', async () => {
    renderBilling();
    expect(await screen.findByText('Professional', { selector: '.billing-plan-name' })).toBeTruthy();
    ca.completeMockPayment.mockResolvedValueOnce(receipt);
    fireEvent.click(screen.getByRole('button', { name: /Complete Payment/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Complete Payment/ }));
    // The receipt shown is the transaction the backend returned (read from Redux).
    expect(await within(dialog).findByText(receipt.transaction_id, {}, { timeout: 3000 })).toBeTruthy();
    expect(within(dialog).getAllByText('Payment Successful').length).toBeGreaterThan(0);
    await waitFor(() => expect(ca.getMyPaymentHistory.mock.calls.length).toBeGreaterThan(1));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    expect(await screen.findByText('Payment recorded successfully.')).toBeTruthy();
  });

  it('shows the server message and no receipt or success toast when payment fails', async () => {
    renderBilling();
    await screen.findByText('Professional', { selector: '.billing-plan-name' });
    ca.completeMockPayment.mockRejectedValueOnce(new Error('Subscription is already paid'));
    fireEvent.click(screen.getByRole('button', { name: /Complete Payment/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Complete Payment/ }));
    expect(await within(dialog).findByText('Subscription is already paid', {}, { timeout: 3000 })).toBeTruthy();
    expect(within(dialog).queryByText('Payment Successful')).toBeNull();
    expect(screen.queryByText('Payment recorded successfully.')).toBeNull();
    expect(ca.getMyPaymentHistory).toHaveBeenCalledTimes(1);
  });
});

describe('Raise an Issue page', () => {
  const renderRaise = () => render(
    <StoreProvider>
      <MemoryRouter initialEntries={['/company-admin/raise-issue']}>
        <Routes>
          <Route path="/company-admin/raise-issue" element={<CaRaiseIssue />} />
          <Route path="/company-admin/dashboard" element={<h1>CA dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </StoreProvider>,
  );
  const fill = () => {
    fireEvent.change(screen.getByLabelText(/Issue Title/), { target: { value: 'Employees cannot log in' } });
    fireEvent.change(screen.getByLabelText(/Detailed Description/), { target: { value: 'Since this morning every employee sees an SSO redirect loop.' } });
    fireEvent.click(screen.getByRole('button', { name: /Raise Issue to Platform Admin/ }));
  };

  it('raises the ticket and leaves only after the backend confirms', async () => {
    ca.raiseCompanyIssue.mockResolvedValueOnce({ ticket_id: 'TIX-31', status: 'OPEN' });
    renderRaise();
    fill();
    expect(await screen.findByText('CA dashboard')).toBeTruthy();
    expect(ca.raiseCompanyIssue).toHaveBeenCalledWith(expect.objectContaining({ title: 'Employees cannot log in' }));
  });

  it('stays on the form with the server message when the backend refuses', async () => {
    ca.raiseCompanyIssue.mockRejectedValueOnce(new Error('No Platform Admin is assigned to your company'));
    renderRaise();
    fill();
    expect(await screen.findByText('No Platform Admin is assigned to your company')).toBeTruthy();
    expect(screen.queryByText('CA dashboard')).toBeNull();
    expect(screen.getByRole('button', { name: /Raise Issue to Platform Admin/ }).disabled).toBe(false);
  });
});
