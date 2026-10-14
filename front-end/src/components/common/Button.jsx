import { cx } from '../../utils/helpers';

/**
 * Button using the original .btn classes (styles/components.css).
 * variant: primary | secondary | outline | danger | purple | orange
 * icon:    Phosphor icon class shown before the label, e.g. icon="ph-plus"
 */
export default function Button({ children, variant = 'primary', icon, type = 'button', className, ...rest }) {
  return (
    <button type={type} className={cx('btn', variant && `btn-${variant}`, className)} {...rest}>
      {icon && <i className={`ph ${icon}`}></i>}
      {children}
    </button>
  );
}
