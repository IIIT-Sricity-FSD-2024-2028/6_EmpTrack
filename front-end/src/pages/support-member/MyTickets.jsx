// Converted from front-end/support_member/my-tickets.html + js/views/support_member/my-tickets.js
//
// Two scopes only: "My Tickets" (assignedTo=me, the default) and the shared
// "Unassigned Support Queue" (?assignment=unassigned). Status / priority /
// category / search are filtered by the backend; the date range client-side
// (the endpoint has no date parameter). Filters live in the query string, so the
// dashboard's stat cards and "View all" links can deep-link into a filtered view.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paginate } from '../../components/platform/format';
import { ClearButton, FilterSelect, Pagination, PortalShell, SearchInput, SectionHeader, useDebounced } from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { cx } from '../../utils/helpers';
import { getCategories, getTickets, IS_DEMO } from '../../services/supportMemberService';
import SupportTicketTable from './components/SupportTicketTable';
import useSupportBoard from './components/useSupportBoard';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_CUSTOMER', label: 'Waiting for Customer' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];
const DATE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
];
const pick = (options, raw, normalize = (v) => v) => options.find((o) => o.value !== 'all' && normalize(o.value) === normalize(raw || ''))?.value || 'all';

/** Resolved/closed tickets are dated by resolution, others by creation (original rule). */
function matchesDate(ticket, filter) {
  if (filter === 'all') return true;
  const raw = ['RESOLVED', 'CLOSED'].includes(ticket.status) ? ticket.resolved_date || ticket.created_date : ticket.created_date;
  const when = new Date(raw);
  if (!raw || Number.isNaN(when.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBack = (n) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - n);
    return d;
  };
  if (filter === 'today') return when >= startOfToday;
  if (filter === '7days') return when >= daysBack(6);
  if (filter === '30days') return when >= daysBack(29);
  if (filter === 'month') return when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth();
  return true;
}

export default function MyTickets() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useFetch(() => getCategories().catch(() => []), []);

  // Unknown values in the URL fall back to "all", like the original readFiltersFromUrl.
  const unassigned = (params.get('assignment') || '').toLowerCase() === 'unassigned';
  const status = pick(STATUS_OPTIONS, params.get('status'), (v) => v.toUpperCase());
  const priority = pick(PRIORITY_OPTIONS, params.get('priority'), (v) => v.toLowerCase());
  const date = pick(DATE_OPTIONS, params.get('date'), (v) => v.toLowerCase());
  const category = (categories ?? []).find((c) => c.toLowerCase() === (params.get('category') || '').toLowerCase()) || 'all';

  const [search, setSearch] = useState(params.get('search') || '');
  const query = useDebounced(search.trim());
  const [page, setPage] = useState(1);

  /** Writes filters to the URL (replace, so the back button isn't flooded). */
  const update = (changes) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => (value && value !== 'all' ? next.set(key, value) : next.delete(key)));
      return next;
    }, { replace: true });
    setPage(1);
  };

  useEffect(() => {
    if (query !== (params.get('search') || '')) update({ search: query });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const { data: tickets, loading, error, reload } = useFetch(
    () => getTickets({ assignedTo: unassigned ? 'unassigned' : 'me', status, priority, category, search: query }),
    [unassigned, status, priority, category, query],
  );
  const board = useSupportBoard(reload);

  const filtered = useMemo(() => (tickets ?? []).filter((t) => matchesDate(t, date)), [tickets, date]);
  const pager = paginate(filtered, page, PAGE_SIZE);
  const categoryOptions = [{ value: 'all', label: 'All Categories' }, ...(categories ?? []).map((c) => ({ value: c, label: c }))];

  // Clear resets the field filters but keeps the scope (My Tickets vs. Unassigned Queue).
  const clear = () => {
    setSearch('');
    update({ status: 'all', priority: 'all', category: 'all', date: 'all', search: '' });
  };

  return (
    <PortalShell portal="sm" title="My Tickets" demo={IS_DEMO}>
      <SectionHeader title={unassigned ? 'Unassigned Support Queue' : 'Tickets Assigned to Me'} />

      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="chip-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!unassigned} className={cx('chip-tab', !unassigned && 'active')} onClick={() => update({ assignment: '' })}>My Tickets</button>
          <button type="button" role="tab" aria-selected={unassigned} className={cx('chip-tab', unassigned && 'active')} onClick={() => update({ assignment: 'unassigned' })}>Unassigned Support Queue</button>
        </div>
      </div>

      <div className="card filter-bar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by Ticket ID, company, subject, user or email..." />
        <div className="filters-wrap">
          <FilterSelect label="Status" value={status} onChange={(v) => update({ status: v })} options={STATUS_OPTIONS} />
          <FilterSelect label="Priority" value={priority} onChange={(v) => update({ priority: v })} options={PRIORITY_OPTIONS} />
          <FilterSelect label="Category" value={category} onChange={(v) => update({ category: v })} options={categoryOptions} />
          <FilterSelect label="Date" value={date} onChange={(v) => update({ date: v })} options={DATE_OPTIONS} />
          <ClearButton onClick={clear} />
        </div>
      </div>

      <div className="card table-container">
        <SupportTicketTable
          tickets={tickets ? pager.pageItems : null}
          loading={loading}
          error={error && 'Unable to load tickets. Please try again.'}
          loadingText="Loading your tickets..."
          emptyMessage={unassigned ? 'No unassigned tickets match the selected filters.' : 'No tickets match the selected filters.'}
          onView={board.open}
          onClaim={board.claim}
          claimingId={board.claimingId}
        />
        {tickets && <Pagination {...pager} onChange={setPage} />}
      </div>
      {board.element}
    </PortalShell>
  );
}
