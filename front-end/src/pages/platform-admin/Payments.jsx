// Converted from front-end/platform_admin/payments.html + js/views/platform_admin/payments.js
import { useMemo, useState } from 'react';
import { formatCurrency, formatDate, paginate, paymentStatusBadge } from '../../components/platform/format';
import {
  ClearButton, ErrorState, FilterSelect, Pagination, PortalShell, SearchInput, SectionHeader, ShellTable, StatCard, useDebounced,
} from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { getPayments, getPaymentSummary, IS_DEMO } from '../../services/platformAdminService';

const PAGE_SIZE = 10;
const SUMMARY_DEFS = [
  { key: 'assigned_companies', label: 'Assigned Companies', icon: 'ph-buildings', tone: 'primary' },
  { key: 'paid_payments', label: 'Paid Payments', icon: 'ph-check-circle', tone: 'success' },
  { key: 'pending_payments', label: 'Pending Payments', icon: 'ph-hourglass-medium', tone: 'warning' },
  { key: 'revenue', label: 'Revenue', icon: 'ph-currency-circle-dollar', tone: 'info', currency: true },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
];

const COLUMNS = [
  { key: 'company_name', header: 'Company' },
  { key: 'admin', header: 'Company Admin', render: (p) => p.company_admin_name || '-' },
  { key: 'plan_name', header: 'Plan' },
  { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
  { key: 'method', header: 'Payment Method', render: (p) => (p.is_mock ? <span className="badge badge-mock">MOCK</span> : p.payment_method || '-') },
  { key: 'transaction_id', header: 'Transaction ID' },
  { key: 'status', header: 'Status', render: (p) => <span className={`badge ${paymentStatusBadge(p.payment_status)}`}>{p.payment_status}</span> },
  { key: 'date', header: 'Payment Date', render: (p) => formatDate(p.payment_date) },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const query = useDebounced(search.trim());

  const { data: summary, error: summaryError } = useFetch(getPaymentSummary, []);
  // Company, status and search are filtered by the backend (as in the original)...
  const { data: payments, loading, error } = useFetch(() => getPayments({ companyId, status, search: query }), [companyId, status, query]);
  // ...and the company dropdown lists every company with payments, so it is loaded unfiltered.
  const { data: allPayments } = useFetch(() => getPayments(), []);

  const companies = useMemo(() => {
    const seen = new Map();
    (allPayments ?? []).forEach((p) => !seen.has(p.company_id) && seen.set(p.company_id, p.company_name));
    return [{ value: '', label: 'All Companies' }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [allPayments]);

  // Date range is applied client-side, like the original (the endpoint has no date params).
  const filtered = useMemo(
    () => (payments ?? []).filter((p) => (!dateFrom || p.payment_date >= dateFrom) && (!dateTo || p.payment_date <= dateTo)),
    [payments, dateFrom, dateTo],
  );
  const pager = paginate(filtered, page, PAGE_SIZE);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const clear = () => {
    setSearch('');
    setCompanyId('');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <PortalShell portal="pa" title="Company Payments" demo={IS_DEMO}>
      <div className="stats-grid">
        {summaryError ? (
          <ErrorState message="Failed to load summary." style={{ gridColumn: '1 / -1' }} />
        ) : (
          SUMMARY_DEFS.map((d) => (
            <StatCard key={d.key} icon={d.icon} tone={d.tone} label={d.label} value={summary?.[d.key] || 0} format={d.currency ? formatCurrency : undefined} />
          ))
        )}
      </div>

      <SectionHeader title="Payments From My Companies" />

      <div className="card filter-bar">
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Search by company or company admin..." />
        <div className="filters-wrap">
          <FilterSelect label="Company" value={companyId} onChange={changeFilter(setCompanyId)} options={companies} />
          <FilterSelect label="Status" value={status} onChange={changeFilter(setStatus)} options={STATUS_OPTIONS} />
          <input type="date" className="filter-select" title="From date" aria-label="From date" value={dateFrom} max={dateTo || undefined} onChange={(e) => changeFilter(setDateFrom)(e.target.value)} />
          <input type="date" className="filter-select" title="To date" aria-label="To date" value={dateTo} min={dateFrom || undefined} onChange={(e) => changeFilter(setDateTo)(e.target.value)} />
          <ClearButton onClick={clear} />
        </div>
      </div>

      <div className="card table-container">
        <ShellTable
          columns={COLUMNS}
          rows={payments ? pager.pageItems : null}
          rowKey="transaction_id"
          loading={loading}
          error={error && 'Failed to load payments.'}
          loadingText="Loading payments..."
          emptyIcon="ph-receipt"
          emptyText="No payments found."
        />
        {payments && <Pagination {...pager} onChange={setPage} />}
      </div>
    </PortalShell>
  );
}
