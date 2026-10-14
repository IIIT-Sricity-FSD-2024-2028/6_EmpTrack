// Labels and badge mappings for Technical Member issues
// (from the original js/views/technical_member/_board.js).
import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Caption under each page title. */
export const TM_PORTAL = 'Technical Dashboard';

/** Base URL of the portal ("/technical-member"), for in-page links. */
export const TM_BASE = getRoleBasePath(ROLES.TECHNICAL_MEMBER);

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const VERIFICATION_LABELS = {
  PENDING_VERIFICATION: 'Awaiting Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Sent Back for Rework',
};

export function statusBadgeClass(status) {
  if (status === 'RESOLVED') return 'badge-resolved';
  if (status === 'CLOSED') return 'badge-closed';
  if (status === 'ESCALATED') return 'badge-escalated';
  if (status === 'IN_PROGRESS') return 'badge-in-progress';
  return 'badge-open';
}

export function priorityBadgeClass(priority) {
  return `badge-priority-${(priority || 'low').toLowerCase()}`;
}

export function formatStatus(status) {
  return STATUS_LABELS[status] || (status || '').replace(/_/g, ' ');
}

export function verificationBadgeClass(status) {
  if (status === 'VERIFIED') return 'badge-verified';
  if (status === 'REJECTED') return 'badge-rejected';
  if (status === 'PENDING_VERIFICATION') return 'badge-pending';
  return 'badge-neutral';
}

export function formatVerification(status) {
  return VERIFICATION_LABELS[status] || null;
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsDataURL(file);
  });
}
