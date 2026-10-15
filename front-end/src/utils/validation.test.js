import { describe, expect, it } from 'vitest';
import {
  date,
  dateTime,
  email,
  file,
  isDateKey,
  isPhoneNumber,
  list,
  matches,
  notBefore,
  number,
  oneOf,
  personName,
  phone,
  strongPassword,
  text,
  todayKey,
  validateForm,
} from './validation';

const fileOf = (name, size = 10) => new File([new Uint8Array(size)], name);

describe('text', () => {
  const rule = text('Title', { min: 3, max: 10 });
  it('rejects empty and whitespace-only values', () => {
    expect(rule('')).toBe('Title is required.');
    expect(rule('    ')).toBe('Title is required.');
    expect(rule(undefined)).toBe('Title is required.');
  });
  it('checks trimmed length boundaries', () => {
    expect(rule('ab')).toMatch(/at least 3/);
    expect(rule('  abc  ')).toBe('');
    expect(rule('a'.repeat(10))).toBe('');
    expect(rule('a'.repeat(11))).toMatch(/at most 10/);
  });
  it('rejects control characters but allows newlines in multi-line text', () => {
    expect(rule('ab\u0000c')).toMatch(/not allowed/);
    expect(text('Notes', { max: 50, multiline: true })('line 1\nline 2')).toBe('');
    expect(rule('ab\ncd')).toMatch(/not allowed/);
  });
  it('allows an empty optional field', () => {
    expect(text('Notes', { required: false })('')).toBe('');
  });
});

describe('personName', () => {
  const rule = personName('Name');
  it.each(["Anjali Sharma", "Śrīnivās O'Neil-Kumar", 'அருண் குமார்', 'प्रिया', 'J. R. Tolkien', 'Rinku Singh (TL)'])('accepts %s', (name) => {
    expect(rule(name)).toBe('');
  });
  it.each(['J0hn', '<script>', '-Anna', 'A'])('rejects %s', (name) => {
    expect(rule(name)).not.toBe('');
  });
});

describe('email', () => {
  const rule = email();
  it.each(['a@b.co', 'first.last+tag@sub.example.in', '  padded@example.com  '])('accepts %s', (v) => expect(rule(v)).toBe(''));
  it.each(['plain', '@example.com', 'user@', 'user@domain', 'two words@example.com', `${'a'.repeat(250)}@x.com`])('rejects %s', (v) => {
    expect(rule(v)).not.toBe('');
  });
});

describe('phone', () => {
  it.each(['9876543210', '+91 98765 43210', '+91-9876543210', '(080) 2345 6789', '+1 415 555 0100'])('accepts %s', (v) => {
    expect(isPhoneNumber(v)).toBe(true);
  });
  it.each(['12345', '98765abcde', '+91 12345 67890', '+91 98765', '1234567890123456'])('rejects %s', (v) => {
    expect(isPhoneNumber(v)).toBe(false);
  });
  it('is optional only when configured', () => {
    expect(phone('Phone')('')).toBe('Phone is required.');
    expect(phone('Phone', { required: false })('')).toBe('');
  });
});

describe('passwords', () => {
  const rule = strongPassword();
  it('enforces the strength policy and length cap', () => {
    expect(rule('')).toBe('Password is required.');
    expect(rule('password')).toMatch(/at least 8 characters/);
    expect(rule('Password1')).toMatch(/special character/);
    expect(rule('Valid@123')).toBe('');
    expect(rule(`Aa1@${'x'.repeat(61)}`)).toMatch(/at most 64/);
  });
  it('compares the confirmation', () => {
    const confirm = matches('password', 'Passwords do not match.');
    expect(confirm('Valid@123', { password: 'Valid@123' })).toBe('');
    expect(confirm('Valid@124', { password: 'Valid@123' })).toBe('Passwords do not match.');
  });
});

describe('number', () => {
  const rule = number('Hours', { min: 0.5, max: 24, maxDecimals: 1 });
  it.each(['abc', '12abc', '1e5', 'NaN', 'Infinity', '--1'])('rejects malformed %s', (v) => expect(rule(v)).toMatch(/must be a number/));
  it('checks range and decimals', () => {
    expect(rule('0.4')).toMatch(/at least 0.5/);
    expect(rule('0.5')).toBe('');
    expect(rule('24')).toBe('');
    expect(rule('24.1')).toMatch(/at most 24/);
    expect(rule('1.25')).toMatch(/decimal/);
    expect(rule('-1')).toMatch(/at least/);
  });
  it('distinguishes integers', () => {
    expect(number('Days', { integer: true })('2.5')).toMatch(/whole number/);
    expect(number('Days', { integer: true })('2')).toBe('');
  });
});

describe('dates', () => {
  it('rejects impossible dates', () => {
    expect(isDateKey('2024-02-29')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(date('Start')('2026-13-01')).toMatch(/valid date/);
  });
  it('applies past/future restrictions only when asked', () => {
    expect(date('Deadline', { notPast: true })('2000-01-01')).toMatch(/past/);
    expect(date('Deadline', { notPast: true })(todayKey())).toBe('');
    expect(date('Deadline')('2000-01-01')).toBe('');
  });
  it('compares ranges', () => {
    const end = notBefore('start', 'End before start');
    expect(end('2026-05-01', { start: '2026-05-02' })).toBe('End before start');
    expect(end('2026-05-02', { start: '2026-05-02' })).toBe('');
    const strictEnd = notBefore('start', 'After', { strict: true });
    expect(strictEnd('2026-05-02T09:00', { start: '2026-05-02T09:00' })).toBe('After');
  });
  it('validates datetime-local values', () => {
    expect(dateTime('Start')('2026-03-28T09:00')).toBe('');
    expect(dateTime('Start')('yesterday')).toMatch(/valid date and time/);
  });
});

describe('oneOf, file and list', () => {
  it('rejects values outside the options', () => {
    const rule = oneOf('Leave type', ['CASUAL', 'SICK']);
    expect(rule('')).toMatch(/Select/);
    expect(rule('FOREVER')).toMatch(/valid/);
    expect(rule('SICK')).toBe('');
  });
  it('checks file type, size, count and emptiness', () => {
    const rule = file('Attachment', { extensions: ['.png', '.txt'], maxBytes: 100, maxFiles: 2, required: true });
    expect(rule(null)).toBe('Attachment is required.');
    expect(rule(fileOf('run.exe'))).toMatch(/not allowed/);
    expect(rule(fileOf('big.png', 101))).toMatch(/too large/);
    expect(rule(fileOf('empty.txt', 0))).toMatch(/empty/);
    expect(rule([fileOf('a.png'), fileOf('b.png'), fileOf('c.png')])).toMatch(/at most 2/);
    expect(rule(fileOf('SHOT.PNG'))).toBe('');
  });
  it('checks comma-separated lists', () => {
    const rule = list('Features', { maxItems: 2, maxLength: 5 });
    expect(rule('a, b')).toBe('');
    expect(rule('a, b, c')).toMatch(/at most 2/);
    expect(rule('toolong')).toMatch(/at most 5/);
  });
  it('runs a whole schema, first failing rule per field', () => {
    const errors = validateForm({ a: text('A'), b: [text('B'), (v) => (v === 'x' ? 'not x' : '')] }, { a: 'ok', b: 'x' });
    expect(errors).toEqual({ b: 'not x' });
  });
});
