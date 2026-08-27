interface UploadCategoryRules {
  label: string;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
}

// Whitelisted upload categories. The category comes from the route (:category) and is
// used to pick a destination sub-directory and a set of allowed file types - it is
// never used to build a filesystem path directly, so it can't be abused for traversal.
// Add new areas of the app here rather than opening the endpoint up to arbitrary values.
export const UPLOAD_CATEGORIES: Record<string, UploadCategoryRules> = {
  'profile-image': {
    label: 'Employee profile image',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSizeBytes: 2 * 1024 * 1024,
  },
  'employee-document': {
    label: 'Employee document',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  'company-document': {
    label: 'Company document',
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  'support-attachment': {
    label: 'Support ticket attachment',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.docx'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  'technical-attachment': {
    label: 'Technical issue attachment',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.log'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  'recruitment-document': {
    label: 'Recruitment / resume document',
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
};

export type UploadCategory = string;

export const isUploadCategory = (value: string): value is UploadCategory =>
  Object.prototype.hasOwnProperty.call(UPLOAD_CATEGORIES, value);

// Absolute ceiling applied by Multer itself (before any per-category check runs) so a
// request can't balloon memory usage regardless of category. Individual categories may
// only be equal to or stricter than this.
export const GLOBAL_MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

// Filenames are never derived from the client-supplied original name. Stored names are
// always <uuid><safe-extension>, so this only has to validate that shape when reading a
// file back - it deliberately does not need to allow arbitrary characters.
export const SAFE_STORED_FILENAME = /^[a-f0-9-]{36}\.[a-z0-9]{1,10}$/;

// Never allowed, regardless of category - executables and script-like files that could
// enable server-side code execution if the upload directory were ever misconfigured as
// servable/executable.
export const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.ps1', '.php', '.jsp', '.asp', '.aspx'];
