// Checks that a file's bytes really are the type its extension claims, so an
// executable or HTML page renamed to "photo.png" (or sent with a forged MIME type)
// is rejected. The browser-supplied MIME type and file name are never trusted alone.

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

/** Plain text: no NUL bytes and no other binary control characters in the sample. */
function looksLikeText(buf: Buffer) {
  const sample = buf.subarray(0, 8192);
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20 && byte !== 0x1b)) return false;
  }
  return true;
}

const SIGNATURES: Record<string, (buf: Buffer) => boolean> = {
  '.png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  '.jpg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  '.jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  '.gif': (b) => startsWith(b, ascii('GIF87a')) || startsWith(b, ascii('GIF89a')),
  '.webp': (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8),
  '.pdf': (b) => startsWith(b, ascii('%PDF-')),
  // Legacy Office (OLE compound file) and Office Open XML (a ZIP archive).
  '.doc': (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  '.docx': (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  '.txt': looksLikeText,
  '.log': looksLikeText,
};

export const CANONICAL_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.log': 'text/plain',
};

/** Lower-case extension including the dot ("" if none). */
export function extensionOf(fileName: string): string {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(fileName || '');
  return match ? `.${match[1].toLowerCase()}` : '';
}

/** True when the content matches the extension; unknown extensions never match. */
export function contentMatchesExtension(buf: Buffer, extension: string): boolean {
  const check = SIGNATURES[extension];
  return Boolean(check && buf.length > 0 && check(buf));
}
