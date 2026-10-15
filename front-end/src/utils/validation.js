// Field rules shared by every form. They mirror the backend DTO rules
// (back-end/src/common/validation/validators.ts), so a value the form accepts is
// one the API accepts; the backend still re-checks everything.
//
// A rule is (value, values) => message ('' when valid). A schema maps field names
// to a rule or an array of rules (the first failing rule's message is shown):
//   const schema = { email: email('Email'), end: [date('End date'), notBefore('start', 'End date must be on or after the start date.')] };

export const LIMITS = Object.freeze({
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  PASSWORD_MAX: 64,
  TITLE_MAX: 150,
  SHORT_TEXT_MAX: 100,
  ADDRESS_MAX: 300,
  REASON_MAX: 500,
  COMMENT_MAX: 1000,
  DESCRIPTION_MAX: 2000,
});

export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
export const PASSWORD_HINT = 'At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&).';
const PASSWORD_MESSAGE = `Password must be ${PASSWORD_HINT.charAt(0).toLowerCase()}${PASSWORD_HINT.slice(1)}`;

// Letters of any script, combining marks, spaces and . ' ’ ( ) - (same as the backend).
export const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’()-]*$/u;
// Deliberately simple: one @, something on both sides, a dot in the domain, no spaces.
// The backend's validator is stricter; this only catches obvious mistakes early.
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SINGLE_LINE_CONTROL = /[\u0000-\u001F\u007F]/;
const MULTI_LINE_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const str = (value) => (value === undefined || value === null ? '' : String(value));
export const isBlank = (value) => str(value).trim() === '';

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isDateKey(value) {
  if (!DATE_KEY.test(str(value))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Same phone rule as the backend: 7-15 digits; +91 numbers are 10-digit mobiles (6-9...). */
export function isPhoneNumber(value) {
  const text = str(value).trim();
  if (!/^\+?[0-9\s()-]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  if (text.startsWith('+91')) return /^91[6-9]\d{9}$/.test(digits);
  return true;
}

/** Today's local date as YYYY-MM-DD (date inputs work in local time). */
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- rule builders ---------------------------------------------------------

/** Text: trimmed length between min and max, no control characters. */
export function text(label, { min = 1, max = LIMITS.SHORT_TEXT_MAX, required = true, multiline = false } = {}) {
  return (value) => {
    const v = str(value).trim();
    if (!v) return required ? `${label} is required.` : '';
    if (v.length < min) return `${label} must be at least ${min} characters.`;
    if (v.length > max) return `${label} must be at most ${max} characters.`;
    if ((multiline ? MULTI_LINE_CONTROL : SINGLE_LINE_CONTROL).test(v)) return `${label} contains characters that are not allowed.`;
    return '';
  };
}

export function personName(label = 'Name', { required = true } = {}) {
  const base = text(label, { min: 2, max: LIMITS.NAME_MAX, required });
  return (value) => base(value) || (isBlank(value) || PERSON_NAME.test(str(value).trim()) ? '' : `${label} may contain only letters, spaces, apostrophes, hyphens and dots.`);
}

export function email(label = 'Email', { required = true } = {}) {
  return (value) => {
    const v = str(value).trim();
    if (!v) return required ? `${label} is required.` : '';
    if (v.length > LIMITS.EMAIL_MAX) return `${label} must be at most ${LIMITS.EMAIL_MAX} characters.`;
    return EMAIL.test(v) ? '' : `${label} must be a valid email address (for example name@company.com).`;
  };
}

export function phone(label = 'Phone number', { required = true } = {}) {
  return (value) => {
    if (isBlank(value)) return required ? `${label} is required.` : '';
    return isPhoneNumber(value) ? '' : `${label} must be a valid phone number (7-15 digits; +91 numbers need 10 digits starting with 6-9).`;
  };
}

/** A new password (strength rule). Not trimmed - spaces are part of a password. */
export function strongPassword(label = 'Password') {
  return (value) => {
    const v = str(value);
    if (!v) return `${label} is required.`;
    if (v.length > LIMITS.PASSWORD_MAX) return `${label} must be at most ${LIMITS.PASSWORD_MAX} characters.`;
    return STRONG_PASSWORD.test(v) ? '' : PASSWORD_MESSAGE;
  };
}

/** An existing password being entered (login, current password): presence only. */
export function passwordInput(label = 'Password') {
  return (value) => (str(value) ? '' : `${label} is required.`);
}

/** Cross-field: must equal another field (password confirmation). */
export function matches(otherField, message) {
  return (value, values) => (str(value) && str(value) !== str(values?.[otherField]) ? message : '');
}

/** Cross-field: must differ from another field (new vs current password). */
export function differsFrom(otherField, message) {
  return (value, values) => (str(value) && str(value) === str(values?.[otherField]) ? message : '');
}

/** One of the allowed values (a select / radio group). */
export function oneOf(label, values, { required = true, message } = {}) {
  const allowed = values.map(String);
  return (value) => {
    if (isBlank(value)) return required ? message || `Select ${label.toLowerCase()}.` : '';
    return allowed.includes(String(value)) ? '' : `Select a valid ${label.toLowerCase()}.`;
  };
}

/** A number typed into an input: rejects "", "12abc", "1e5", NaN, Infinity. */
export function number(label, { min, max, integer = false, maxDecimals, required = true } = {}) {
  return (value) => {
    const v = str(value).trim();
    if (!v) return required ? `${label} is required.` : '';
    if (!(integer ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/).test(v)) return integer ? `${label} must be a whole number.` : `${label} must be a number.`;
    const n = Number(v);
    if (!Number.isFinite(n)) return `${label} must be a number.`;
    if (maxDecimals !== undefined && (v.split('.')[1] || '').length > maxDecimals) return `${label} can have at most ${maxDecimals} decimal places.`;
    if (min !== undefined && n < min) return `${label} must be at least ${min}.`;
    if (max !== undefined && n > max) return `${label} must be at most ${max}.`;
    return '';
  };
}

/** A date input (YYYY-MM-DD). notPast / notFuture compare with today's local date. */
export function date(label, { required = true, notPast = false, notFuture = false } = {}) {
  return (value) => {
    if (isBlank(value)) return required ? `${label} is required.` : '';
    if (!isDateKey(value)) return `${label} must be a valid date.`;
    if (notPast && value < todayKey()) return `${label} cannot be in the past.`;
    if (notFuture && value > todayKey()) return `${label} cannot be in the future.`;
    return '';
  };
}

/** A datetime-local input. */
export function dateTime(label, { required = true } = {}) {
  return (value) => {
    if (isBlank(value)) return required ? `${label} is required.` : '';
    return DATE_TIME.test(str(value)) && isDateKey(str(value).slice(0, 10)) && !Number.isNaN(Date.parse(value)) ? '' : `${label} must be a valid date and time.`;
  };
}

export function time(label, { required = true } = {}) {
  return (value) => {
    if (isBlank(value)) return required ? `${label} is required.` : '';
    return TIME.test(str(value)) ? '' : `${label} must be a valid time.`;
  };
}

/** Cross-field: this date / date-time is not before (or, strict, after) another field. */
export function notBefore(otherField, message, { strict = false } = {}) {
  return (value, values) => {
    const other = values?.[otherField];
    if (isBlank(value) || isBlank(other)) return '';
    const a = Date.parse(str(value).length === 10 ? `${value}T00:00:00` : value);
    const b = Date.parse(str(other).length === 10 ? `${other}T00:00:00` : other);
    if (Number.isNaN(a) || Number.isNaN(b)) return '';
    return (strict ? a > b : a >= b) ? '' : message;
  };
}

/**
 * A File (or FileList / array of files). extensions like ['.png', '.txt'];
 * maxBytes per file. The server re-checks type (by content) and size.
 */
export function file(label, { extensions, maxBytes, required = false, maxFiles } = {}) {
  return (value) => {
    const files = !value ? [] : value instanceof File ? [value] : Array.from(value);
    if (!files.length) return required ? `${label} is required.` : '';
    if (maxFiles && files.length > maxFiles) return `You can attach at most ${maxFiles} files.`;
    for (const f of files) {
      const ext = (/\.[^.]+$/.exec(f.name || '')?.[0] || '').toLowerCase();
      if (extensions && !extensions.includes(ext)) return `${f.name}: file type not allowed. Allowed: ${extensions.join(', ')}.`;
      if (maxBytes && f.size > maxBytes) return `${f.name} is too large (max ${formatBytes(maxBytes)}).`;
      if (f.size === 0) return `${f.name} is empty.`;
    }
    return '';
  };
}

/** Comma-separated list (plan features): each item non-blank and length-limited. */
export function list(label, { maxItems = 30, maxLength = LIMITS.SHORT_TEXT_MAX, required = false } = {}) {
  return (value) => {
    const items = str(value).split(',').map((s) => s.trim()).filter(Boolean);
    if (!items.length) return required ? `${label} is required.` : '';
    if (items.length > maxItems) return `${label} can have at most ${maxItems} items.`;
    const tooLong = items.find((i) => i.length > maxLength);
    return tooLong ? `Each ${label.toLowerCase()} item must be at most ${maxLength} characters.` : '';
  };
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`;
}

// ---- running a schema ------------------------------------------------------

export function validateField(rules, value, values) {
  for (const rule of [].concat(rules || [])) {
    const message = rule(value, values);
    if (message) return message;
  }
  return '';
}

/** { field: message } for every invalid field (valid fields are left out). */
export function validateForm(schema, values) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const message = validateField(rules, values?.[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Trims every string value - for building the request body after validation. */
export function trimValues(values) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
}
