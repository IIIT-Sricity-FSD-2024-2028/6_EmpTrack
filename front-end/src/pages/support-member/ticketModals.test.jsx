// Click-through checks of the ticket modals: a successful action shows its success
// toast (and no error), a refused one shows the server's message.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as pa from '../../services/platformAdminService';
import * as sm from '../../services/supportMemberService';
import StoreProvider from '../../store/StoreProvider';
import PlatformTicketsPage from '../platform-admin/components/PlatformTicketsPage';
import MyTickets from './MyTickets';

vi.mock('../../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'ST001', emp_name: 'Sam' }, role: 'SUPPORT_MEMBER' }) }));
vi.mock('../../hooks/usePageTitle', () => ({ default: vi.fn() }));
vi.mock('../../services/supportMemberService', () => ({
  IS_DEMO: false, getStats: vi.fn(), getCategories: vi.fn(), getTickets: vi.fn(), getTicket: vi.fn(),
  claimTicket: vi.fn(), getCompanySummary: vi.fn(), getLinkedTechnicalTicket: vi.fn(),
}));
vi.mock('../../services/platformAdminService', () => ({
  IS_DEMO: false, getTickets: vi.fn(), getTicket: vi.fn(), getTeam: vi.fn(), assignTicket: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const renderAt = (ui, path = '/') => render(<StoreProvider><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></StoreProvider>);

describe('Support Member ticket modal', () => {
  const ticket = { ticket_id: 'TIX-4', title: 'Login loop', status: 'OPEN', priority: 'High', category: 'Billing', company_id: 'C001', assigned_to: null, comments: [], internal_notes: [], created_date: '2026-11-01' };

  function setup() {
    sm.getCategories.mockResolvedValue(['Billing']);
    sm.getTickets.mockResolvedValue([ticket]);
    sm.getCompanySummary.mockResolvedValue({ company_id: 'C001', company_name: 'Acme', employee_count: 3 });
    renderAt(<MyTickets />, '/?assignment=unassigned');
  }

  it('claims from the modal and shows the backend-confirmed result', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'View TIX-4' }));
    const claimed = { ...ticket, status: 'IN_PROGRESS', assigned_to: 'ST001' };
    sm.claimTicket.mockResolvedValueOnce(claimed);
    sm.getTicket.mockResolvedValueOnce(claimed);
    fireEvent.click(await screen.findByRole('button', { name: /Claim Ticket/ }));
    expect(await screen.findByText('Ticket claimed.')).toBeTruthy();
    expect(sm.claimTicket).toHaveBeenCalledWith('TIX-4');
    // The queue refetches after the backend confirmed the claim.
    await waitFor(() => expect(sm.getTickets.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows the server message and no success toast when the claim is refused', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'View TIX-4' }));
    sm.claimTicket.mockRejectedValueOnce(new Error('Ticket is already assigned'));
    fireEvent.click(await screen.findByRole('button', { name: /Claim Ticket/ }));
    expect(await screen.findByText('Ticket is already assigned')).toBeTruthy();
    expect(screen.queryByText('Ticket claimed.')).toBeNull();
    expect(sm.getTicket).not.toHaveBeenCalled();
  });
});

describe('Platform Admin ticket modal (regression: refetch after an action)', () => {
  it('assigns a technical issue and reports success', async () => {
    const issue = { ticket_id: 'TIX-1', title: 'SSO loop', status: 'OPEN', priority: 'High', assigned_to: null, comments: [], company_id: 'C001', created_date: '2026-11-01' };
    const assigned = { ...issue, status: 'IN_PROGRESS', assigned_to: 'TT001' };
    pa.getTickets.mockResolvedValue([issue]);
    pa.getTeam.mockResolvedValue([{ emp_id: 'TT001', emp_name: 'Wanda', status: 'ACTIVE' }]);
    pa.assignTicket.mockResolvedValueOnce(assigned);
    pa.getTicket.mockResolvedValueOnce(assigned);
    renderAt(<PlatformTicketsPage type="TECHNICAL" title="Technical Issues" />);

    fireEvent.click(await screen.findByRole('button', { name: 'View TIX-1' }));
    await screen.findByRole('option', { name: /Wanda/ });
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText('Technical issue assigned successfully.')).toBeTruthy();
    expect(pa.assignTicket).toHaveBeenCalledWith('TECHNICAL', 'TIX-1', 'TT001');
    expect(screen.queryByText(/not iterable/)).toBeNull();
  });
});
