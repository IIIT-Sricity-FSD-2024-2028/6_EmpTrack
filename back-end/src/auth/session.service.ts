import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { WorkflowPersistenceService } from '../data/workflow-persistence.service';

// Server-side login sessions. POST /auth/login issues an opaque random bearer token;
// AuthGuard resolves it back to the employee on every request. Only a SHA-256 token
// digest is stored in SQLite so requests can be handled by any instance using that DB.
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000; // matches the frontend's config.sessionDuration

@Injectable()
export class SessionService {
  private readonly ttlMs = Number(process.env.SESSION_TTL_MS) > 0 ? Number(process.env.SESSION_TTL_MS) : DEFAULT_TTL_MS;

  constructor(private readonly persistence: WorkflowPersistenceService) {}

  create(empId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.ttlMs;
    this.persistence.createSession(token, empId, expiresAt);
    return { token, expiresAt };
  }

  // Returns the employee id the token belongs to, or null if unknown/expired.
  resolve(token: string): string | null {
    return this.persistence.resolveSession(token);
  }

  revoke(token: string) {
    this.persistence.revokeSession(token);
  }

  // Ends every session for an account - used when it is deleted, deactivated, or its
  // password changes, so an old token can't outlive the access it was issued for.
  revokeAllFor(empId: string) {
    this.persistence.revokeUserSessions(empId);
  }
}
