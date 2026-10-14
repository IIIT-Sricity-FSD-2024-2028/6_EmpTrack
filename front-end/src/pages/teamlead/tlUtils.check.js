// Self-check for the Team Lead rules. Run: node src/pages/teamlead/tlUtils.check.js
import assert from 'node:assert/strict';
import {
  buildPerformance,
  isEscalated,
  matchesSearch,
  monthlyTrend,
  resolutionStats,
  toCsv,
  unauthorizedAbsences,
  weeklyCompletion,
} from './tlUtils.js';

const today = '2026-03-20';

// Escalation: <50% progress with half the hours used, or overdue.
assert.equal(isEscalated({ status: 'IN_PROGRESS', progress_percentage: 39, est_hours: 56, hours_worked: 32, deadline: '2026-04-01' }, today), true);
assert.equal(isEscalated({ status: 'IN_PROGRESS', progress_percentage: 39, est_hours: 56, hours_worked: 10, deadline: '2026-04-01' }, today), false);
assert.equal(isEscalated({ status: 'NOT_STARTED', progress_percentage: 0, est_hours: 8, hours_worked: 0, deadline: '2026-03-19' }, today), true);
assert.equal(isEscalated({ status: 'COMPLETED', progress_percentage: 10, est_hours: 8, hours_worked: 8, deadline: '2026-03-01' }, today), false);

// Performance: productivity = completed / assigned.
const [p] = buildPerformance(
  [{ emp_id: 'E1', emp_name: 'A' }],
  [
    { assigned_to: 'E1', status: 'COMPLETED' },
    { assigned_to: 'E1', status: 'IN_PROGRESS', progress_percentage: 40 },
    { assigned_to: 'E2', status: 'COMPLETED' },
  ],
  [{ emp_id: 'E1', status: 'PRESENT' }, { emp_id: 'E1', status: 'ABSENT' }],
);
assert.deepEqual([p.total, p.completed, p.productivity, p.progress, p.attendance, p.band], [2, 1, 50, 40, 50, 'Needs Improvement']);

// Absences covered by an approved leave are not unauthorized.
const absences = unauthorizedAbsences(
  [
    { emp_id: 'E1', attendance_date: '2026-03-02', status: 'ABSENT' },
    { emp_id: 'E1', attendance_date: '2026-03-05', status: 'ABSENT' },
    { emp_id: 'E2', attendance_date: '2026-03-05', status: 'PRESENT' },
  ],
  [{ emp_id: 'E1', status: 'APPROVED', start_date: '2026-03-04', end_date: '2026-03-06' }],
);
assert.deepEqual(absences, [{ emp_id: 'E1', dates: ['2026-03-02'], days: 1 }]);

// Trends.
const tasks = [
  { created_at: '2026-03-01', completed_at: '2026-03-19' },
  { created_at: '2026-02-10', completed_at: '2026-03-05' },
  { created_at: '2026-02-11' },
];
assert.deepEqual(monthlyTrend(tasks, 2, new Date(2026, 2, 20)), [
  { label: 'Feb', assigned: 2, completed: 0 },
  { label: 'Mar', assigned: 1, completed: 2 },
]);
assert.deepEqual(weeklyCompletion(tasks, 3, today).map((w) => w.value), [1, 0, 1]);

assert.deepEqual(
  resolutionStats([{ status: 'Resolved', raised_date: '2026-03-01', resolved_date: '2026-03-03' }, { status: 'Pending' }], today),
  { resolvedThisMonth: 1, avgDays: 2, rate: 50 },
);

assert.equal(toCsv([{ a: 'x,y', b: 'say "hi"' }]), 'a,b\n"x,y","say ""hi"""');
assert.equal(matchesSearch('john', 'T-1', 'John Doe'), true);
assert.equal(matchesSearch('zzz', 'T-1', 'John Doe'), false);

console.log('tlUtils: all checks passed');
