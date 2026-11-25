// Support Member ticket workflow through Redux: backend-confirmed changes only, failures keep data.
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as sm from '../services/supportMemberService';
import { queryKey } from './entitySlice';
import { companiesEntity, notificationsEntity, platformOverviewEntity, ticketsEntity } from './entities';
import { makeStore } from './store';

vi.mock('../services/supportMemberService', () => ({
  getStats: vi.fn(), getCategories: vi.fn(), getTickets: vi.fn(), getTicket: vi.fn(),
  claimTicket: vi.fn(), changeStatus: vi.fn(), resolveTicket: vi.fn(), addMessage: vi.fn(),
  addInternalNote: vi.fn(), escalateToTechnicalTeam: vi.fn(), escalateToPlatformAdmin: vi.fn(),
  getLinkedTechnicalTicket: vi.fn(), getCompanySummary: vi.fn(),
}));
// platformAdminService feeds the shared notification loader (same function the portal used).
vi.mock('../services/platformAdminService', () => ({ getNotifications: vi.fn() }));

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  
});

const q = (store, slice, op, arg) => store.getState()[slice].queries[queryKey(op, arg)];
const fail = (message, extra = {}) => Object.assign(new Error(message), extra);
const UNASSIGNED = { assignedTo: 'unassigned', status: 'all' };
const MINE = { assignedTo: 'me', status: 'all' };
const open = { ticket_id: 'TIX-4', status: 'OPEN', assigned_to: null, comments: [] };

async function withQueues() {
  const store = makeStore();
  sm.getTickets.mockImplementation(async (f) => (f.assignedTo === 'unassigned' ? [open] : []));
  sm.getStats.mockResolvedValue({ open: 1, mine: 0 });
  await store.dispatch(ticketsEntity.thunks.fetchSupportQueue(UNASSIGNED));
  await store.dispatch(ticketsEntity.thunks.fetchSupportQueue(MINE));
  await store.dispatch(platformOverviewEntity.thunks.fetchSupportStats());
  return store;
}

describe('ticket queues and lookups', () => {
  it('fetches unassigned and assigned queues into the shared tickets slice', async () => {
    const store = await withQueues();
    expect(sm.getTickets).toHaveBeenCalledWith(UNASSIGNED);
    expect(q(store, 'tickets', 'fetchSupportQueue', UNASSIGNED).ids).toEqual(['TIX-4']);
    expect(q(store, 'tickets', 'fetchSupportQueue', MINE).ids).toEqual([]);
    expect(q(store, 'platformOverview', 'fetchSupportStats').value).toEqual({ open: 1, mine: 0 });

  });

  it('keeps string lists (categories) as a value instead of normalizing them', async () => {
    const store = makeStore();
    sm.getCategories.mockResolvedValueOnce(['Billing', 'Attendance']);
    await store.dispatch(ticketsEntity.thunks.fetchSupportCategories());
    expect(q(store, 'tickets', 'fetchSupportCategories').value).toEqual(['Billing', 'Attendance']);
    expect(store.getState().tickets.ids).toEqual([]);

  });

  it('loads the limited company summary and the linked technical ticket', async () => {
    const store = makeStore();
    sm.getCompanySummary.mockResolvedValueOnce({ company_id: 'C001', company_name: 'Acme', employee_count: 12 });
    sm.getLinkedTechnicalTicket.mockResolvedValueOnce({ ticket_id: 'TIX-20', status: 'OPEN', assigned_to_name: null });
    await store.dispatch(companiesEntity.thunks.fetchSupportSummary('C001'));
    await store.dispatch(ticketsEntity.thunks.fetchLinkedTechnical('TIX-20'));
    expect(store.getState().companies.entities.C001.employee_count).toBe(12);
    expect(store.getState().tickets.entities['TIX-20'].status).toBe('OPEN');

  });

});

