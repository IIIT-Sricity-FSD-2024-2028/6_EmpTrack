import { cx } from '../../utils/helpers';

/** Placeholder for empty lists or not-found routes. icon: Phosphor class, e.g. 'ph-bell'. */
export default function EmptyState({ icon = 'ph-tray', title, description, action, className }) {
  return (
    <div className={cx('empty-state', className)}>
      <i className={`ph ${icon} empty-state-icon`}></i>
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
