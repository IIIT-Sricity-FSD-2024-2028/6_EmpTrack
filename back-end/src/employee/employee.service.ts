import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { STRONG_PASSWORD_REGEX, hashPassword, comparePassword } from '../common/utils/password.util';

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

  getEmployeeById(id: string) {
    const emp = this.dataStore.getEmployees().find(e => e.emp_id === id);
    if (!emp) throw new NotFoundException('Employee not found');
    return safe(emp);
  }

  getEmployeeByEmail(email: string) {
    const emp = this.dataStore.getEmployees().find(e => e.email === email);
    if (!emp) throw new NotFoundException('Employee not found');
    return safe(emp);
  }

  getUsersByManager(managerId: string) {
    return this.dataStore.getEmployees().filter(e => e.manager_id === managerId).map(safe);
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
    const existingEmail = this.dataStore.getEmployees().find((e) => e.email === dto.email);
    if (existingEmail) throw new BadRequestException('An account with this email already exists');

    const emp_id = 'EM-' + Date.now();
    const employee = {
      emp_id,
      emp_name: dto.name,
      email: dto.email,
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

  // actorId comes from the x-actor-id header (this app's existing stand-in for an
  // authenticated identity, set by the frontend from the logged-in user's own
  // session on every request - see store.js's _fetch). It is never trusted from
  // the client-editable :id route param alone, so a caller can't change another
  // employee's password just by editing the URL.
  updatePassword(id: string, actorId: string, dto: UpdatePasswordDto) {
    if (!actorId || actorId !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }

    const emp = this.getEmployeeById(id);

    if (!comparePassword(dto.currentPassword, emp.password)) {
      throw new UnauthorizedException('Incorrect current password.');
    }
    if (dto.confirmPassword !== undefined && dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match.');
    }
    if (!STRONG_PASSWORD_REGEX.test(dto.newPassword)) {
      throw new BadRequestException('Weak password. Use 8+ characters with uppercase, lowercase, a number, and a special character.');
    }

    emp.password = hashPassword(dto.newPassword);

    const { password, ...safeEmployee } = emp;
    return safeEmployee;
  }

  deleteEmployee(id: string, actor?: Actor) {
    const target = this.dataStore.getEmployees().find((e) => e.emp_id === id);
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

  updateEmployee(id: string, updateData: any, actor?: Actor) {
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

