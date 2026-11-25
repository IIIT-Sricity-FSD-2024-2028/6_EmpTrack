// Converted from front-end/super_admin/analytics.html + js/views/super_admin/analytics.js
import { useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaChartCard from '../../components/sa-common/SaChartCard';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useSaToast from '../../components/sa-common/useSaToast';
import FieldError from '../../components/common/FieldError';
import useFormValidation from '../../hooks/useFormValidation';
import { dateRangeSchema } from '../../validation/formSchemas';
import useSaCharts from '../../components/sa-common/useSaCharts';
import { platformOverviewEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { SA_PORTAL, commonChartOptions } from './saConstants';
import './styles/_shared.css';
import './styles/analytics.css';

const CHARTS = [
  { key: 'company', title: 'Company & Subscription Growth', icon: 'ph-buildings', color: 'var(--sa-primary)' },
  { key: 'employee', title: 'Employee Growth', icon: 'ph-users-three', color: 'var(--sa-success)' },
  { key: 'usage', title: 'Platform Usage by Action', icon: 'ph-activity', color: 'var(--sa-info)', wide: true },
];

/** { range } for a preset, or { from, to } for a custom range with a start date. */
function rangeParams({ range, from, to }) {
  if (range === 'custom' && from) return { from, to: to || undefined };
  return { range };
}

const line = (rows, label, color, fill, { textColor, gridColor }) => ({
  type: 'line',
  data: { labels: rows.map((b) => b.period), datasets: [{ label, data: rows.map((b) => b.total), borderColor: color, backgroundColor: fill, borderWidth: 2, fill: true, tension: 0.4 }] },
  options: commonChartOptions(textColor, gridColor),
});

// Backend data -> Chart.js config (data comes from the platformOverview slice).
const BUILDERS = {
  company: (rows, t) => line(rows, 'Total Companies (= Active Subscriptions)', '#2563EB', 'rgba(37,99,235,0.1)', t),
  employee: (rows, t) => line(rows, 'Total Employees', '#22C55E', 'rgba(34,197,94,0.1)', t),
  usage: (usage, { textColor, gridColor }) => ({
    type: 'bar',
    data: { labels: usage.by_action.map((a) => a.action), datasets: [{ label: 'Actions', data: usage.by_action.map((a) => a.count), backgroundColor: '#3B82F6', borderRadius: 4 }] },
    options: { ...commonChartOptions(textColor, gridColor), indexAxis: 'y' },
  }),
};

export default function SaAnalytics() {
  const [toast, showToast] = useSaToast();
  const [form, setForm] = useState({ range: '6m', from: '', to: '' });
  // The applied range (UI state); every chart and stat below is a Redux query keyed by it.
  const [params, setParams] = useState(() => rangeParams({ range: '6m' }));
  const overviewQuery = useEntityQuery(platformOverviewEntity, 'fetchAnalyticsOverview');
  const usageQuery = useEntityQuery(platformOverviewEntity, 'fetchPlatformActivity', params);
  const charts = useSaCharts({
    company: useEntityQuery(platformOverviewEntity, 'fetchCompanyGrowth', params),
    employee: useEntityQuery(platformOverviewEntity, 'fetchEmployeeGrowth', params),
    usage: usageQuery,
  }, BUILDERS, () => showToast('Some charts failed to load.', 'error'));
  const overview = overviewQuery.data;
  const usage = usageQuery.data;
  // null loading | 'error' | [defs]
  const stats = overviewQuery.error || usageQuery.error ? 'error' : overview && usage ? [
    { key: 'total_companies', label: 'Total Registered Companies', icon: 'ph-buildings', tone: 'primary', value: overview.total_companies },
    { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success', value: overview.active_companies },
    { key: 'total_employees', label: 'Total Employees', icon: 'ph-users-three', tone: 'info', value: overview.total_employees },
    { key: 'active_subscriptions', label: 'Active Subscriptions', icon: 'ph-credit-card', tone: 'purple', value: overview.active_subscriptions },
    { key: 'total_actions', label: 'Platform Actions (range)', icon: 'ph-activity', tone: 'warning', value: usage.total_actions },
  ] : null;
  const apply = (selection) => setParams(rangeParams(selection));

  const isCustom = form.range === 'custom';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  // A custom range needs a start date; the end date is optional but not before it.
  const rangeValidation = useFormValidation(dateRangeSchema({ fromRequired: true }), form, { idPrefix: 'analytics' });
  const applyRange = () => {
    if (isCustom && !rangeValidation.validateAll()) return;
    rangeValidation.reset();
    apply(form);
  };

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Analytics" title="Analytics" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="card filter-bar">
          <div className="filters-wrap">
            <select id="range-select" className="filter-select" aria-label="Date range" value={form.range} onChange={set('range')}>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
              <option value="custom">Custom range</option>
            </select>
            {isCustom && (
              <>
                <input type="date" className="filter-select" aria-label="From date" aria-required="true" max={form.to || undefined} value={form.from} onChange={set('from')} {...rangeValidation.input('from', 'from-date')} />
                <input type="date" className="filter-select" aria-label="To date" min={form.from || undefined} value={form.to} onChange={set('to')} {...rangeValidation.input('to', 'to-date')} />
              </>
            )}
            <button type="button" className="btn btn-primary" id="btn-apply-range" onClick={applyRange}>Apply</button>
          </div>
          {isCustom && (
            <div style={{ width: '100%' }}>
              <FieldError {...rangeValidation.errorProps('from')} />
              <FieldError {...rangeValidation.errorProps('to')} />
            </div>
          )}
        </div>

        <div className="stats-grid" id="analytics-stats-grid">
          {stats === 'error' ? (
            <div className="error-state" style={{ gridColumn: '1/-1' }}><i className="ph ph-warning-circle"></i> Failed to load analytics.</div>
          ) : (
            Array.isArray(stats) &&
            stats.map((def) => (
              <div key={def.key} className="card stat-card">
                <div className={`stat-icon ${def.tone}`}><i className={`ph-fill ${def.icon}`}></i></div>
                <div>
                  <div className="stat-value" id={`an-${def.key}`}><AnimatedCount value={def.value || 0} /></div>
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
