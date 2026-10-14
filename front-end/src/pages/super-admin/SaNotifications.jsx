// Converted from front-end/super_admin/notifications.html + js/views/super_admin/notifications.js
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { getNotificationsForUser } from '../../services/notificationService';
import { formatDateTime } from '../../utils/saCommon';
import './styles/_shared.css';
import './styles/notifications.css';

export default function SaNotifications() {
  const { user } = useAuth();
  const { data: notifications, loading, error } = useFetch(() => getNotificationsForUser(user.emp_id), [user.emp_id]);

  let content;
  if (loading) {
    content = <div className="card" style={{ padding: 40, textAlign: 'center' }}><div className="spinner"></div><div>Loading notifications...</div></div>;
  } else if (error) {
    content = <div className="card error-state"><i className="ph ph-warning-circle"></i> Failed to load notifications.</div>;
  } else if (!notifications?.length) {
    content = <div className="card empty-state"><i className="ph ph-bell"></i> No notifications yet.</div>;
  } else {
    content = notifications.map((n, i) => (
      <div key={n.id || i} className={`card notif-card${n.is_read ? '' : ' unread'}`}>
        <i className="ph-fill ph-bell notif-icon"></i>
        <div>
          <div className="notif-title">{n.message}</div>
          <div className="notif-time">{formatDateTime(n.timestamp)}</div>
        </div>
      </div>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Notifications" title="Super Admin Notifications" />
      <div className="sa-shell" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="section-header">
          <h2 className="section-title">Notifications</h2>
        </div>
        <div id="notif-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{content}</div>
      </div>
    </>
  );
}
