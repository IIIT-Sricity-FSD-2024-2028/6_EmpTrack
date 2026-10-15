import { useId } from 'react';
import { cx } from '../../utils/helpers';
import FieldError, { RequiredMark } from './FieldError';

/**
 * Labelled form field using the original .form-group / .form-label / .form-control classes.
 * Renders <input> by default; pass as="textarea" or as="select" (with <option> children).
 * groupStyle / style style the wrapper and the control respectively.
 * required shows the * marker and sets aria-required (forms use noValidate, so the
 * browser's own popups never replace the field messages); hint is help text below.
 */
export default function Input({
  label,
  error,
  hint,
  required,
  as: Control = 'input',
  id,
  className,
  groupStyle,
  children,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group" style={groupStyle}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <RequiredMark />}
        </label>
      )}
      <Control
        id={inputId}
        className={cx('form-control', error && 'is-invalid', className)}
        aria-invalid={Boolean(error)}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </Control>
      {hint && <span id={hintId} className="form-hint">{hint}</span>}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
