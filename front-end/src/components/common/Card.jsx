import { cx } from '../../utils/helpers';

/** The original .card surface, with an optional .card-header (title + actions). */
export default function Card({ title, actions, children, className, ...rest }) {
  return (
    <div className={cx('card', className)} {...rest}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="section-title">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
