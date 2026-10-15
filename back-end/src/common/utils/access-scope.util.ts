import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../../data/mock-data.service';

// Record-level access rules for the company-side modules (attendance, leave, tasks,
// work logs, issues, notifications, escalations). The caller is always the
// server-verified actor from AuthGuard (the x-actor-id header), never an id taken from
// the request body or URL.
//
// Who may see / act on employee X's records:
//   - X themselves
//   - HR and Company Admin of X's company
//   - X's own Team Lead (X.manager_id)
//   - Super Admin (platform-wide)

export type Actor = { emp_id: string; role: string; companyId: string | null; [key: string]: any };

export function getActor(dataStore: MockDataService, actorId: string): Actor {
  const actor = dataStore.getEmployees().find((e) => e.emp_id === actorId);
  if (!actor) throw new ForbiddenException('Could not resolve your account.');
  return actor;
}

export function getEmployeeOrThrow(dataStore: MockDataService, empId: string) {
  const employee = dataStore.getEmployees().find((e) => e.emp_id === empId);
  if (!employee) throw new NotFoundException('Employee not found');
  return employee;
}

export function canAccessEmployee(actor: Actor, target: any): boolean {
  if (!target) return false;
  if (actor.emp_id === target.emp_id) return true;
  if (actor.role === 'SUPER_ADMIN') return true;
  if (!actor.companyId || actor.companyId !== target.companyId) return false;
  if (actor.role === 'HR' || actor.role === 'COMPANY_ADMIN') return true;
  if (actor.role === 'TEAMLEAD') return target.manager_id === actor.emp_id;
  return false;
}

// Throws unless the actor may read/act on targetEmpId's records. Unknown and
// out-of-scope ids get the same 403, so ids from other companies can't be probed.
export function assertCanAccessEmployee(dataStore: MockDataService, actorId: string, targetEmpId: string) {
  const actor = getActor(dataStore, actorId);
  const target = dataStore.getEmployees().find((e) => e.emp_id === targetEmpId);
  if (!canAccessEmployee(actor, target)) {
    throw new ForbiddenException('You do not have access to this employee\'s records.');
  }
  return { actor, target };
}

// Ids of every employee whose records the actor may see - used to scope list endpoints.
export function accessibleEmployeeIds(dataStore: MockDataService, actorId: string): Set<string> {
  const actor = getActor(dataStore, actorId);
  return new Set(
    dataStore.getEmployees().filter((e) => canAccessEmployee(actor, e)).map((e) => e.emp_id),
  );
}

export const todayKey = () => new Date().toISOString().split('T')[0];

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
// True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30 etc.).
export function isDateKey(value: string): boolean {
  if (typeof value !== 'string' || !DATE_KEY.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().startsWith(value);
}