describe('ticket workflow', () => {
  it('claims: shows only the backend-confirmed assignee, then refetches queues and stats', async () => {
    const store = await withQueues();
    sm.claimTicket.mockResolvedValueOnce({ ...open, status: 'IN_PROGRESS', assigned_to: 'ST001' });
    await store.dispatch(ticketsEntity.thunks.claim('TIX-4'));
    expect(sm.claimTicket).toHaveBeenCalledWith('TIX-4');
    expect(store.getState().tickets.entities['TIX-4']).toMatchObject({ assigned_to: 'ST001', status: 'IN_PROGRESS' });
    expect(q(store, 'tickets', 'fetchSupportQueue', UNASSIGNED).stale).toBe(true);
    expect(q(store, 'tickets', 'fetchSupportQueue', MINE).stale).toBe(true);
    expect(q(store, 'platformOverview', 'fetchSupportStats').stale).toBe(true);

  });

  it('a refused claim (already taken) leaves the ticket unassigned and nothing refetches', async () => {
    const store = await withQueues();
    sm.claimTicket.mockRejectedValueOnce(fail('Ticket is already assigned', { status: 409 }));
    const result = await store.dispatch(ticketsEntity.thunks.claim('TIX-4'));
    expect(result.payload).toMatchObject({ message: 'Ticket is already assigned', status: 409 });
    expect(store.getState().tickets.entities['TIX-4'].assigned_to).toBeNull();
    expect(q(store, 'tickets', 'fetchSupportQueue', UNASSIGNED).stale).toBeFalsy();

  });

  it('shows a reply only once the backend returns it; a rejected reply keeps the thread', async () => {
    const store = await withQueues();
    sm.addMessage.mockRejectedValueOnce(fail('Message too long', { fieldErrors: { message: ['Message too long'] } }));
    const bad = await store.dispatch(ticketsEntity.thunks.supportComment({ id: 'TIX-4', message: 'x' }));
    expect(bad.payload.fieldErrors.message).toEqual(['Message too long']);
    expect(store.getState().tickets.entities['TIX-4'].comments).toEqual([]);

    const reply = { author: 'Sam', message: 'On it' };
    sm.addMessage.mockResolvedValueOnce({ ...open, comments: [reply] });
    await store.dispatch(ticketsEntity.thunks.supportComment({ id: 'TIX-4', message: 'On it' }));
    expect(sm.addMessage).toHaveBeenLastCalledWith('TIX-4', 'On it');
    expect(store.getState().tickets.entities['TIX-4'].comments).toEqual([reply]);

  });

  it('resolves and escalates from the returned ticket', async () => {
    const store = await withQueues();
    sm.resolveTicket.mockResolvedValueOnce({ ...open, status: 'RESOLVED' });
    await store.dispatch(ticketsEntity.thunks.supportResolve({ id: 'TIX-4', notes: 'Fixed' }));
    expect(sm.resolveTicket).toHaveBeenCalledWith('TIX-4', 'Fixed');
    expect(store.getState().tickets.entities['TIX-4'].status).toBe('RESOLVED');

    sm.escalateToTechnicalTeam.mockResolvedValueOnce({ ...open, status: 'ESCALATED', linked_technical_ticket_id: 'TIX-21' });
    await store.dispatch(ticketsEntity.thunks.escalateToTechnical({ id: 'TIX-4', note: 'Needs a fix' }));
    expect(sm.escalateToTechnicalTeam).toHaveBeenCalledWith('TIX-4', 'Needs a fix');
    expect(store.getState().tickets.entities['TIX-4'].linked_technical_ticket_id).toBe('TIX-21');
  });

});

describe('notifications and session cleanup', () => {
  it('loads notifications through the shared platform loader', async () => {
    const { getNotifications } = await import('../services/platformAdminService');
    getNotifications.mockResolvedValueOnce([{ id: 'N9', message: 'TIX-4 assigned to you' }]);
    const store = makeStore();
    await store.dispatch(notificationsEntity.thunks.fetchForPlatform('ST001'));
    expect(store.getState().notifications.entities.N9.message).toBe('TIX-4 assigned to you');

  });

  it('drops tickets, company summaries and stats when the Support Member logs out', async () => {
    localStorage.setItem('empTrackSessionV2', JSON.stringify({ user: { emp_id: 'ST001', role: 'SUPPORT_MEMBER' }, token: 't', expiresAt: Date.now() + 60_000 }));
    const store = await withQueues();
    sm.getCompanySummary.mockResolvedValueOnce({ company_id: 'C001' });
    await store.dispatch(companiesEntity.thunks.fetchSupportSummary('C001'));
    store.dispatch({ type: 'auth/sessionExpired' });
    const s = store.getState();
    expect([s.tickets.ids, s.companies.ids]).toEqual([[], []]);
    expect(s.platformOverview.queries).toEqual({});

  });

});
