import { describe, expect, it } from 'vitest';
import { ANNUAL_LEAVE_ALLOWANCE, leaveBalance, performanceFrom } from './employeeUtils';

// The backend seed for EM001: 6 days pending, 1 approved, 2 rejected.
const SEED_LEAVES = [
  { leave_id: 'LR-015', start_date: '2026-03-20', days: '6', status: 'PENDING' },
  { leave_id: 'LR-012', start_date: '2026-03-10', days: '1', status: 'APPROVED' },
  { leave_id: 'LR-008', start_date: '2026-02-15', days: '2', status: 'REJECTED' },
];

describe('leaveBalance', () => {
  it('counts approved days as used and pending days separately', () => {
    expect(leaveBalance(SEED_LEAVES, 2026)).toEqual({ total: ANNUAL_LEAVE_ALLOWANCE, used: 1, pending: 6, remaining: 23 });
  });

  it('never counts rejected requests, and pending ones do not reduce the balance', () => {
    const balance = leaveBalance([{ start_date: '2026-01-05', days: '5', status: 'REJECTED' }, { start_date: '2026-01-10', days: '3', status: 'PENDING' }], 2026);
    expect(balance.used).toBe(0);
    expect(balance.remaining).toBe(ANNUAL_LEAVE_ALLOWANCE);
  });

  it('only counts leave in the requested year', () => {
    expect(leaveBalance([{ start_date: '2025-12-29', days: '4', status: 'APPROVED' }], 2026).used).toBe(0);
  });

  it('ignores malformed day counts and never goes below zero', () => {
    const leaves = [
      { start_date: '2026-01-01', days: 'abc', status: 'APPROVED' },
      { start_date: '2026-01-02', days: '-3', status: 'APPROVED' },
      { start_date: '2026-02-01', days: '30', status: 'APPROVED' },
    ];
    expect(leaveBalance(leaves, 2026)).toMatchObject({ used: 30, remaining: 0 });
  });

  it('is all zeros for no records', () => {
    expect(leaveBalance([], 2026)).toEqual({ total: ANNUAL_LEAVE_ALLOWANCE, used: 0, pending: 0, remaining: ANNUAL_LEAVE_ALLOWANCE });
  });
});

describe('performanceFrom', () => {
  const value = (cards, label) => cards.find((c) => c.label === label).value;

  it('derives the cards from tasks, attendance and work logs', () => {
    const cards = performanceFrom({
      tasks: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS' }, { status: 'In Progress' }, { status: 'NOT_STARTED' }],
      attendance: [{ status: 'PRESENT' }, { status: 'ABSENT' }, { status: 'WEEKEND' }, { status: 'ESCALATED' }],
      worklogs: [{ hours_spent: 4 }, { hours_spent: '2.5' }],
    });
    expect(value(cards, 'Tasks Completed')).toBe('1');
    expect(value(cards, 'Tasks In Progress')).toBe('2');
    expect(value(cards, 'Attendance Rate')).toBe('33%'); // 1 present of 3 working days
    expect(value(cards, 'Hours Logged')).toBe('6.5');
  });

  it('shows N/A for attendance when there are no working days on record', () => {
    expect(value(performanceFrom({ attendance: [{ status: 'WEEKEND' }] }), 'Attendance Rate')).toBe('N/A');
  });
});
