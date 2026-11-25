// Converted from front-end/super_admin/revenue.html + js/views/super_admin/revenue.js
import { useState } from 'react';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import SaChartCard from '../../components/sa-common/SaChartCard';
import SaFilterBar from '../../components/sa-common/SaFilterBar';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import { StateRow } from '../../components/sa-common/saForm';
import useSaToast from '../../components/sa-common/useSaToast';
import FieldError from '../../components/common/FieldError';
import { validateForm } from '../../utils/validation';
import { dateRangeSchema } from '../../validation/formSchemas';
import useSaCharts from '../../components/sa-common/useSaCharts';
import { companiesEntity, employeesEntity, paymentsEntity, platformOverviewEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { formatCurrency, formatDate, paginate, loadStateOf } from '../../utils/saCommon';
import { SA_PORTAL } from './saConstants';
import './styles/_shared.css';
import './styles/revenue.css';

const PAGE_SIZE = 10;
const COLS = 9;
const EMPTY_FILTERS = { search: '', companyId: '', platformAdminId: '', status: 'all' };

const STAT_DEFS = [
  { key: 'total_revenue', label: 'Total Revenue', icon: 'ph-currency-circle-dollar', tone: 'success', currency: true },
  { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ph-calendar-check', tone: 'primary', currency: true },
  { key: 'annual_revenue', label: 'Annual Revenue', icon: 'ph-chart-line-up', tone: 'purple', currency: true },
  { key: 'transaction_count', label: 'Successful Payments', icon: 'ph-check-circle', tone: 'info' },
  { key: 'pending_count', label: 'Pending Payments', icon: 'ph-hourglass-medium', tone: 'warning' },
];

const CHARTS = [
  { key: 'byPlan', title: 'Revenue by Plan', icon: 'ph-chart-bar', color: 'var(--sa-primary)' },
  { key: 'byCompany', title: 'Revenue by Company', icon: 'ph-buildings', color: 'var(--sa-success)' },
  { key: 'byPa', title: 'Revenue by Platform Admin', icon: 'ph-shield-star', color: 'var(--sa-purple)' },
];

function statusBadgeClass(status) {
  if (status === 'PAID') return 'badge-active';
  if (status === 'FAILED') return 'badge-suspended';
  return 'badge-pending';
}

// Backend data -> Chart.js config (data comes from the platformOverview slice).
const bar = (labels, data, color, horizontal, { textColor, gridColor }) => {
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true } },
  };
  return {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Revenue', data, backgroundColor: color, borderRadius: 4 }] },
    options: horizontal ? { ...common, indexAxis: 'y' } : common,
  };
};
const BUILDERS = {
  byPlan: (r, t) => bar(r.map((p) => p.plan_name), r.map((p) => p.revenue), '#2563EB', false, t),
  byCompany: (r, t) => bar(r.map((c) => c.company_name), r.map((c) => c.revenue), '#22C55E', true, t),
  byPa: (r, t) => bar(r.map((p) => p.platform_admin_name), r.map((p) => p.revenue), '#7C3AED', true, t),
};

