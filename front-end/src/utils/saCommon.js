// Helpers shared by the Super Admin and Technical Member pages
// (converted from the original front-end/js/utils/sa-common.js).
// DOM-based helpers from that file (toast, modals, pagination, animateCount)
// live as React components in components/sa-common/.

export { formatDateTime } from './helpers';

export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Mar 28, 2026"; '-' when empty (unlike helpers.formatDate). */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Simple client-side pagination over an already-filtered array. */
export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: items.length,
  };
}

/** Loads Chart.js from the same CDN the original pages used (window.Chart). */
let chartJsPromise = null;
export function loadChartJs() {
  if (typeof window.Chart !== 'undefined') return Promise.resolve();
  if (!chartJsPromise) {
    chartJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => resolve();
      script.onerror = () => {
        chartJsPromise = null;
        reject(new Error('Failed to load Chart.js'));
      };
      document.head.appendChild(script);
    });
  }
  return chartJsPromise;
}

/** Text / grid colors from the active theme, and applies them as Chart.js defaults. */
export function chartTheme() {
  const rootStyles = getComputedStyle(document.body);
  const textColor = rootStyles.getPropertyValue('--text-muted').trim() || '#6B7280';
  const gridColor = rootStyles.getPropertyValue('--border-color').trim() || '#E5E7EB';
  window.Chart.defaults.color = textColor;
  window.Chart.defaults.font.family = "'Inter', sans-serif";
  return { textColor, gridColor };
}

/** Company / company-list status badge (same mapping on every Super Admin page). */
export function companyStatusBadgeClass(status) {
  if (status === 'ACTIVE') return 'badge-active';
  if (status === 'SUSPENDED') return 'badge-suspended';
  return 'badge-inactive';
}
