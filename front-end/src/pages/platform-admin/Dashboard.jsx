// Converted from front-end/platform_admin/dashboard.html + js/views/platform_admin/dashboard.js
import { formatDateTime } from '../../components/platform/format';
import { EmptyNote, ErrorState, PortalShell, SectionHeader, StatCard } from '../../components/platform/ShellUI';
import useFetch from '../../hooks/useFetch';
import { getDashboardSummary, IS_DEMO } from '../../services/platformAdminService';

const STAT_DEFS = [
  { key: 'assigned_companies', label: 'Assigned Companies', icon: 'ph-buildings', tone: 'primary' },
  { key: 'active_companies', label: 'Active Companies', icon: 'ph-check-circle', tone: 'success' },
  { key: 'technical_team_count', label: 'Technical Team Members', icon: 'ph-hard-drives', tone: 'purple' },
  { key: 'support_team_count', label: 'Support Team Members', icon: 'ph-headset', tone: 'info' },
  { key: 'open_technical_issues', label: 'Open Technical Issues', icon: 'ph-bug', tone: 'warning' },
  { key: 'open_support_tickets', label: 'Open Support Tickets', icon: 'ph-ticket', tone: 'warning' },
  { key: 'pending_escalations', label: 'Pending Escalations', icon: 'ph-siren', tone: 'danger' },
];

export default function Dashboard() {
  const { data: summary, loading, error } = useFetch(getDashboardSummary, []);

  return (
    <PortalShell portal="pa" title="Dashboard" demo={IS_DEMO}>
      <div className="stats-grid stacked">
        {error ? (
          <ErrorState message="Failed to load dashboard summary." style={{ gridColumn: '1 / -1' }} />
        ) : (
          STAT_DEFS.map((d) => <StatCard key={d.key} icon={d.icon} tone={d.tone} label={d.label} value={summary?.[d.key] || 0} />)
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <SectionHeader title="Recent Activity" style={{ marginBottom: 16 }} />
        {loading && <div className="ops-empty"><div className="spinner"></div>Loading...</div>}
        {summary && (summary.recent_activity?.length ? (
          summary.recent_activity.map((a, i) => (
            <div key={a.activity_id ?? i} className="comment-item">
              <span className="comment-author">{a.action}</span>
              <span className="comment-time">{formatDateTime(a.timestamp)}</span>
              <div className="comment-message">{a.details || ''}{a.company_name ? ` · ${a.company_name}` : ''}</div>
            </div>
          ))
        ) : (
          <EmptyNote icon="ph-list-magnifying-glass" message="No recorded activity yet." />
        ))}
      </div>
    </PortalShell>
  );
}
