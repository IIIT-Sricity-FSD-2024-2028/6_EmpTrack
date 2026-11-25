import { useEffect, useState } from 'react';
import EmptyState from '../../components/common/EmptyState';
import NotificationItem from '../../components/notifications/NotificationItem';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { notificationsEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { cx } from '../../utils/helpers';
import PortalHeading from './components/PortalHeading';
import './styles/notifications.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

export default function EmployeeNotifications() {
  usePageTitle('Notifications');
  const { user } = useAuth();
  // Records come from the notifications slice (shared with the header bell).
  // Read / dismissed are UI flags kept for this visit only, as in the original
  // page - the backend has no endpoint to store them.
  const { data: records = [] } = useEntityQuery(notificationsEntity, 'fetchForUser', user.emp_id);
  const [readIds, setReadIds] = useState(() => new Set());
  const [allRead, setAllRead] = useState(false);
  const notifications = records.map((n) => ({ ...n, read: allRead || readIds.has(n.id) }));
  const [dismissed, setDismissed] = useState(() => new Set());
  const [filter, setFilter] = useState('all');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const timer = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const active = notifications.filter((n) => !dismissed.has(n.id));
  const visible = active.filter((n) => filter !== 'unread' || !n.read);
  const unreadCount = active.filter((n) => !n.read).length;

  const markRead = (target) => setReadIds((set) => new Set(set).add(target.id));
  const dismiss = (target) => setDismissed((set) => new Set(set).add(target.id));

  const markAllRead = () => {
    setAllRead(true);
    setToastVisible(true);
  };

  return (
    <div className="emp-notifications">
      <PortalHeading>My Notifications</PortalHeading>

      <div className="employee-notif-root">
        <div className="card highlight-banner">
          <div>
            <h2 className="hb-title">Recent Updates</h2>
            <div className="hb-sub">Stay up to date with tasks, leaves, and announcements</div>
          </div>
          <div className="hb-metrics">
            <div className="hb-metric">
              <span className="hb-metric-val">{unreadCount}</span>
              <span className="hb-metric-lbl">Unread</span>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="tab-list">
            {FILTERS.map(({ key, label }) => (
              <button key={key} type="button" className={cx('tab-btn', filter === key && 'active')} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-read-all" onClick={markAllRead}>
            <i className="ph ph-check-double"></i> Mark All as Read
          </button>
        </div>

        <div className="notif-list">
          {visible.length === 0 ? (
            <EmptyState icon="ph-bell" description="No notifications yet." />
          ) : (
            visible.map((n) => <NotificationItem key={n.id} notification={n} onMarkRead={markRead} onDismiss={dismiss} />)
          )}
        </div>
      </div>

      <div id="prof-toast" className={cx(toastVisible && 'show')}>
        <i className="ph-fill ph-check-circle"></i> All notifications marked as read!
      </div>
    </div>
  );
}
