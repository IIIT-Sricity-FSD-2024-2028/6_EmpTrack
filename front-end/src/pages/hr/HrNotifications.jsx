// Converted from front-end/hr/notifications.html + js/views/hr/notifications.js.
// Read / dismissed state is per visit, as in the original (the backend has no endpoint for it).
import { useEffect, useState } from 'react';
import useSaToast from '../../components/sa-common/useSaToast';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { getNotifications } from '../../services/hrService';
import { formatDateTime } from '../../utils/saCommon';
import './styles/notifications.css';

const TYPE_ICON = { error: 'ph-warning-circle', warning: 'ph-warning' };
const TYPE_COLOR = { error: 'var(--danger-color)', warning: 'var(--warning-color)' };

export default function HrNotifications() {
  usePageTitle('Notifications');
  const { user } = useAuth();
  const [toast, showToast] = useSaToast();
  const [notifications, setNotifications] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getNotifications(user.emp_id)
      .then((list) => setNotifications(list.map((n, i) => ({ ...n, key: n.id ?? i, read: false, dismissed: false }))))
      .catch(() => setNotifications([]));
  }, [user.emp_id]);

  const update = (key, changes) => setNotifications((list) => list.map((n) => (n.key === key ? { ...n, ...changes } : n)));
  const live = (notifications || []).filter((n) => !n.dismissed);
  const term = search.toLowerCase();
  const visible = live.filter((n) => (filter !== 'unread' || !n.read) && (!term || n.message.toLowerCase().includes(term)));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <input
          type="text" maxLength={100} id="notif-search" placeholder="Search notifications..." aria-label="Search notifications" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-family)' }}
        />
      </div>

      <div className="hr-notif-root">
        <div className="card highlight-banner">
          <div>
            <h2 className="hb-title">HR Notifications</h2>
            <div className="hb-sub">Monitor critical HR activities and escalations</div>
          </div>
          <div className="hb-metrics">
            <div className="hb-metric"><span className="hb-metric-val" id="met-unread">{live.filter((n) => !n.read).length}</span><span className="hb-metric-lbl">Unread</span></div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="tab-list">
            {['all', 'unread'].map((f) => (
              <button key={f} type="button" className={`tab-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : 'Unread'}</button>
            ))}
          </div>
          <button
            type="button" className="btn-read-all" id="btn-mark-all"
            onClick={() => { setNotifications((list) => (list || []).map((n) => ({ ...n, read: true }))); showToast('All notifications marked as read!'); }}
          >
            <i className="ph ph-check-double"></i> Mark All as Read
          </button>
        </div>

        <div className="notif-list" id="hr-notif-list">
          {notifications === null && <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading notifications...</div>}
          {notifications !== null && visible.length === 0 && (
            <div className="empty-state" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="ph ph-bell" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No notifications yet.
            </div>
          )}
          {visible.map((n) => {
            const color = TYPE_COLOR[n.type] || 'var(--primary-color)';
            return (
              <div key={n.key} className={`notif-item${n.read ? '' : ' unread'}`}>
                <div className="ni-icon" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
                  <i className={`ph-fill ${TYPE_ICON[n.type] || 'ph-info'}`}></i>
                </div>
                <div className="ni-content">
                  <div className="ni-header">
                    <h4 className="ni-title">{n.message}</h4>
                    <span className="ni-time">{formatDateTime(n.timestamp)}</span>
                  </div>
                </div>
                <div className="ni-actions">
                  <button type="button" className="ni-action-btn btn-done" title="Mark as Done/Read" aria-label="Mark as read" onClick={() => update(n.key, { read: true })}><i className="ph ph-check"></i></button>
                  <button type="button" className="ni-action-btn btn-del" title="Dismiss" aria-label="Dismiss" onClick={() => update(n.key, { dismissed: true })}><i className="ph ph-x"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast}
    </>
  );
}
