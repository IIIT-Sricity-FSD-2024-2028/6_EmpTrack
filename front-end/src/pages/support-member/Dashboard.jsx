// Converted from front-end/support_member/dashboard.html + js/views/support_member/dashboard.js
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, DoughnutChart } from '../../components/platform/Charts';
import { isClosedStatus } from '../../components/platform/format';
import { DetailItem, ErrorState, PortalShell, SectionHeader, StatCard } from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { getStats, getTickets, IS_DEMO } from '../../services/supportMemberService';
import SupportTicketTable from './components/SupportTicketTable';
import useSupportBoard from './components/useSupportBoard';

// Unassigned / Critical are scope-wide counts. Critical has no link: no single
// page lists "everyone's critical tickets", so it is shown as context only.
const STAT_DEFS = [
  { key: 'unassigned_tickets', label: 'Unassigned', icon: 'ph-tray', tone: 'warning', link: '/support-member/my-tickets?assignment=unassigned' },
  { key: 'my_open_tickets', label: 'My Open Tickets', icon: 'ph-user-focus', tone: 'info', link: '/support-member/my-tickets' },
  { key: 'critical_tickets', label: 'Critical Tickets', icon: 'ph-fire', tone: 'danger' },
  { key: 'escalated_tickets', label: 'Escalated', icon: 'ph-arrow-up-right', tone: 'purple', link: '/support-member/escalated' },
  { key: 'resolved_today', label: 'Resolved Today', icon: 'ph-check-circle', tone: 'success', link: '/support-member/my-tickets?status=RESOLVED&date=today' },
];
const PRIORITY_COLORS = { Critical: '#EF4444', High: '#F97316', Medium: '#3B82F6', Low: '#94A3B8' };
const RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/** Six most urgent open tickets. */
const topByPriority = (tickets) => (tickets ?? [])
  .filter((t) => !isClosedStatus(t.status))
  .sort((a, b) => (RANK[a.priority] ?? 4) - (RANK[b.priority] ?? 4))
  .slice(0, 6);

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useFetch(getStats, []);
  // Two clearly-scoped lists: the shared queue of unclaimed work and my own workload.
  const unassigned = useFetch(() => getTickets({ assignedTo: 'unassigned', status: 'all' }), []);
  const mine = useFetch(() => getTickets({ assignedTo: 'me', status: 'all' }), []);
  const board = useSupportBoard(() => {
    stats.reload();
    unassigned.reload();
    mine.reload();
  });

  const s = stats.data;
  const priorityData = Object.keys(s?.by_priority || {}).map((label) => ({ label, value: s.by_priority[label], color: PRIORITY_COLORS[label] || '#7C3AED' }));
  const categoryData = Object.keys(s?.by_category || {}).map((label) => ({ label, value: s.by_category[label] }));

  return (
    <PortalShell portal="sm" title="Dashboard" demo={IS_DEMO}>
      <div className="stats-grid">
        {stats.error ? (
          <ErrorState message="Failed to load dashboard summary." style={{ gridColumn: '1 / -1' }} />
        ) : (
          STAT_DEFS.map((d) => (
            <StatCard key={d.key} icon={d.icon} tone={d.tone} label={d.label} value={s?.[d.key] || 0} onClick={d.link ? () => navigate(d.link) : undefined} />
          ))
        )}
      </div>

      <div className="card metric-strip">
        <DetailItem label="Tickets Received"><div className="stat-value">{s?.tickets_received ?? '-'}</div></DetailItem>
        <DetailItem label="Tickets Resolved"><div className="stat-value">{s?.tickets_resolved ?? '-'}</div></DetailItem>
        <DetailItem label="Avg. Resolution Time"><div className="stat-value">{s ? (s.avg_resolution_days ? `${s.avg_resolution_days} days` : 'N/A') : '-'}</div></DetailItem>
      </div>

      {s && (
        <div className="grid-2">
          <div className="card" style={{ padding: 20 }}>
            <SectionHeader title="Tickets by Priority" style={{ marginBottom: 16 }} />
            <DoughnutChart data={priorityData} label="Tickets by priority" />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <SectionHeader title="Tickets by Category" style={{ marginBottom: 16 }} />
            <BarChart data={categoryData} color="#2563EB" label="Tickets by category" />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <SectionHeader title="Unassigned Support Queue" style={{ marginBottom: 16 }} action={<Link to="/support-member/my-tickets?assignment=unassigned" className="section-link">View all &rarr;</Link>} />
        <div className="table-container">
          <SupportTicketTable
            tickets={unassigned.data && topByPriority(unassigned.data)}
            loading={unassigned.loading}
            error={unassigned.error && 'Failed to load the unassigned queue.'}
            emptyMessage="No unassigned tickets right now."
            onView={board.open}
            onClaim={board.claim}
            claimingId={board.claimingId}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <SectionHeader title="My Tickets Needing Attention" style={{ marginBottom: 16 }} action={<Link to="/support-member/my-tickets" className="section-link">View all &rarr;</Link>} />
        <div className="table-container">
          <SupportTicketTable
            tickets={mine.data && topByPriority(mine.data)}
            loading={mine.loading}
            error={mine.error && 'Failed to load your tickets.'}
            emptyMessage="No open tickets need your attention right now."
            onView={board.open}
            onClaim={board.claim}
            claimingId={board.claimingId}
          />
        </div>
      </div>
      {board.element}
    </PortalShell>
  );
}
