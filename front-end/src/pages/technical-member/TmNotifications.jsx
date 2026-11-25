// Converted from front-end/technical_member/notifications.html + js/views/technical_member/notifications.js
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import useAuth from '../../hooks/useAuth';
import { notificationsEntity } from '../../store/entities';
import { useEntityQuery } from '../../store/entitySlice';
import { formatDateTime } from '../../utils/saCommon';
import { TM_PORTAL } from './tmConstants';
import './styles/_shared.css';

function typeIcon(type) {
  if (type === 'error') return 'ph-warning-circle';
  if (type === 'warning') return 'ph-warning';
  return 'ph-info';
}

export default function TmNotifications() {
  const { user } = useAuth();
  // The original list stayed empty until the request finished.
  const query = useEntityQuery(notificationsEntity, 'fetchForUser', user.emp_id);
  const state = { status: query.error ? 'error' : query.data ? 'ready' : 'loading', list: query.data ?? [] };

  let content = null;
  if (state.status === 'error') {
    content = <div className="error-state" style={{ padding: 48 }}><i className="ph ph-warning-circle"></i> Failed to load notifications.</div>;
  } else if (state.status === 'ready' && state.list.length === 0) {
    content = <div className="empty-state" style={{ padding: 48 }}><i className="ph ph-bell"></i> No notifications yet.</div>;
  } else if (state.status === 'ready') {
    content = state.list.map((n, i) => (
      <div key={n.id ?? i} className="comment-item" style={{ margin: '8px 16px' }}>
        <span className="comment-author"><i className={`ph ${typeIcon(n.type)}`}></i> {n.message}</span>
        <span className="comment-time">{formatDateTime(n.timestamp)}</span>
      </div>
    ));
  }

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Technical Notifications" title="Notifications" portal={TM_PORTAL} />

      <div className="tm-shell">
        <div className="card" style={{ padding: '8px 0' }}>
          <div id="notif-list">{content}</div>
        </div>
      </div>
    </>
  );
}
