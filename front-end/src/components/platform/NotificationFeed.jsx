import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { formatDateTime } from './format';
import { EmptyNote, ErrorState } from './ShellUI';

const TYPE_ICON = { error: 'ph-warning-circle', warning: 'ph-warning' };

/**
 * Backend notification links point at the original static pages, e.g.
 * /front-end/platform_admin/support-tickets.html?open=TIX-1 ->
 * /platform-admin/support-tickets?open=TIX-1 (the React route).
 */
function toRoute(link) {
  const match = /\/front-end\/([a-z_]+)\/([a-z-]+)\.html(\?.*)?$/.exec(link || '');
  return match ? `/${match[1].replace(/_/g, '-')}/${match[2]}${match[3] || ''}` : null;
}

/**
 * Notification list from the original notifications pages (platform_admin and
 * support_member). The backend has no read/unread flag or delete endpoint, and
 * the original pages offered no such actions, so the list is read-only; links
 * open the related ticket (Platform Admin "View Issue").
 */
export default function NotificationFeed({ loader, showLinks }) {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(() => loader(user.emp_id), [user.emp_id]);

  let content;
  if (loading) content = <div className="ops-empty"><div className="spinner"></div>Loading notifications...</div>;
  else if (error) content = <ErrorState message="Failed to load notifications." />;
  else if (!data?.length) content = <EmptyNote icon="ph-bell" message="No notifications yet." />;
  else {
    content = data.map((n, i) => {
      const route = showLinks && toRoute(n.link);
      return (
        <div key={n.id ?? i} className="comment-item">
          <span className="comment-author"><i className={`ph ${TYPE_ICON[n.type] || 'ph-info'}`}></i> {n.message}</span>
          <span className="comment-time">{formatDateTime(n.timestamp)}</span>
          {route && <div><Link to={route} className="notif-link">View Issue &rarr;</Link></div>}
        </div>
      );
    });
  }

  return (
    <div className="card notif-list" style={{ padding: '8px 0' }}>
      {content}
    </div>
  );
}
