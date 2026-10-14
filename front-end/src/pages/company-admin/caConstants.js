// Shared bits for the Company Admin pages.
import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Base URL of the portal ("/company-admin"), for in-page links. */
export const CA_BASE = getRoleBasePath(ROLES.COMPANY_ADMIN);

export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

/** Department choices offered when adding / editing employees (as in the original form). */
export const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
