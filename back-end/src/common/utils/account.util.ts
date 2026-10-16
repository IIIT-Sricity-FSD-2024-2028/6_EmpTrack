import { BadRequestException } from '@nestjs/common';
import { MockDataService } from '../../data/mock-data.service';

/** Emails are unique across every account, ignoring case (login ignores case too). */
export function emailTaken(dataStore: MockDataService, email: string, exceptEmpId?: string): boolean {
  const wanted = String(email).trim().toLowerCase();
  return dataStore.getEmployees().some((e) => e.emp_id !== exceptEmpId && String(e.email).trim().toLowerCase() === wanted);
}

export function assertEmailAvailable(dataStore: MockDataService, email: string, exceptEmpId?: string) {
  if (emailTaken(dataStore, email, exceptEmpId)) {
    throw new BadRequestException('An account with this email already exists');
  }
}

/**
 * Applies a profile edit ({ name?, email?, phone?, specialization? }) to an account
 * record. `name` is stored as `emp_name` - the field every screen reads.
 */
export function applyAccountUpdate(
  dataStore: MockDataService,
  account: Record<string, any>,
  dto: { name?: string; email?: string; phone?: string; specialization?: string },
) {
  if (dto.email !== undefined && dto.email !== null) assertEmailAvailable(dataStore, dto.email, account.emp_id);
  const updated = { ...account };
  if (dto.name !== undefined && dto.name !== null) updated.emp_name = dto.name;
  if (dto.email !== undefined && dto.email !== null) updated.email = dto.email.trim().toLowerCase();
  if (dto.phone !== undefined && dto.phone !== null) updated.phone = dto.phone;
  if (dto.specialization !== undefined && dto.specialization !== null) updated.specialization = dto.specialization;
  dataStore.saveEmployee(updated);
  Object.assign(account, updated);
  return account;
}
