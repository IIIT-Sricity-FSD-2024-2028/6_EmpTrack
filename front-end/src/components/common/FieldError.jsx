/**
 * The message under an invalid field. The icon and text carry the meaning, so it
 * doesn't rely on the red colour alone; the id is what the field's
 * aria-describedby points at (see useFormValidation's errorId).
 */
export default function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <div id={id} className="form-error field-error" role="alert">
      <i className="ph ph-warning-circle" aria-hidden="true"></i>
      <span>{message}</span>
    </div>
  );
}

/** Asterisk after a required field's label; screen readers get aria-required instead. */
export function RequiredMark() {
  return <span className="required-indicator" aria-hidden="true">*</span>;
}
