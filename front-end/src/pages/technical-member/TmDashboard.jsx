// Converted from front-end/technical_member/dashboard.html + js/views/technical_member/dashboard.js
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedCount from '../../components/sa-common/AnimatedCount';
import ChartCanvas from '../../components/sa-common/ChartCanvas';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useSaToast from '../../components/sa-common/useSaToast';
import * as tm from '../../services/technicalMemberService';
import { chartTheme, formatDateTime, loadChartJs } from '../../utils/saCommon';
import IssueRows, { IssueTableHead } from './components/IssueRows';
import useIssueDetail from './components/useIssueDetail';
import { TM_BASE, TM_PORTAL } from './tmConstants';
import './styles/_shared.css';

const STAT_DEFS = [
  { key: 'assigned_issues', label: 'Assigned Issues', icon: 'ph-bug', tone: 'primary', link: 'assigned-issues' },
  { key: 'open_issues', label: 'Open Issues', icon: 'ph-tray', tone: 'info', link: 'assigned-issues?status=OPEN' },
  { key: 'in_progress_issues', label: 'In Progress Issues', icon: 'ph-spinner-gap', tone: 'purple', link: 'assigned-issues?status=IN_PROGRESS' },
  { key: 'resolved_today', label: 'Resolved Today', icon: 'ph-check-circle', tone: 'success', link: 'issue-history' },
  { key: 'high_priority_issues', label: 'High Priority Issues', icon: 'ph-fire', tone: 'danger', link: 'assigned-issues?priority=High' },
];

const KIND_ICON = { PROGRESS: 'ph-chart-line-up', NOTE: 'ph-note', ATTACHMENT: 'ph-paperclip', COMMENT: 'ph-chat-circle-dots', VERIFICATION: 'ph-shield-check' };

