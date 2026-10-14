// Shared bits for the Super Admin pages (from the original super_admin/*.html).
import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Caption under each page title. */
export const SA_PORTAL = 'Super Admin Portal';

/** Base URL of the portal ("/super-admin"), for in-page links. */
export const SA_BASE = getRoleBasePath(ROLES.SUPER_ADMIN);

/** Chart.js options shared by the line / bar charts (dashboard, analytics). */
export function commonChartOptions(textColor, gridColor) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
    },
  };
}
