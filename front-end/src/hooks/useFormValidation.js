import { useCallback, useRef, useState } from 'react';
import { validateField, validateForm } from '../utils/validation';

/**
 * Field-level validation for a form whose values live in the caller's state.
 *
 *   const v = useFormValidation(schema, values, { idPrefix: 'leave' });
 *   <Input {...v.field('reason')} ... />            // Input component (gets `error`)
 *   <input {...v.input('reason')} ... /> <FieldError {...v.errorProps('reason')} />
 *   onSubmit: if (!v.validateAll()) return;          // shows all errors, focuses the first
 *   catch (err) { if (!v.setServerErrors(err)) showGeneralError(err.message); }
 *
 * A field's error appears once it has been left (blur) or a submit was attempted,
 * then updates as the user types, so nobody sees errors before they've had a chance
 * to enter anything. Errors from the backend (ApiError.fieldErrors) are shown on
 * their field until that field's value changes.
 */
export default function useFormValidation(schema, values, { idPrefix = 'field', serverFieldMap = {} } = {}) {
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrorState] = useState({});
  const ids = useRef({});

  const idFor = (name) => ids.current[name] || `${idPrefix}-${name}`;

  const errorOf = (name) => {
    if (!schema[name] && !serverErrors[name]) return '';
    const server = serverErrors[name];
    if (server && server.value === values?.[name]) return server.message;
    if (!submitted && !touched[name]) return '';
    return validateField(schema[name], values?.[name], values);
  };

  const errors = Object.fromEntries(
    [...new Set([...Object.keys(schema), ...Object.keys(serverErrors)])]
      .map((name) => [name, errorOf(name)])
      .filter(([, message]) => message),
  );

  const touch = useCallback((name) => setTouched((t) => (t[name] ? t : { ...t, [name]: true })), []);

  /** Props for a raw <input>/<select>/<textarea> (no `error` prop on the DOM node). */
  const input = (name, id) => {
    const inputId = id || `${idPrefix}-${name}`;
    ids.current[name] = inputId;
    const error = errors[name];
    return {
      id: inputId,
      name,
      onBlur: () => touch(name),
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? `${inputId}-error` : undefined,
    };
  };

  /** Props for the Input component (it renders the message itself). */
  const field = (name, id) => {
    const { 'aria-describedby': _ignored, ...props } = input(name, id);
    return { ...props, error: errors[name] };
  };

  /** Props for <FieldError> under a raw input. */
  const errorProps = (name) => ({ id: `${idFor(name)}-error`, message: errors[name] });

  /** Validates everything; returns true when valid, otherwise focuses the first invalid field. */
  const validateAll = () => {
    setSubmitted(true);
    setServerErrorState({});
    const found = validateForm(schema, values);
    const first = Object.keys(schema).find((name) => found[name]);
    if (first) {
      const el = typeof document !== 'undefined' ? document.getElementById(idFor(first)) : null;
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      }
      return false;
    }
    return true;
  };

  /**
   * Validates only some fields - for panels where each button submits different
   * fields (e.g. "Reassign" needs the reason, "Comment" the comment).
   */
  const validateFields = (names) => {
    setTouched((t) => ({ ...t, ...Object.fromEntries(names.map((n) => [n, true])) }));
    setServerErrorState({});
    const first = names.find((name) => validateField(schema[name], values?.[name], values));
    if (first) {
      const el = typeof document !== 'undefined' ? document.getElementById(idFor(first)) : null;
      el?.focus({ preventScroll: true });
      el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  };

  /** Forgets that these fields were touched (e.g. after a comment was posted). */
  const untouch = (names) => setTouched((t) => Object.fromEntries(Object.entries(t).filter(([n]) => !names.includes(n))));

  /**
   * Shows backend validation errors on their fields. Returns true if at least one
   * message was attached to a field (so the caller doesn't also need a banner).
   */
  const setServerErrors = (err) => {
    const fieldErrors = err?.fieldErrors || {};
    const next = {};
    for (const [serverName, messages] of Object.entries(fieldErrors)) {
      const name = serverFieldMap[serverName] || serverName;
      if (!(name in schema)) continue;
      next[name] = { message: [].concat(messages)[0], value: values?.[name] };
    }
    setServerErrorState(next);
    const first = Object.keys(schema).find((name) => next[name]);
    if (first && typeof document !== 'undefined') document.getElementById(idFor(first))?.focus();
    return Boolean(first);
  };

  /** Clears all shown errors (after a successful submit or a form reset). */
  const reset = () => {
    setTouched({});
    setSubmitted(false);
    setServerErrorState({});
  };

  return { errors, field, input, errorProps, validateAll, validateFields, untouch, setServerErrors, reset, touch, isValid: !Object.keys(validateForm(schema, values)).length };
}