// Fixed status order + color pairing (kept from the original chart).
const STATUS_ORDER = [
  { key: 'OPEN', label: 'Open', color: '#3B82F6' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#F97316' },
  { key: 'CLOSED', label: 'Closed', color: '#94A3B8' },
  { key: 'RESOLVED', label: 'Resolved', color: '#22C55E' },
  { key: 'ESCALATED', label: 'Escalated', color: '#EF4444' },
];

function buildCharts(stats) {
  const { textColor, gridColor } = chartTheme();
  const progress = stats.work_progress || [];
  const workProgress = {
    type: 'bar',
    data: {
      labels: progress.map((p) => p.label),
      datasets: [
        { label: 'Issues Resolved', data: progress.map((p) => p.resolved), backgroundColor: '#22C55E', borderRadius: 4 },
        { label: 'Activity Updates', data: progress.map((p) => p.updates), backgroundColor: '#2563EB', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true },
      },
    },
  };
  const present = STATUS_ORDER.filter((s) => (stats.by_status || {})[s.key] > 0);
  const status = {
    type: 'doughnut',
    data: {
      labels: present.map((s) => s.label),
      datasets: [{ data: present.map((s) => stats.by_status[s.key]), backgroundColor: present.map((s) => s.color) }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } },
  };
  return { workProgress, status };
}

export default function TmDashboard() {
  const navigate = useNavigate();
  const [toast, showToast] = useSaToast();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [recent, setRecent] = useState({ status: 'loading', list: [] });
  const [updates, setUpdates] = useState({ status: 'loading', list: [] });
  const [charts, setCharts] = useState(null);

  const loadAll = useCallback(async (isCancelled = () => false) => {
    let loadedStats = null;
    try {
      loadedStats = await tm.getTechnicalMemberStats();
      if (!isCancelled()) {
        setStats(loadedStats);
        setStatsError(false);
      }
    } catch {
      if (!isCancelled()) setStatsError(true);
    }

    // Recent assigned issues needing attention: not yet closed, most recently updated first.
    try {
      const issues = await tm.getMyTechnicalIssues({ scope: 'active' });
      if (!isCancelled()) setRecent({ status: 'ready', list: issues.slice(0, 6) });
    } catch {
      if (!isCancelled()) setRecent({ status: 'error', list: [] });
    }

    // Recent updates: flattened activity feed across every assigned issue.
    try {
      const list = await tm.getTechnicalMemberRecentUpdates(10);
      if (!isCancelled()) setUpdates({ status: 'ready', list: list || [] });
    } catch {
      if (!isCancelled()) setUpdates({ status: 'error', list: [] });
    }

    if (loadedStats) {
      try {
        await loadChartJs();
        if (!isCancelled()) setCharts(buildCharts(loadedStats));
      } catch {
        // Charts are a progressive enhancement; stats/table above still work without them.
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAll(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // The original reloaded the whole page after a change made in the issue modal;
  // re-fetching the dashboard data gives the same refreshed view.
  const { openIssue, issueModal } = useIssueDetail({ onChanged: () => loadAll(), showToast });

  let updatesContent;
  if (updates.status === 'loading') {
    updatesContent = <div className="loader-row" style={{ padding: 24, textAlign: 'center' }}><div className="spinner"></div><div>Loading...</div></div>;
  } else if (updates.status === 'error') {
    updatesContent = <div className="error-state" style={{ padding: 24 }}><i className="ph ph-warning-circle"></i> Failed to load recent updates.</div>;
  } else if (updates.list.length === 0) {
    updatesContent = <div className="empty-state" style={{ padding: 24 }}><i className="ph ph-clock-counter-clockwise"></i> No recent activity yet.</div>;
  } else {
    updatesContent = updates.list.map((u, i) => (
      <div key={i} className="timeline-item">
        <div className="timeline-dot"></div>
        <div className="timeline-body">
          <div className="timeline-title"><i className={`ph ${KIND_ICON[u.kind] || 'ph-info'}`}></i> {u.ticket_id}: {u.message}</div>
          <div className="timeline-sub">{u.title}{u.actor ? <> &middot; {u.actor}</> : null}</div>
        </div>
        <div className="timeline-time">{formatDateTime(u.timestamp)}</div>
      </div>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Technical Dashboard" title="Dashboard" portal={TM_PORTAL} />

      <div className="tm-shell">
        <div className="stats-grid" id="tm-stats-grid">
          {statsError ? (
            <div className="error-state" style={{ gridColumn: '1/-1' }}><i className="ph ph-warning-circle"></i> Failed to load dashboard summary.</div>
          ) : (
            stats &&
            STAT_DEFS.map((def) => (
              <div key={def.key} className="card stat-card clickable" onClick={() => navigate(`${TM_BASE}/${def.link}`)}>
                <div className={`stat-icon ${def.tone}`}><i className={`ph-fill ${def.icon}`}></i></div>
                <div>
                  <div className="stat-value"><AnimatedCount value={stats[def.key] || 0} /></div>
                  <div className="stat-label">{def.label}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div><span className="detail-label">Pending Verification</span><div className="stat-value" style={{ fontSize: 20 }} id="tm-pending-verification">{stats ? stats.pending_verification ?? '-' : '-'}</div></div>
          <div><span className="detail-label">Total Resolved</span><div className="stat-value" style={{ fontSize: 20 }} id="tm-resolved-total">{stats ? stats.resolved_total ?? '-' : '-'}</div></div>
          <div><span className="detail-label">Avg. Resolution Time</span><div className="stat-value" style={{ fontSize: 20 }} id="tm-avg-resolution">{stats ? (stats.avg_resolution_days ? `${stats.avg_resolution_days} days` : 'N/A') : '-'}</div></div>
          <div><span className="detail-label">Avg. Progress (Active Issues)</span><div className="stat-value" style={{ fontSize: 20 }} id="tm-avg-progress">{stats ? (stats.active_issues ? `${stats.avg_progress}%` : 'N/A') : '-'}</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-header" style={{ marginBottom: 16 }}><h2 className="section-title">Work Progress (Last 7 Days)</h2></div>
            <div style={{ height: 240 }}><ChartCanvas id="chartWorkProgress" config={charts?.workProgress} /></div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-header" style={{ marginBottom: 16 }}><h2 className="section-title">Issue Status Distribution</h2></div>
            <div style={{ height: 240 }}><ChartCanvas id="chartStatus" config={charts?.status} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <h2 className="section-title">Recent Assigned Issues</h2>
              <Link to={`${TM_BASE}/assigned-issues`} style={{ fontSize: 13, color: 'var(--tm-primary)', textDecoration: 'none' }}>View all &rarr;</Link>
            </div>
            <div className="table-container">
              <table>
                <IssueTableHead />
                <IssueRows
                  id="tm-recent-issues"
                  issues={recent.list}
                  status={recent.status}
                  loadingText="Loading..."
                  errorText="Failed to load recent issues."
                  emptyMessage="No active issues assigned right now."
                  onOpen={openIssue}
                />
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="section-header" style={{ marginBottom: 16 }}><h2 className="section-title">Recent Updates</h2></div>
            <div id="tm-recent-updates" className="timeline" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {updatesContent}
            </div>
          </div>
        </div>
      </div>

      {issueModal}
      {toast}
    </>
  );
}
