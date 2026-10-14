import { cx, formatDateTime } from '../../utils/helpers';

const TYPE_ICON = { error: 'ph-warning-circle', warning: 'ph-warning' };
const TYPE_COLOR = { error: 'var(--danger-color)', warning: 'var(--warning-color)' };

/**
 * One notification row in the original .notif-item markup (used by the
 * Employee, HR and Team Lead notification pages; each page's root class
 * supplies the .notif-item styles).
 *
 * notification: { id, message, type: 'info'|'warning'|'error', timestamp, link?, read }
 * onMarkRead / onDismiss: (notification) => void
 */
export default function NotificationItem({ notification, onMarkRead, onDismiss }) {
  const { message, type, timestamp, link, read } = notification;
  const color = TYPE_COLOR[type] || 'var(--primary-color)';

  return (
    <div className={cx('notif-item', !read && 'unread')}>
      <div
        className="ni-icon"
        style={{
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          color,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        <i className={`ph-fill ${TYPE_ICON[type] || 'ph-info'}`}></i>
      </div>
      <div className="ni-content">
        <div className="ni-header">
          <h4 className="ni-title">{message}</h4>
          <span className="ni-time">{formatDateTime(timestamp)}</span>
        </div>
        {link && (
          <a href={link} className="ni-desc" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            View details &rarr;
          </a>
        )}
      </div>
      <div className="ni-actions">
        <button type="button" className="ni-action-btn btn-done" title="Mark as Read" onClick={() => onMarkRead?.(notification)}>
          <i className="ph ph-check"></i>
        </button>
        <button type="button" className="ni-action-btn btn-del" title="Dismiss" onClick={() => onDismiss?.(notification)}>
          <i className="ph ph-x"></i>
        </button>
      </div>
    </div>
  );
}
