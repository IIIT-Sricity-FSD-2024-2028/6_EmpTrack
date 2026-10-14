// Small form helpers for the Super Admin / HR / Company Admin pages, using the
// original .form-group / .form-label / .form-control markup.
import { useState } from 'react';

/**
 * const form = useFormState({ name: '' });
 * <input {...form.bind('name')} />   form.values.name   form.reset(next)
 */
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });
  return { values, setValues, bind, reset: (next = initial) => setValues(next) };
}

/** <Field label="Email" style={{ gridColumn: '1 / -1' }}><input .../></Field> */
export function Field({ label, htmlFor, style, children }) {
  return (
    <div className="form-group" style={style}>
      <label className="form-label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

/** The original hidden-until-set error line: <div class="form-error"> */
export function FormError({ id, message }) {
  return message ? <div id={id} className="form-error" style={{ display: 'block' }} role="alert">{message}</div> : null;
}

/** Table body rows for loading / error / empty states. */
export function StateRow({ colSpan, kind, icon, children }) {
  if (kind === 'loading') {
    return <tr className="loader-row"><td colSpan={colSpan}><div className="spinner"></div><div>{children}</div></td></tr>;
  }
  if (kind === 'error') {
    return <tr className="error-row"><td colSpan={colSpan}><i className="ph ph-warning-circle"></i> {children}</td></tr>;
  }
  return (
    <tr className="empty-row">
      <td colSpan={colSpan}>
        {icon && <i className={`ph ${icon}`} style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>}
        {children}
      </td>
    </tr>
  );
}
