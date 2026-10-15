// Field-level validation as the user sees it, on real forms: messages appear on
// blur / submit next to their field, clear when fixed, the first invalid field is
// focused, invalid forms never call the API, values are kept, backend field
// errors land on the right field, and double submits are blocked.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordCard from '../components/platform/ChangePasswordCard';
import { ApiError } from '../services/api';

const leaveApi = vi.hoisted(() => ({ createLeave: vi.fn(), getLeavesForUser: vi.fn(async () => []) }));
const teamApi = vi.hoisted(() => ({
  IS_DEMO: false,
  getTeam: vi.fn(async () => [{ emp_id: 'ST001', emp_name: 'Sam Wilson', email: 'sam@emptrack.com', phone: '', specialization: '', status: 'ACTIVE' }]),
  createTeamMember: vi.fn(async () => ({})),
  updateTeamMember: vi.fn(async () => ({})),
  updateTeamMemberStatus: vi.fn(),
}));

vi.mock('../services/leaveService', () => leaveApi);
vi.mock('../services/platformAdminService', () => teamApi);
vi.mock('../hooks/useAuth', () => ({ default: () => ({ user: { emp_id: 'EM001', emp_name: 'John' }, role: 'EMPLOYEE' }) }));

const { default: LeaveRequest } = await import('../pages/employee/LeaveRequest');
const { default: TeamMembersPage } = await import('../pages/platform-admin/components/TeamMembersPage');