export default function SaRevenue() {
  const [toast, showToast] = useSaToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [dates, setDates] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);

  const summaryQuery = useEntityQuery(platformOverviewEntity, 'fetchRevenueSummary');
  const summary = summaryQuery.data ?? null;
  const summaryError = Boolean(summaryQuery.error);
  // Filter dropdowns; a failed lookup just leaves its dropdown empty, as before.
  const { data: companies = [] } = useEntityQuery(companiesEntity, 'fetchAll');
  const { data: admins = [] } = useEntityQuery(employeesEntity, 'fetchPlatformAdmins');
  const charts = useSaCharts({
    byPlan: useEntityQuery(platformOverviewEntity, 'fetchRevenueByPlan'),
    byCompany: useEntityQuery(platformOverviewEntity, 'fetchRevenueByCompany'),
    byPa: useEntityQuery(platformOverviewEntity, 'fetchRevenueByPlatformAdmin'),
  }, BUILDERS, () => showToast('Some charts failed to load.', 'error'));
  // Revenue transactions are the same records as the Platform Admin payments (payments slice).
  const txQuery = useEntityQuery(paymentsEntity, 'fetchRevenueTransactions', filters);
  const transactions = txQuery.data ?? [];
  const loadState = loadStateOf(txQuery);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };
  const setDate = (key) => (e) => {
    setDates((d) => ({ ...d, [key]: e.target.value }));
    setPage(1);
  };

  // Date range is applied client-side over the already-filtered result set (as in the original).
  const dateErrors = validateForm(dateRangeSchema(), dates);
  const visible = Object.keys(dateErrors).length ? [] : transactions.filter((t) => (!dates.from || t.payment_date >= dates.from) && (!dates.to || t.payment_date <= dates.to));
  const { pageItems, page: safePage, totalPages, total } = paginate(visible, page, PAGE_SIZE);

  let rows;
  if (loadState === 'loading') rows = <StateRow colSpan={COLS} kind="loading">Loading transactions...</StateRow>;
  else if (loadState === 'error') rows = <StateRow colSpan={COLS} kind="error">Failed to load transactions.</StateRow>;
  else if (visible.length === 0) rows = <StateRow colSpan={COLS} kind="empty" icon="ph-receipt">No transactions found.</StateRow>;
  else {
    rows = pageItems.map((t) => (
      <tr key={t.transaction_id}>
        <td>{t.company_name}</td>
        <td>{t.company_admin_name || '-'}</td>
        <td>{t.platform_admin_name || '-'}</td>
        <td>{t.plan_name || t.plan_id}</td>
        <td>{formatCurrency(t.amount)}</td>
        <td>{t.is_mock ? <span className="badge badge-purple">MOCK</span> : t.payment_method || '-'}</td>
        <td>{t.transaction_id}</td>
        <td><span className={`badge ${statusBadgeClass(t.payment_status)}`}>{t.payment_status}</span></td>
        <td>{formatDate(t.payment_date)}</td>
      </tr>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Revenue" title="Revenue" portal={SA_PORTAL} />

      <div className="sa-shell">
        <div className="stats-grid" id="revenue-stats-grid">
          {summaryError ? (
            <div className="error-state" style={{ gridColumn: '1/-1' }}><i className="ph ph-warning-circle"></i> Failed to load revenue summary.</div>
          ) : (
            summary &&
            STAT_DEFS.map((def) => (
              <div key={def.key} className="card stat-card">
                <div className={`stat-icon ${def.tone}`}><i className={`ph-fill ${def.icon}`}></i></div>
                <div>
                  <div className="stat-value" id={`rev-${def.key}`}>{def.currency ? formatCurrency(summary[def.key]) : <AnimatedCount value={summary[def.key] || 0} />}</div>
                  <div className="stat-label">{def.label}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="charts-grid">
          {CHARTS.map((c) => (
            <SaChartCard key={c.key} id={`chart-${c.key}`} title={c.title} icon={c.icon} color={c.color} config={charts[c.key]} loaded={c.key in charts} />
          ))}
        </div>

        <div className="section-header">
          <h2 className="section-title">Payment Transactions</h2>
        </div>

        <SaFilterBar
          searchId="txn-search"
          placeholder="Search by company, admin, or transaction ID..."
          onSearch={(search) => setFilters((f) => ({ ...f, search }))}
          onClear={() => { setFilters(EMPTY_FILTERS); setDates({ from: '', to: '' }); }}
        >
          <select id="company-filter" className="filter-select" value={filters.companyId} onChange={setFilter('companyId')}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
          </select>
          <select id="platform-admin-filter" className="filter-select" value={filters.platformAdminId} onChange={setFilter('platformAdminId')}>
            <option value="">All Platform Admins</option>
            {admins.map((a) => <option key={a.emp_id} value={a.emp_id}>{a.emp_name}</option>)}
          </select>
          <select id="status-filter" className="filter-select" value={filters.status} onChange={setFilter('status')}>
            <option value="all">All Payment Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <input type="date" id="txn-date-from" className="filter-select" title="From date" aria-label="From date" max={dates.to || undefined} aria-invalid={Boolean(dateErrors.from)} aria-describedby={dateErrors.from ? 'txn-date-from-error' : undefined} value={dates.from} onChange={setDate('from')} />
          <input type="date" id="txn-date-to" className="filter-select" title="To date" aria-label="To date" min={dates.from || undefined} aria-invalid={Boolean(dateErrors.to)} aria-describedby={dateErrors.to ? 'txn-date-to-error' : undefined} value={dates.to} onChange={setDate('to')} />
        </SaFilterBar>
        <FieldError id="txn-date-from-error" message={dateErrors.from} />
        <FieldError id="txn-date-to-error" message={dateErrors.to} />

        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Company</th><th>Company Admin</th><th>Platform Admin</th><th>Plan</th><th>Amount</th><th>Payment Method</th><th>Transaction ID</th><th>Status</th><th>Payment Date</th>
              </tr>
            </thead>
            <tbody id="txn-tbody">{rows}</tbody>
          </table>
          {loadState === 'ready' && visible.length > 0 ? (
            <SaPagination id="txn-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="txn-pagination"></div>
          )}
        </div>
      </div>

      {toast}
    </>
  );
}
