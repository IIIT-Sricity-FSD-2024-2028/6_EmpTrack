import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '../utils/password.util';

// Shared field rules for every DTO, so the same kind of field (a name, an email, a
// date...) is validated the same way on every endpoint. Messages use a readable
// label and never echo the submitted value back.

export const LIMITS = {
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  PASSWORD_MAX: 64,
  ID_MAX: 64,
  TITLE_MAX: 150,
  SHORT_TEXT_MAX: 100,
  ADDRESS_MAX: 300,
  REASON_MAX: 500,
  COMMENT_MAX: 1000,
  DESCRIPTION_MAX: 2000,
} as const;

export const PASSWORD_MESSAGE =
  'Password must be 8+ characters with uppercase, lowercase, a number, and a special character (@$!%*?&).';

// Letters from any script (Devanagari, Tamil, Latin with accents...), combining marks,
// spaces, and the punctuation real names use: apostrophes, hyphens, dots. Parentheses
// are accepted because existing accounts carry role tags such as "Rinku Singh (TL)".
export const PERSON_NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’()-]*$/u;
// C0 control characters and DEL. Multi-line fields still allow tab/newline/CR.
const SINGLE_LINE_CONTROL = /[\u0000-\u001F\u007F]/;
const MULTI_LINE_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const ID_REGEX = /^[A-Za-z0-9_-]+$/;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// datetime-local ("2026-03-28T09:00") or a full ISO-8601 timestamp.
const DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isDateKey(value: unknown): boolean {
  if (typeof value !== 'string' || !DATE_KEY_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isDateTime(value: unknown): boolean {
  if (typeof value !== 'string' || !DATE_TIME_REGEX.test(value)) return false;
  return isDateKey(value.slice(0, 10)) && !Number.isNaN(Date.parse(value));
}

/**
 * Phone numbers: digits with optional leading "+", spaces, hyphens and parentheses;
 * 7-15 digits in total (the E.164 maximum). An Indian number written with its
 * country code (+91) must be a 10-digit mobile number starting with 6-9. Numbers
 * without a country code are accepted in any national format.
 */
export function isPhoneNumber(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\+?[0-9\s()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return false;
  if (value.trim().startsWith('+91')) return /^91[6-9]\d{9}$/.test(digits);
  return true;
}

export function isTimeZone(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function custom(name: string, test: (value: unknown, args: ValidationArguments) => boolean, message: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({ name, target: object.constructor, propertyName, options: { message, ...options }, validator: { validate: test } });
}

/**
 * How a field may be absent:
 *  - false (default): required.
 *  - true: optional - the client may leave it out, send null, or send "" (forms send
 *    "" for an untouched optional input).
 *  - 'partial': for PATCH bodies - the field may be left out, but a value that is
 *    sent is validated in full, so a mandatory field can't be blanked with "".
 */
export type Presence = boolean | 'partial';

function presence(optional: Presence | undefined) {
  if (optional === 'partial') return [ValidateIf((_: unknown, value: unknown) => value !== undefined && value !== null)];
  if (optional) return [ValidateIf((_: unknown, value: unknown) => value !== undefined && value !== null && value !== '')];
  return [];
}

export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

type TextOptions = { min?: number; max?: number; multiline?: boolean; optional?: Presence };

/** A free-text field: trimmed, not blank, length-limited, no control characters. */
export function TextField(label: string, { min = 1, max = LIMITS.SHORT_TEXT_MAX, multiline = false, optional = false }: TextOptions = {}) {
  return applyDecorators(
    ...presence(optional),
    Trim(),
    IsString({ message: `${label} must be text.` }),
    MinLength(1, { message: `${label} is required.` }),
    ...(min > 1 ? [MinLength(min, { message: `${label} must be at least ${min} characters.` })] : []),
    MaxLength(max, { message: `${label} must be at most ${max} characters.` }),
    custom(
      'noControlCharacters',
      (v) => typeof v !== 'string' || !(multiline ? MULTI_LINE_CONTROL : SINGLE_LINE_CONTROL).test(v),
      `${label} contains characters that are not allowed.`,
    ),
  );
}

export function PersonNameField(label = 'Name', { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    TextField(label, { min: 2, max: LIMITS.NAME_MAX, optional }),
    Matches(PERSON_NAME_REGEX, { message: `${label} may contain only letters, spaces, apostrophes, hyphens and dots.` }),
  );
}

export function EmailField(label = 'Email', { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    Trim(),
    IsString({ message: `${label} must be text.` }),
    MaxLength(LIMITS.EMAIL_MAX, { message: `${label} must be at most ${LIMITS.EMAIL_MAX} characters.` }),
    IsEmail({}, { message: `${label} must be a valid email address.` }),
  );
}

export function PhoneField(label = 'Phone number', { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    Trim(),
    IsString({ message: `${label} must be text.` }),
    custom('isPhoneNumber', isPhoneNumber, `${label} must be a valid phone number (7-15 digits; +91 numbers need 10 digits starting with 6-9).`),
  );
}

/** A new password: the platform's strength rule, plus a length cap (bcrypt reads 72 bytes). */
export function StrongPasswordField(label = 'Password') {
  return applyDecorators(
    IsString({ message: `${label} is required.` }),
    MaxLength(LIMITS.PASSWORD_MAX, { message: `${label} must be at most ${LIMITS.PASSWORD_MAX} characters.` }),
    Matches(STRONG_PASSWORD_REGEX, { message: PASSWORD_MESSAGE }),
  );
}

/** An existing password being checked (login, current password): never strength-tested. */
export function PasswordInputField(label = 'Password', { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    IsString({ message: `${label} is required.` }),
    MinLength(1, { message: `${label} is required.` }),
    MaxLength(128, { message: `${label} is too long.` }),
  );
}

export function IdField(label: string, { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    Trim(),
    IsString({ message: `${label} is required.` }),
    MinLength(1, { message: `${label} is required.` }),
    MaxLength(LIMITS.ID_MAX, { message: `${label} is not a valid identifier.` }),
    Matches(ID_REGEX, { message: `${label} is not a valid identifier.` }),
  );
}

export function DateField(label: string, { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    IsString({ message: `${label} must be a date.` }),
    custom('isDateKey', isDateKey, `${label} must be a valid date (YYYY-MM-DD).`),
  );
}

export function DateTimeField(label: string, { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    IsString({ message: `${label} must be a date and time.` }),
    custom('isDateTime', isDateTime, `${label} must be a valid date and time.`),
  );
}

export function TimeField(label: string, { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(
    ...presence(optional),
    IsString({ message: `${label} must be a time.` }),
    Matches(TIME_REGEX, { message: `${label} must be a valid time (HH:mm).` }),
  );
}

type EnumOptions = { optional?: Presence; caseInsensitive?: boolean };

/** One of a fixed set of values. caseInsensitive keeps "Medium" / "MEDIUM" both valid. */
export function EnumField(label: string, values: readonly string[], { optional = false, caseInsensitive = false }: EnumOptions = {}) {
  const allowed = caseInsensitive ? values.map((v) => v.toUpperCase()) : values;
  return applyDecorators(
    ...presence(optional),
    IsString({ message: `${label} is required.` }),
    custom(
      'isAllowedValue',
      (v) => typeof v === 'string' && allowed.includes(caseInsensitive ? v.toUpperCase() : v),
      `${label} must be one of: ${values.join(', ')}.`,
    ),
  );
}

type NumberOptions = { min?: number; max?: number; integer?: boolean; optional?: Presence; maxDecimals?: number };

/** A finite JSON number in [min, max]. Strings, NaN and Infinity are rejected. */
export function NumberField(label: string, { min, max, integer = false, optional = false, maxDecimals }: NumberOptions = {}) {
  return applyDecorators(
    ...presence(optional),
    integer
      ? IsInt({ message: `${label} must be a whole number.` })
      : IsNumber({ allowNaN: false, allowInfinity: false, ...(maxDecimals !== undefined ? { maxDecimalPlaces: maxDecimals } : {}) }, {
          message: maxDecimals !== undefined ? `${label} must be a number with at most ${maxDecimals} decimal places.` : `${label} must be a number.`,
        }),
    ...(min !== undefined ? [Min(min, { message: `${label} must be at least ${min}.` })] : []),
    ...(max !== undefined ? [Max(max, { message: `${label} must be at most ${max}.` })] : []),
  );
}

/**
 * Like NumberField, but also accepts a numeric string - number inputs and query
 * parameters arrive as strings. "12abc", "1e5", "NaN" and "Infinity" are rejected.
 */
export function NumericField(label: string, { min, max, integer = false, optional = false }: NumberOptions = {}) {
  const pattern = integer ? /^\s*-?\d+\s*$/ : /^\s*-?\d+(\.\d+)?\s*$/;
  const kind = integer ? 'a whole number' : 'a number';
  return applyDecorators(
    ...presence(optional),
    custom(
      'isNumeric',
      (v) => {
        const n = typeof v === 'number' ? v : typeof v === 'string' && pattern.test(v) ? Number(v) : NaN;
        return Number.isFinite(n) && (!integer || Number.isInteger(n)) && (min === undefined || n >= min) && (max === undefined || n <= max);
      },
      `${label} must be ${kind}${min !== undefined && max !== undefined ? ` between ${min} and ${max}` : min !== undefined ? ` of at least ${min}` : ''}.`,
    ),
  );
}

/**
 * Cross-field rule: this date / date-time must not be earlier than `otherProperty`
 * (or strictly later, with `strict`). Skipped while either value is missing or
 * malformed - the fields' own rules report that.
 */
export function NotBeforeField(otherProperty: string, message: string, { strict = false } = {}) {
  return custom(
    'notBefore',
    (v, args) => {
      const other = (args.object as Record<string, unknown>)[otherProperty];
      if (typeof v !== 'string' || typeof other !== 'string' || !v || !other) return true;
      const a = Date.parse(v.length === 10 ? `${v}T00:00:00Z` : v);
      const b = Date.parse(other.length === 10 ? `${other}T00:00:00Z` : other);
      if (Number.isNaN(a) || Number.isNaN(b)) return true;
      return strict ? a > b : a >= b;
    },
    message,
  );
}

export function BooleanField(label: string, { optional = false }: { optional?: Presence } = {}) {
  return applyDecorators(...(optional ? [IsOptional()] : []), IsBoolean({ message: `${label} must be true or false.` }));
}

/** An array of short text items (plan features, file names...). */
export function TextListField(label: string, { maxItems = 50, maxLength = LIMITS.SHORT_TEXT_MAX as number, optional = false as Presence } = {}) {
  return applyDecorators(
    ...(optional ? [IsOptional()] : []),
    IsArray({ message: `${label} must be a list.` }),
    ArrayMaxSize(maxItems, { message: `${label} can have at most ${maxItems} items.` }),
    Transform(({ value }) => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)) : value)),
    IsString({ each: true, message: `Each ${label.toLowerCase()} item must be text.` }),
    MinLength(1, { each: true, message: `${label} items cannot be blank.` }),
    MaxLength(maxLength, { each: true, message: `Each ${label.toLowerCase()} item must be at most ${maxLength} characters.` }),
    custom(
      'noControlCharactersEach',
      (v) => !Array.isArray(v) || v.every((item) => typeof item !== 'string' || !SINGLE_LINE_CONTROL.test(item)),
      `${label} contains characters that are not allowed.`,
    ),
  );
}

/** Nested object validated by its own DTO class. */
export const Nested = (cls: () => new () => object) => Type(cls);

// ---- ValidationPipe ------------------------------------------------------

function collect(errors: ValidationError[], parent = '', out: Record<string, string[]> = {}) {
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) out[path] = Object.values(error.constraints);
    if (error.children?.length) collect(error.children, path, out);
  }
  return out;
}

/**
 * The app-wide ValidationPipe (main.ts and the e2e tests use the same instance):
 *  - whitelist strips fields a DTO doesn't declare, so a request can't mass-assign
 *    role, companyId, password hashes...;
 *  - a 400 response carries `message` (all messages, as before) and `errors`
 *    ({ field: [messages] }) so the frontend can show each message on its field.
 */
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    stopAtFirstError: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => {
      const fields = collect(errors);
      return new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: Object.values(fields).flat(),
        errors: fields,
      });
    },
  });
}
