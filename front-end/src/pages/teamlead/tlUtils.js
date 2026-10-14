// Team Lead business rules shared by the pages. Pure functions with no imports
// so `node src/pages/teamlead/tlUtils.check.js` can verify them.

export const todayKey = () => new Date().toISOString().split('T')[0];

export const TASK_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', badge: 'not-started' },
  { value: 'IN_PROGRESS', label: 'In Progress', badge: 'in-progress' },
  { value: 'BLOCKED', label: 'Blocked', badge: 'danger' },
  { value: 'COMPLETED', label: 'Completed', badge: 'completed' },
];
const statusInfo = (status) => TASK_STATUSES.find((s) => s.value === status) ?? TASK_STATUSES[0];
export const taskStatusLabel = (status) => statusInfo(status).label;
export const taskStatusBadge = (status) => statusInfo(status).badge;

export const priorityBadge = (priority = '') => ({ high: 'high', critical: 'high', medium: 'medium' })[priority.toLowerCase()] || 'low';

export function issueStatusBadge(status) {
  if (status === 'Resolved') return 'completed';
  if (status === 'In Progress') return 'info';
  return 'open';
}

export const isOpenIssue = (issue) => issue.status === 'Pending' || issue.status === 'Open';

/** Issues raised by the team lead's own members (GET /issues returns every issue). */
export const teamIssues = (members, issues) => issues.filter((i) => members.some((m) => m.emp_id === i.emp_id));

export const leaveStatusBadge = (status) => ({ APPROVED: 'success', REJECTED: 'danger' })[status] || 'warning';
export const LEAVE_TYPE_LABELS = { CASUAL: 'Vacation', SICK: 'Sick Leave', UNPAID: 'Personal Leave' };

export const nameOf = (members, empId) => members.find((m) => m.emp_id === empId)?.emp_name ?? empId ?? '-';

/** Case-insensitive "any of these fields contains the query". */
export const matchesSearch = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((f) => String(f ?? '').toLowerCase().includes(q));
};

export const isOverdue = (task, today = todayKey()) => task.status !== 'COMPLETED' && Boolean(task.deadline) && task.deadline < today;

/** Share of the estimate already used, 0..n (1 = all estimated hours spent). */
const hoursUsed = (task) => (Number(task.est_hours) > 0 ? Number(task.hours_worked || 0) / Number(task.est_hours) : 0);

/**
 * Auto-escalation rule (escalations page "criteria" cards): an open task is
 * escalated when progress is below 50% while at least half the estimated
 * hours are spent, or when it is past its deadline below 50%.
 */
export function isEscalated(task, today = todayKey()) {
  if (task.status === 'COMPLETED') return false;
  const progress = Number(task.progress_percentage || 0);
  return progress < 50 && (hoursUsed(task) >= 0.5 || isOverdue(task, today));
}

export function escalationReason(task, today = todayKey()) {
  if (isOverdue(task, today)) {
    const days = Math.round((new Date(today) - new Date(task.deadline)) / 86400000);
    return `Past deadline by ${days} day${days === 1 ? '' : 's'}`;
  }
  return `Low productivity - ${Math.round(hoursUsed(task) * 100)}% of hours used`;
}

/** 'Excellent' (>= 85), 'Good' (>= 70) or 'Needs Improvement'. */
const performanceBand = (score) => (score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement');

/**
 * Per-member stats. productivity = completed / assigned tasks (%);
 * attendance = present / recorded working days (%).
 */
export function buildPerformance(members, tasks, attendance = []) {
  return members.map((m) => {
    const mine = tasks.filter((t) => t.assigned_to === m.emp_id);
    const completed = mine.filter((t) => t.status === 'COMPLETED').length;
    const open = mine.filter((t) => t.status !== 'COMPLETED');
    const days = attendance.filter((a) => a.emp_id === m.emp_id);
    const productivity = mine.length ? Math.round((completed / mine.length) * 100) : 0;
    return {
      emp_id: m.emp_id,
      name: m.emp_name,
      total: mine.length,
      completed,
      inProgress: open.filter((t) => t.status === 'IN_PROGRESS').length,
      // Average progress of open work; 100 when everything is done.
      progress: open.length ? Math.round(open.reduce((s, t) => s + Number(t.progress_percentage || 0), 0) / open.length) : 100,
      productivity,
      attendance: days.length ? Math.round((days.filter((a) => a.status === 'PRESENT').length / days.length) * 100) : null,
      band: performanceBand(productivity),
    };
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Tasks assigned (created_at) and completed (completed_at) per month, oldest first. */
export function monthlyTrend(tasks, months = 6, now = new Date()) {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: MONTHS[d.getMonth()],
      assigned: tasks.filter((t) => t.created_at?.startsWith(key)).length,
      completed: tasks.filter((t) => t.completed_at?.startsWith(key)).length,
    };
  });
}

/** Tasks completed in each of the last `weeks` 7-day windows ending today, oldest first. */
export function weeklyCompletion(tasks, weeks = 4, today = todayKey()) {
  const end = new Date(today);
  return Array.from({ length: weeks }, (_, i) => {
    const to = new Date(end);
    to.setUTCDate(end.getUTCDate() - (weeks - 1 - i) * 7);
    const from = new Date(to);
    from.setUTCDate(to.getUTCDate() - 6);
    const [a, b] = [from, to].map((d) => d.toISOString().split('T')[0]);
    return { label: `Week ${i + 1}`, value: tasks.filter((t) => t.completed_at && t.completed_at >= a && t.completed_at <= b).length };
  });
}

/** ABSENT days not covered by an APPROVED leave, grouped per member. */
export function unauthorizedAbsences(attendance, leaves) {
  const covered = (a) =>
    leaves.some((l) => l.emp_id === a.emp_id && l.status === 'APPROVED' && l.start_date <= a.attendance_date && a.attendance_date <= l.end_date);
  const groups = {};
  attendance
    .filter((a) => a.status === 'ABSENT' && !covered(a))
    .forEach((a) => (groups[a.emp_id] ||= []).push(a.attendance_date));
  return Object.entries(groups).map(([emp_id, dates]) => ({ emp_id, dates: dates.sort(), days: dates.length }));
}

/** Resolved this month, average days to resolve, share of issues resolved. */
export function resolutionStats(issues, today = todayKey()) {
  const resolved = issues.filter((i) => i.status === 'Resolved');
  const timed = resolved.filter((i) => i.raised_date && i.resolved_date);
  const avgDays = timed.length
    ? timed.reduce((s, i) => s + (new Date(i.resolved_date) - new Date(i.raised_date)) / 86400000, 0) / timed.length
    : null;
  return {
    resolvedThisMonth: resolved.filter((i) => i.resolved_date?.startsWith(today.slice(0, 7))).length,
    avgDays,
    rate: issues.length ? Math.round((resolved.length / issues.length) * 100) : 0,
  };
}

/** Array of flat objects -> CSV text (RFC 4180 quoting). */
export function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const cell = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\n');
}
