import * as bcrypt from 'bcrypt';

// Same strength rule enforced across every account-creation/password-change form
// (server-side, so it can't be bypassed by calling an API directly).
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): boolean {
  if (!plain || !hash) return false;
  return bcrypt.compareSync(plain, hash);
}
