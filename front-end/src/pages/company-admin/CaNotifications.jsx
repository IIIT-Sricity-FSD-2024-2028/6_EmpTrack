// Converted from front-end/company_admin/notifications.html + js/views/company_admin/notifications.js
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { notificationsEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { formatDateTime } from '../../utils/saCommon';
import './styles/notifications.css';

const TYPE_ICON = { error: 'ph-warning-circle', warning: 'ph-warning' };
const TYPE_COLOR = { error: 'var(--danger-color)', warning: 'var(--warning-color)' };

export default function CaNotifications() {
  usePageTitle('Company Admin Notifications');
  const { user } = useAuth();
  // Records come from the shared notifications slice; "read" is a per-visit UI flag
  // (the backend has no read state). A failed load shows the empty list, as before.
  const { data, error } = useEntityQuery(notificationsEntity, 'fetchForUser', user.emp_id);
  const [allRead, setAllRead] = useState(false);
  const notifications = data ? data.map((n) => ({ ...n, read: allRead })) : error ? [] : null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 800, margin: '0 auto 24px auto' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Notifications</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Stay updated with the latest alerts.</div>
        </div>
        <button type="button" className="btn btn-outline" id="btn-mark-all" onClick={() => setAllRead(true)}>Mark All as Read</button>
      </div>

      <div className="notifications-container" id="ca-notif-list">
        {notifications === null && <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading notifications...</div>}
        {notifications?.length === 0 && (
          <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="ph ph-bell" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No notifications yet.
          </div>
        )}
        {notifications?.map((n, i) => {
          const color = TYPE_COLOR[n.type] || 'var(--primary-color)';
          return (
            <div key={n.id ?? i} className={`notification-card${n.read ? '' : ' unread'}`} style={{ borderLeftColor: color }}>
              <i className={`ph-fill ${TYPE_ICON[n.type] || 'ph-info'} notification-icon`} style={{ color }}></i>
              <div className="notification-content">
                <div className="notification-title">{n.message}</div>
                <div className="notification-time">{formatDateTime(n.timestamp)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
