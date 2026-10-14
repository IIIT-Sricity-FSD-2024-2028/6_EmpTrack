import { useState } from 'react';
import EmptyState from '../../components/common/EmptyState';
import NotificationItem from '../../components/notifications/NotificationItem';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import usePageTitle from '../../hooks/usePageTitle';
import { getNotifications } from '../../services/teamLeadService';
import { DemoNotice, LoadState, Tabs, useToast } from './components/TeamLeadUI';
import './teamlead.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

export default function Notifications() {
  usePageTitle('Notifications');
  const { user } = useAuth();
  const { data, error, reload } = useFetch(() => getNotifications(user.emp_id), [user.emp_id]);
  // Read / dismissed state lasts for this visit, as in the original page (the API has no read flag).
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissed, setDismissed] = useState(() => new Set());
  const [filter, setFilter] = useState('all');
  const [toast, showToast] = useToast();

  const active = (data ?? []).filter((n) => !dismissed.has(n.id)).map((n) => ({ ...n, read: readIds.has(n.id) }));
  const unread = active.filter((n) => !n.read).length;
  const visible = active.filter((n) => filter === 'all' || !n.read);

  const markAllRead = () => {
    setReadIds(new Set(active.map((n) => n.id)));
    showToast('All notifications marked as read');
  };

  return (
    <div className="tl-page">
      <DemoNotice />
      <div className="highlight-banner">
        <div>
          <h2 className="hb-title">Team Alerts</h2>
          <div className="hb-sub">Leave requests, escalations and issues from your team</div>
        </div>
        <div className="hb-metrics">
          <div className="hb-metric"><span className="hb-metric-val">{unread}</span><span className="hb-metric-lbl">Unread</span></div>
          <div className="hb-metric"><span className="hb-metric-val">{active.length}</span><span className="hb-metric-lbl">Total</span></div>
        </div>
      </div>

      <div className="filter-bar">
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
        <button type="button" className="btn btn-secondary" onClick={markAllRead} disabled={unread === 0}>
          <i className="ph ph-check-double"></i> Mark All as Read
        </button>
      </div>

      <LoadState loading={!data && !error} error={error} onRetry={reload}>
        <div className="notif-list">
          {visible.length === 0 ? (
            <EmptyState icon="ph-bell" description={filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'} />
          ) : (
            visible.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={(t) => setReadIds((s) => new Set(s).add(t.id))}
                onDismiss={(t) => setDismissed((s) => new Set(s).add(t.id))}
              />
            ))
          )}
        </div>
      </LoadState>
      {toast}
    </div>
  );
}
