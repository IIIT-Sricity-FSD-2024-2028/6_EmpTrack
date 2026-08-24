// Resolves which Platform Admin's data a request is allowed to see.
// PLATFORM_ADMIN callers are always scoped to their own actor id (headers are the only
// trusted identity source - client-supplied query params are ignored for this role).
export function resolvePlatformAdminScope(role: string, actorId: string, queryPlatformAdminId?: string): string | null {
  if (role === 'PLATFORM_ADMIN') return actorId;
  return queryPlatformAdminId || null;
}
