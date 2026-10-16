import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { STRONG_PASSWORD_REGEX, hashPassword, comparePassword } from '../common/utils/password.util';
import { randomUUID } from 'node:crypto';

const COMPANY_SCOPED_ROLES = ['COMPANY_ADMIN', 'HR'];

type Actor = { emp_id: string; emp_name: string; role: string };

function safe(emp: any) {
  const { password, ...rest } = emp;
  return rest;
}

@Injectable()
export class EmployeeService {
  constructor(private readonly dataStore: MockDataService) {}

  // COMPANY_ADMIN/HR only ever see their own company's employees - the scope is
  // resolved from the caller's own record (via the header-supplied actorId), never
  // from anything the client could set directly, mirroring resolvePlatformAdminScope.
  // TEAMLEAD is handled separately by the controller (always its own direct reports,
  // via getUsersByManager) - it never reaches this company-wide branch.
  getAllEmployees(role?: string, actorId?: string) {
    const employees = this.dataStore.getEmployees();
    if (role && COMPANY_SCOPED_ROLES.includes(role)) {
      const actor = employees.find((e) => e.emp_id === actorId);
      if (!actor || !actor.companyId) return [];
      return employees.filter((e) => e.companyId === actor.companyId).map(safe);
    }
    return employees.map(safe);
  }

  // A profile is readable by its owner, by anyone in the same company (e.g. an
  // employee looking up their own Team Lead), and by the Super Admin. Out-of-scope and
  // unknown ids get the same 404 so other companies' ids can't be probed.
  private findReadable(match: (e: any) => boolean, actorId: string) {
    const actor = this.dataStore.getEmployees().find((e) => e.emp_id === actorId);
    const emp = this.dataStore.getEmployees().find(match);
    const allowed = !!actor && !!emp && (
      actor.emp_id === emp.emp_id ||
      actor.role === 'SUPER_ADMIN' ||
      (!!actor.companyId && actor.companyId === emp.companyId)
    );
    if (!allowed) throw new NotFoundException('Employee not found');
    return emp;
  }

  getEmployeeById(id: string, actorId: string) {
    return safe(this.findReadable((e) => e.emp_id === id, actorId));
  }

  getEmployeeByEmail(email: string, actorId: string) {
    const wanted = String(email).toLowerCase();
    return safe(this.findReadable((e) => String(e.email).toLowerCase() === wanted, actorId));
  }

  // Direct reports of a manager - limited to the caller's own company, so HR/Company
  // Admin can't list another company's team via ?managerId=.
  getUsersByManager(managerId: string, actorId?: string) {
    const actor = this.dataStore.getEmployees().find((e) => e.emp_id === actorId);
    return this.dataStore.getEmployees()
      .filter(e => e.manager_id === managerId)
      .filter(e => !actor || actor.emp_id === managerId || (!!actor.companyId && e.companyId === actor.companyId))
      .map(safe);
  }

  // Company Admin may only manage accounts inside their own company.
  private findManageable(id: string, actor: Actor) {
    const companyId = this.resolveActorCompanyId(actor.emp_id);
    const target = this.dataStore.getEmployees().find((e) => e.emp_id === id);
    if (!target || target.companyId !== companyId) throw new NotFoundException('Employee not found');
    return target;
  }

  // Resolves the actor's own companyId from their header-supplied actorId, same
  // convention as TeamService - never trusted from the client body.
  private resolveActorCompanyId(actorId: string): string {
    const actor = this.dataStore.getEmployees().find((e) => e.emp_id === actorId);
    if (!actor || !actor.companyId) {
      throw new ForbiddenException('Could not resolve your company.');
    }
    return actor.companyId;
  }

  createEmployee(dto: CreateEmployeeDto, actor: Actor) {
    const companyId = this.resolveActorCompanyId(actor.emp_id);
    const team = this.dataStore.getTeams().find((t) => t.team_id === dto.team_id);
    if (!team) throw new NotFoundException('Team not found');
    if (team.companyId !== companyId) throw new ForbiddenException('You do not manage this team');
    if (!team.team_lead_id) throw new BadRequestException('This team has no Team Lead yet - assign one before adding employees');

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }
    const existingEmail = this.dataStore.getEmployees().find((e) => String(e.email).trim().toLowerCase() === dto.email.trim().toLowerCase());
    if (existingEmail) throw new BadRequestException('An account with this email already exists');

