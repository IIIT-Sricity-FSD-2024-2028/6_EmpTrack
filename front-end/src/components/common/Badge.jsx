import { cx } from '../../utils/helpers';

/**
 * Status pill using the original .badge classes.
 * variant: any .badge-* suffix from styles/components.css, e.g.
 * success | warning | danger | info | completed | in-progress | not-started |
 * high | medium | low | open | present | absent | escalated | vacation ...
 */
export default function Badge({ children, variant, className, style }) {
  return (
    <span className={cx('badge', variant && `badge-${variant}`, className)} style={style}>
      {children}
    </span>
  );
}
