import { isDateKey, isDateTime, isPhoneNumber, isTimeZone, PERSON_NAME_REGEX } from './validators';
import { contentMatchesExtension, extensionOf } from '../utils/file-signature.util';

describe('shared field rules', () => {
  it.each(['9876543210', '+91 98765 43210', '+91-9876543210', '(080) 2345 6789', '+1 415 555 0100', '0987654321'])(
    'accepts phone %s',
    (phone) => expect(isPhoneNumber(phone)).toBe(true),
  );

  it.each(['', '12345', '98765abcde', '+91 12345 67890', '+91 98765', '1234567890123456', '++919876543210'])(
    'rejects phone %s',
    (phone) => expect(isPhoneNumber(phone)).toBe(false),
  );

  it.each(["Anjali Sharma", "Śrīnivās O'Neil-Kumar", 'அருண் குமார்', 'प्रिया', 'J. R. Tolkien', 'Rinku Singh (TL)'])(
    'accepts name %s',
    (name) => expect(PERSON_NAME_REGEX.test(name)).toBe(true),
  );

  it.each(['J0hn', '<script>', '-Anna', 'Bob; DROP', '  '])('rejects name %s', (name) => expect(PERSON_NAME_REGEX.test(name)).toBe(false));

  it('validates calendar dates and date-times', () => {
    expect(isDateKey('2024-02-29')).toBe(true);
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('31/12/2026')).toBe(false);
    expect(isDateTime('2026-03-28T09:00')).toBe(true);
    expect(isDateTime('2026-03-28T09:00:00.000Z')).toBe(true);
    expect(isDateTime('2026-03-28 09:00')).toBe(false);
    expect(isDateTime('2026-02-30T09:00')).toBe(false);
  });

  it('validates IANA time zones', () => {
    expect(isTimeZone('Asia/Kolkata')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
  });
});

describe('file signatures', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

  it('reads extensions case-insensitively', () => {
    expect(extensionOf('Photo.PNG')).toBe('.png');
    expect(extensionOf('archive.tar.gz')).toBe('.gz');
    expect(extensionOf('noext')).toBe('');
  });

  it('matches real content and rejects renamed files', () => {
    expect(contentMatchesExtension(png, '.png')).toBe(true);
    expect(contentMatchesExtension(png, '.jpg')).toBe(false);
    expect(contentMatchesExtension(Buffer.from('MZ\u0090\u0000'), '.png')).toBe(false);
    expect(contentMatchesExtension(Buffer.from('%PDF-1.7'), '.pdf')).toBe(true);
    expect(contentMatchesExtension(Buffer.from('plain log line\n'), '.log')).toBe(true);
    expect(contentMatchesExtension(Buffer.from([0x41, 0x00, 0x42]), '.txt')).toBe(false);
    expect(contentMatchesExtension(png, '.exe')).toBe(false);
    expect(contentMatchesExtension(Buffer.alloc(0), '.txt')).toBe(false);
  });
});