    const emp_id = 'EM-' + randomUUID();
    const employee = {
      emp_id,
      emp_name: dto.name,
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone,
      password: hashPassword(dto.password),
      role: 'EMPLOYEE',
      status: dto.status || 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0],
      department_id: dto.department_id,
      team_id: team.team_id,
      manager_id: team.team_lead_id,
      companyId,
    };
    this.dataStore.saveEmployee(employee);
    this.dataStore.getEmployees().push(employee);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Employee created',
      company_id: companyId,
      details: `Created ${dto.name} as Employee on team "${team.team_name}".`,
    });

    return safe(employee);
  }

  // actorId comes from the x-actor-id header, which AuthGuard sets from the caller's
  // login session. It is never trusted from the client-editable :id route param
  // alone, so a caller can't change another employee's password by editing the URL.
  updatePassword(id: string, actorId: string, dto: UpdatePasswordDto) {
    if (!actorId || actorId !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }

    // The stored record itself (not the password-stripped copy getEmployeeById
    // returns) - comparing against / assigning to that copy made every change fail.
    const emp = this.dataStore.getEmployees().find((e) => e.emp_id === id);
    if (!emp) throw new NotFoundException('Employee not found');

    // 400 rather than 401: the session is fine, only the form input is wrong (a 401
    // makes the frontend end the session).
    if (!comparePassword(dto.currentPassword, emp.password)) {
      throw new BadRequestException('Incorrect current password.');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('The new password must be different from the current one.');
    }
    if (dto.confirmPassword !== undefined && dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match.');
    }
    if (!STRONG_PASSWORD_REGEX.test(dto.newPassword)) {
      throw new BadRequestException('Weak password. Use 8+ characters with uppercase, lowercase, a number, and a special character.');
    }

    const updated = { ...emp, password: hashPassword(dto.newPassword) };
    this.dataStore.saveEmployee(updated);
    Object.assign(emp, updated);

    const { password, ...safeEmployee } = emp;
    return safeEmployee;
  }

  deleteEmployee(id: string, actor: Actor) {
    const target = this.findManageable(id, actor);
    if (target.emp_id === actor.emp_id) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    if (this.dataStore.getTeams().some((t) => t.team_lead_id === id)) {
      throw new BadRequestException('This employee leads a team. Assign the team a new lead before deleting them.');
    }
    const deleted = this.dataStore.deleteEmployee(id);
    if (!deleted) throw new NotFoundException('Employee not found');

    if (actor?.emp_id) {
      this.dataStore.logActivity({
        user_id: actor.emp_id,
        user_name: actor.emp_name,
        role: actor.role,
        action: 'Employee deleted',
        company_id: target?.companyId || null,
        details: `Deleted employee ${target?.emp_name || id}.`,
      });
    }

    return { success: true, message: 'Employee deleted' };
  }

  updateEmployee(id: string, dto: UpdateEmployeeDto, actor: Actor) {
    const target = this.findManageable(id, actor);
    const updateData: Record<string, any> = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    if (updateData.emp_name !== undefined) updateData.emp_name = updateData.emp_name.trim();
    if (updateData.email !== undefined) {
      updateData.email = updateData.email.trim();
      updateData.email = updateData.email.toLowerCase();
      const taken = this.dataStore.getEmployees().some(
        (e) => e.emp_id !== id && String(e.email).trim().toLowerCase() === updateData.email,
      );
      if (taken) throw new BadRequestException('An account with this email already exists');
    }
    if (target.emp_id === actor.emp_id && updateData.status && updateData.status !== 'ACTIVE') {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const updated = this.dataStore.updateEmployee(id, updateData);
    if (!updated) throw new NotFoundException('Employee not found');

    if (actor?.emp_id) {
      this.dataStore.logActivity({
        user_id: actor.emp_id,
        user_name: actor.emp_name,
        role: actor.role,
        action: 'Employee updated',
        company_id: updated.companyId || null,
        details: `Updated employee ${updated.emp_name || id} (${Object.keys(updateData).join(', ')}).`,
      });
    }

    return safe(updated);
  }
}

