import { useId } from 'react';
import { cx } from '../../utils/helpers';

/**
 * Labelled form field using the original .form-group / .form-label / .form-control classes.
 * Renders <input> by default; pass as="textarea" or as="select" (with <option> children).
 * groupStyle / style style the wrapper and the control respectively.
 */
export default function Input({
  label,
  error,
  as: Control = 'input',
  id,
  className,
  groupStyle,
  children,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="form-group" style={groupStyle}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <Control
        id={inputId}
        className={cx('form-control', error && 'is-invalid', className)}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {children}
      </Control>
      {error && (
        <div className="form-error" style={{ display: 'block' }}>
          {error}
        </div>
      )}
    </div>
  );
}
