// Role / permission checks shared by routes and components.
import { PATHS, ROLE_BASE_PATHS, ROLES } from './constants';

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

/**
 * True when `role` is in `allowedRoles`.
 * An empty or missing `allowedRoles` means "any authenticated role".
 */
export function hasRole(role, allowedRoles) {
  if (!role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}

/** Base URL of a role's portal, e.g. "/company-admin". */
export function getRoleBasePath(role) {
  const segment = ROLE_BASE_PATHS[role];
  return segment ? `/${segment}` : PATHS.HOME;
}

/** Where a user lands after login. */
export function getHomePath(role) {
  return isValidRole(role) ? `${getRoleBasePath(role)}/dashboard` : PATHS.LOGIN;
}
