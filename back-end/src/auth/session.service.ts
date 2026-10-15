import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

// Server-side login sessions. POST /auth/login issues an opaque random bearer token;
// AuthGuard resolves it back to the employee on every request. Kept in memory, same
// as the rest of this app's data (MockDataService) - a restart logs everyone out.
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000; // matches the frontend's config.sessionDuration

type Session = { empId: string; expiresAt: number };

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, Session>();
  private readonly ttlMs = Number(process.env.SESSION_TTL_MS) > 0 ? Number(process.env.SESSION_TTL_MS) : DEFAULT_TTL_MS;

  create(empId: string) {
    this.purgeExpired();
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.ttlMs;
    this.sessions.set(token, { empId, expiresAt });
    return { token, expiresAt };
  }

  // Returns the employee id the token belongs to, or null if unknown/expired.
  resolve(token: string): string | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session.empId;
  }

  revoke(token: string) {
    this.sessions.delete(token);
  }

  // Ends every session for an account - used when it is deleted, deactivated, or its
  // password changes, so an old token can't outlive the access it was issued for.
  revokeAllFor(empId: string) {
    for (const [token, session] of this.sessions) {
      if (session.empId === empId) this.sessions.delete(token);
    }
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [token, session] of this.sessions) {
      if (session.expiresAt < now) this.sessions.delete(token);
    }
  }
}
