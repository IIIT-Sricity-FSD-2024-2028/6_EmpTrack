// Formatting + badge helpers shared by the Platform Admin and Support Member pages
// (ported from front-end/js/utils/sa-common.js and the pages' badge mappers).

/** "Aug 24, 2026"; '-' when missing (sa-common formatDate). */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** "Aug 24, 2026, 08:30 AM"; '-' when missing (sa-common formatDateTime). */
export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Client-side pagination over an already-filtered array (sa-common paginate). */
export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), page: safePage, totalPages, total: items.length, pageSize };
}

// ---- account status (companies, team members) ----
export function accountStatusBadge(status) {
  if (status === 'ACTIVE') return 'badge-active';
  if (status === 'SUSPENDED') return 'badge-suspended';
  return 'badge-inactive';
}

export function paymentStatusBadge(status) {
  if (status === 'PAID') return 'badge-active';
  if (status === 'FAILED') return 'badge-suspended';
  return 'badge-pending';
}

export function priorityBadge(priority) {
  return `badge-priority-${(priority || 'low').toLowerCase()}`;
}

// ---- tickets ----
const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_CUSTOMER: 'Waiting for Customer',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

/** Support Member wording (_board.js formatStatus). */
export function formatStatus(status) {
  return STATUS_LABELS[status] || (status || '').replace(/_/g, ' ');
}

/** Platform Admin pages show the raw status with the first underscore replaced. */
export function formatPlatformStatus(status) {
  return (status || '').replace('_', ' ');
}

/** Platform Admin ticket/issue tables (support-tickets.js / technical-issues.js). */
export function platformTicketBadge(status) {
  if (status === 'RESOLVED') return 'badge-active';
  if (status === 'ESCALATED') return 'badge-suspended';
  if (status === 'IN_PROGRESS') return 'badge-pending';
  return 'badge-info';
}

/** Support Member board (_board.js statusBadgeClass). */
export function supportTicketBadge(status) {
  if (status === 'RESOLVED') return 'badge-resolved';
  if (status === 'CLOSED') return 'badge-closed';
  if (status === 'ESCALATED') return 'badge-escalated';
  if (status === 'WAITING_FOR_CUSTOMER') return 'badge-waiting';
  if (status === 'IN_PROGRESS') return 'badge-in-progress';
  return 'badge-open';
}

export const isClosedStatus = (status) => status === 'RESOLVED' || status === 'CLOSED';
