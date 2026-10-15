// Shared bits for the Company Admin pages.
import { ROLES } from '../../utils/constants';
import { getRoleBasePath } from '../../utils/permissions';

/** Base URL of the portal ("/company-admin"), for in-page links. */
export const CA_BASE = getRoleBasePath(ROLES.COMPANY_ADMIN);

// Field rules (password strength, email, phone) live in utils/validation.js.

/** Department choices offered when adding / editing employees (as in the original form). */
export const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
