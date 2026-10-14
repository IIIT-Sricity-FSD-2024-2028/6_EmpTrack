// Converted from front-end/super_admin/dashboard.html + js/views/super_admin/dashboard.js
import { useEffect, useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaChartCard from '../../components/sa-common/SaChartCard';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useSaToast from '../../components/sa-common/useSaToast';
import * as sa from '../../services/superAdminService';
import { chartTheme, formatCurrency, loadChartJs } from '../../utils/saCommon';
import { SA_PORTAL, commonChartOptions } from './saConstants';
import './styles/_shared.css';
import './styles/dashboard.css';

const STAT_DEFS = [
  { key: 'total_companies', label: 'Total Companies', icon: 'ph-buildings', tone: 'primary' },
  { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success' },
  { key: 'inactive_companies', label: 'Inactive / Suspended', icon: 'ph-pause-circle', tone: 'warning' },
  { key: 'total_platform_admins', label: 'Platform Admins', icon: 'ph-shield-star', tone: 'purple' },
  { key: 'total_employees', label: 'Total Employees', icon: 'ph-users-three', tone: 'info' },
  { key: 'active_subscriptions', label: 'Active Subscriptions', icon: 'ph-credit-card', tone: 'primary' },
  { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ph-currency-circle-dollar', tone: 'success', currency: true },
  { key: 'annual_revenue', label: 'Annual Revenue', icon: 'ph-chart-line-up', tone: 'success', currency: true },
  { key: 'open_critical_issues', label: 'Open Critical Issues', icon: 'ph-siren', tone: 'danger' },
];

const CHARTS = [
  { key: 'companyGrowth', title: 'Company Growth', icon: 'ph-buildings', color: 'var(--sa-primary)' },
  { key: 'employeeGrowth', title: 'Employee Growth', icon: 'ph-users-three', color: 'var(--sa-success)' },
  { key: 'subDist', title: 'Subscription Distribution', icon: 'ph-chart-pie-slice', color: 'var(--sa-purple)' },
  { key: 'revenue', title: 'Revenue by Plan', icon: 'ph-currency-circle-dollar', color: 'var(--sa-warning)' },
  { key: 'activity', title: 'Platform Activity (Last 30 Days)', icon: 'ph-activity', color: 'var(--sa-info)', wide: true },
];

// Each chart loads independently; a failed one just loses its skeleton (as in the original).
async function buildCharts(onChart) {
  await loadChartJs();
  const { textColor, gridColor } = chartTheme();
  const common = commonChartOptions(textColor, gridColor);
  const line = (rows, label, color, fill) => ({
    type: 'line',
    data: { labels: rows.map((b) => b.period), datasets: [{ label, data: rows.map((b) => b.total), borderColor: color, backgroundColor: fill, borderWidth: 2, fill: true, tension: 0.4 }] },
    options: common,
  });

  const jobs = {
    companyGrowth: async () => line(await sa.getCompanyGrowth('6m'), 'Total Companies', '#2563EB', 'rgba(37,99,235,0.1)'),
    employeeGrowth: async () => line(await sa.getEmployeeGrowth('6m'), 'Total Employees', '#22C55E', 'rgba(34,197,94,0.1)'),
    subDist: async () => {
      const rows = await sa.getSubscriptionDistribution();
      return {
        type: 'doughnut',
        data: { labels: rows.map((p) => p.plan_name), datasets: [{ data: rows.map((p) => p.company_count), backgroundColor: ['#2563EB', '#7C3AED', '#F97316', '#22C55E'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 16 } } } },
      };
    },
    revenue: async () => {
      const rows = await sa.getRevenueByPlan();
      return { type: 'bar', data: { labels: rows.map((p) => p.plan_name), datasets: [{ label: 'Revenue', data: rows.map((p) => p.revenue), backgroundColor: '#F97316', borderRadius: 4 }] }, options: common };
    },
    activity: async () => {
      const summary = await sa.getPlatformActivitySummary('30d');
      return {
        type: 'bar',
        data: { labels: summary.by_action.map((a) => a.action), datasets: [{ label: 'Actions', data: summary.by_action.map((a) => a.count), backgroundColor: '#3B82F6', borderRadius: 4 }] },
        options: { ...common, indexAxis: 'y' },
      };
    },
  };

  await Promise.all(Object.entries(jobs).map(async ([key, job]) => {
    try {
      onChart(key, await job());
    } catch {
      onChart(key, null);
    }
  }));
}

export default function SaDashboard() {
  const [toast, showToast] = useSaToast();
  const [overview, setOverview] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [charts, setCharts] = useState({});

  useEffect(() => {
    let cancelled = false;
    sa.getAnalyticsOverview()
      .then((data) => !cancelled && setOverview(data))
      .catch(() => !cancelled && setStatsError(true));
    buildCharts((key, config) => !cancelled && setCharts((c) => ({ ...c, [key]: config })))
      .catch(() => !cancelled && showToast('Some charts failed to load.', 'error'));
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Super Admin Dashboard" title="Dashboard" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="stats-grid" id="sa-stats-grid">
          {statsError ? (
            <div className="error-state" style={{ gridColumn: '1/-1' }}><i className="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>
          ) : (
            overview &&
            STAT_DEFS.map((def) => (
              <div key={def.key} className="card stat-card">
                <div className={`stat-icon ${def.tone}`}><i className={`ph-fill ${def.icon}`}></i></div>
                <div>
                  <div className="stat-value" id={`stat-${def.key}`}>
                    {def.currency ? formatCurrency(overview[def.key] || 0) : <AnimatedCount value={overview[def.key] || 0} />}
                  </div>
                  <div className="stat-label">{def.label}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="charts-grid">
          {CHARTS.map((c) => (
            <SaChartCard
              key={c.key} id={`chart-${c.key}`} title={c.title} icon={c.icon} color={c.color}
              config={charts[c.key]} loaded={c.key in charts} wide={c.wide} height={c.wide ? 220 : undefined}
            />
          ))}
        </div>
      </div>

      {toast}
    </>
  );
}
