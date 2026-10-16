import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateTeamDto, CreateTeamLeadDto } from './dto/team.dto';
import { hashPassword } from '../common/utils/password.util';
import { randomUUID } from 'node:crypto';

type Actor = { emp_id: string; emp_name: string; role: string };

@Injectable()
export class TeamService {
  constructor(private readonly dataStore: MockDataService) {}

  // Every action here is scoped to the actor's own company, resolved from their own
  // employee record via the header-supplied actorId - never trusted from the client,
  // same convention as the COMPANY_SCOPED_ROLES lookup in employee.service.ts.
  private resolveActorCompanyId(actorId: string): string {
    const actor = this.dataStore.getEmployees().find((e) => e.emp_id === actorId);
    if (!actor || !actor.companyId) {
      throw new ForbiddenException('Could not resolve your company.');
    }
    return actor.companyId;
  }

  private enrich(team: any) {
    const employees = this.dataStore.getEmployees();
    const lead = employees.find((e) => e.emp_id === team.team_lead_id);
    const employee_count = employees.filter((e) => e.team_id === team.team_id && e.role === 'EMPLOYEE').length;
    return {
      ...team,
      team_lead_name: lead ? lead.emp_name : null,
      team_lead_email: lead ? lead.email : null,
      team_lead_status: lead ? lead.status : null,
      employee_count,
    };
  }

  getTeams(actorId: string) {
    const companyId = this.resolveActorCompanyId(actorId);
    return this.dataStore
      .getTeams()
      .filter((t) => t.companyId === companyId)
      .map((t) => this.enrich(t));
  }

  private getTeamOrThrow(id: string) {
    const team = this.dataStore.getTeams().find((t) => t.team_id === id);
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  private assertOwnsTeam(team: any, companyId: string) {
    if (team.companyId !== companyId) {
      throw new ForbiddenException('You do not manage this team');
    }
  }

  createTeam(dto: CreateTeamDto, actor: Actor) {
    const companyId = this.resolveActorCompanyId(actor.emp_id);
    const team = {
      team_id: 'TEAM-' + Date.now(),
      team_name: dto.team_name,
      companyId,
      team_lead_id: null,
      created_date: new Date().toISOString().split('T')[0],
    };
    this.dataStore.getTeams().push(team);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Team created',
      company_id: companyId,
      details: `Created team "${dto.team_name}".`,
    });

    return this.enrich(team);
  }

  createTeamLead(teamId: string, dto: CreateTeamLeadDto, actor: Actor) {
    const companyId = this.resolveActorCompanyId(actor.emp_id);
    const team = this.getTeamOrThrow(teamId);
    this.assertOwnsTeam(team, companyId);

    if (team.team_lead_id) {
      throw new BadRequestException('This team already has a Team Lead');
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }
    const existingEmail = this.dataStore.getEmployees().find((e) => String(e.email).trim().toLowerCase() === dto.email.trim().toLowerCase());
    if (existingEmail) throw new BadRequestException('An account with this email already exists');

    const emp_id = 'TL-' + randomUUID();
    const teamLead = {
      emp_id,
      emp_name: dto.name,
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone,
      password: hashPassword(dto.password),
      role: 'TEAMLEAD',
      status: dto.status || 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0],
      department_id: null,
      team_id: team.team_id,
      companyId,
    };
    this.dataStore.saveEmployee(teamLead);
    this.dataStore.getEmployees().push(teamLead);
    team.team_lead_id = emp_id;

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Team Lead created',
      company_id: companyId,
      details: `Created ${dto.name} as Team Lead for "${team.team_name}".`,
    });

    return this.enrich(team);
  }
}