const DAY = 24 * 60 * 60 * 1000;
const day = (offset) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
const type = (el, value) => fireEvent.change(el, { target: { value } });
// The field's message, found the way assistive tech finds it: via aria-describedby
// (which may also list a hint).
const errorOf = (el) => {
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  return ids.map((id) => document.getElementById(id)).find((node) => node?.getAttribute('role') === 'alert')?.textContent;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Leave request form', () => {
  const renderForm = async () => {
    render(<MemoryRouter><LeaveRequest /></MemoryRouter>);
    await act(async () => {});
    return {
      type: screen.getByLabelText(/Leave Type/),
      start: screen.getByLabelText(/Start Date/),
      end: screen.getByLabelText(/End Date/),
      reason: screen.getByLabelText(/Reason for Leave/),
      submit: screen.getByRole('button', { name: /Submit Leave Request/ }),
    };
  };

  it('shows no errors before the user interacts', async () => {
    await renderForm();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('blocks an empty submit, shows each field error, and focuses the first invalid field', async () => {
    const f = await renderForm();
    fireEvent.click(f.submit);
    expect(leaveApi.createLeave).not.toHaveBeenCalled();
    expect(errorOf(f.type)).toBe('Select a leave type.');
    expect(errorOf(f.start)).toBe('Start date is required.');
    expect(errorOf(f.end)).toBe('End date is required.');
    expect(errorOf(f.reason)).toBe('Reason is required.');
    expect(f.type.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(f.type);
  });

  it('validates a field on blur and clears the message once it is corrected', async () => {
    const f = await renderForm();
    type(f.reason, '   ');
    fireEvent.blur(f.reason);
    expect(errorOf(f.reason)).toBe('Reason is required.');
    type(f.reason, 'Family function');
    expect(errorOf(f.reason)).toBeUndefined();
    expect(f.reason.getAttribute('aria-invalid')).toBe('false');
  });

  it('rejects an end date before the start date and keeps the entered values', async () => {
    const f = await renderForm();
    type(f.type, 'SICK');
    type(f.start, day(10));
    type(f.end, day(9));
    type(f.reason, 'Flu');
    fireEvent.click(f.submit);
    expect(errorOf(f.end)).toBe('End date must be on or after the start date.');
    expect(leaveApi.createLeave).not.toHaveBeenCalled();
    expect(f.reason.value).toBe('Flu');
    expect(f.start.value).toBe(day(10));
  });

  it('submits trimmed valid values once, even if clicked twice', async () => {
    let finish;
    leaveApi.createLeave.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const f = await renderForm();
    type(f.type, 'CASUAL');
    type(f.start, day(10));
    type(f.end, day(10));
    type(f.reason, '  Family function  ');
    fireEvent.click(f.submit);
    expect(f.submit.disabled).toBe(true);
    fireEvent.click(f.submit);
    expect(leaveApi.createLeave).toHaveBeenCalledTimes(1);
    expect(leaveApi.createLeave.mock.calls[0][0]).toMatchObject({ leave_type: 'CASUAL', reason: 'Family function', start_date: day(10), end_date: day(10) });
    await act(async () => finish({}));
    expect(await screen.findByText('Leave request submitted.')).toBeTruthy();
    expect(f.reason.value).toBe('');
  });

  it('shows a backend validation error on the matching field', async () => {
    leaveApi.createLeave.mockRejectedValueOnce(new ApiError('Bad Request', 400, { errors: { end_date: ['End date must be on or after the start date.'] } }));
    const f = await renderForm();
    type(f.type, 'SICK');
    type(f.start, day(10));
    type(f.end, day(11));
    type(f.reason, 'Flu');
    fireEvent.click(f.submit);
    await waitFor(() => expect(errorOf(f.end)).toBe('End date must be on or after the start date.'));
    // Changing the field clears the server message.
    type(f.end, day(12));
    expect(errorOf(f.end)).toBeUndefined();
  });

  it('shows a non-field backend error as a form message', async () => {
    leaveApi.createLeave.mockRejectedValueOnce(new ApiError('These dates overlap your pending leave.', 409, { message: 'These dates overlap your pending leave.' }));
    const f = await renderForm();
    type(f.type, 'SICK');
    type(f.start, day(10));
    type(f.end, day(11));
    type(f.reason, 'Flu');
    fireEvent.click(f.submit);
    expect(await screen.findByText('These dates overlap your pending leave.')).toBeTruthy();
  });

  it('marks required fields for every user', async () => {
    const f = await renderForm();
    expect(f.type.getAttribute('aria-required')).toBe('true');
    expect(f.reason.getAttribute('aria-required')).toBe('true');
  });
});

describe('Change password card', () => {
  const setup = (onSubmit = vi.fn(async () => ({ saved: true }))) => {
    render(<ChangePasswordCard onSubmit={onSubmit} />);
    return {
      onSubmit,
      current: screen.getByLabelText(/Current Password/),
      next: screen.getByLabelText(/^New Password/),
      confirm: screen.getByLabelText(/Confirm New Password/),
      submit: screen.getByRole('button', { name: /Update Password/ }),
    };
  };

  it('requires a strong, different, confirmed password', () => {
    const f = setup();
    type(f.current, 'Old@1234');
    type(f.next, 'password');
    type(f.confirm, 'passw0rd');
    fireEvent.click(f.submit);
    expect(f.onSubmit).not.toHaveBeenCalled();
    expect(errorOf(f.next)).toMatch(/at least 8 characters with an uppercase letter/);
    expect(errorOf(f.confirm)).toBe('Passwords do not match.');
    type(f.next, 'Old@1234');
    expect(errorOf(f.next)).toBe('New password must be different from the current password.');
  });

  it('maps the backend currentPassword error onto the Current Password field', async () => {
    const f = setup(vi.fn(async () => { throw new ApiError('Bad Request', 400, { errors: { currentPassword: ['Current password is required.'] } }); }));
    type(f.current, 'Old@1234');
    type(f.next, 'Valid@123');
    type(f.confirm, 'Valid@123');
    fireEvent.click(f.submit);
    await waitFor(() => expect(errorOf(f.current)).toBe('Current password is required.'));
  });

  it('never shows the password in a message', () => {
    const f = setup();
    type(f.current, 'Old@1234');
    type(f.next, 'Secret12');
    type(f.confirm, 'Secret12');
    fireEvent.click(f.submit);
    expect(document.body.textContent).not.toContain('Secret12');
  });
});

describe('Support / Technical team member form', () => {
  beforeEach(() => {
    teamApi.getTeam.mockClear();
  });

  it('validates the add form and rejects an invalid +91 phone', async () => {
    render(<MemoryRouter><TeamMembersPage role="SUPPORT_MEMBER" label="Support" title="Support Team" /></MemoryRouter>);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /Add Support Member/ }));
    const name = screen.getByLabelText(/^Name/);
    const email = screen.getByLabelText(/^Email/);
    const phone = screen.getByLabelText(/^Phone/);
    type(name, 'Ravi Teja');
    type(email, 'ravi@emptrack.com');
    type(phone, '+91 12345 67890');
    fireEvent.click(screen.getByRole('button', { name: 'Add Member' }));
    expect(errorOf(phone)).toMatch(/valid phone number/);
    expect(teamApi.createTeamMember).not.toHaveBeenCalled();
    type(phone, '+91 98765 43210');
    fireEvent.click(screen.getByRole('button', { name: 'Add Member' }));
    await waitFor(() => expect(teamApi.createTeamMember).toHaveBeenCalledWith('SUPPORT_MEMBER', expect.objectContaining({ phone: '+91 98765 43210' })));
  });

  it('leaves a blank phone out of an edit instead of blanking it', async () => {
    render(<MemoryRouter><TeamMembersPage role="SUPPORT_MEMBER" label="Support" title="Support Team" /></MemoryRouter>);
    await screen.findByText('Sam Wilson');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sam Wilson' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(teamApi.updateTeamMember).toHaveBeenCalled());
    expect(teamApi.updateTeamMember.mock.calls[0][2]).not.toHaveProperty('phone');
  });
});
