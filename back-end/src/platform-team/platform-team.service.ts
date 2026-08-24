import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, UpdateTeamMemberStatusDto } from './dto/platform-team.dto';

type Actor = { emp_id: string; emp_name: string; role: string };
type TeamRole = 'TECHNICAL_TEAM' | 'SUPPORT_TEAM';

@Injectable()
export class PlatformTeamService {
  constructor(private readonly dataStore: MockDataService) {}

  private enrich(member: any) {
    const tickets = this.dataStore.getPlatformTickets().filter((t) => t.assigned_to === member.emp_id);
    const { password, ...safe } = member;
    return {
      ...safe,
      open_tickets: tickets.filter((t) => t.status === 'OPEN').length,
      in_progress_tickets: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      total_assigned: tickets.length,
    };
  }

  getAll(teamRole: TeamRole, scopePlatformAdminId: string | null, status?: string, search?: string) {
    let members = this.dataStore.getEmployees().filter((e) => e.role === teamRole);
    if (scopePlatformAdminId) members = members.filter((m) => m.platform_admin_id === scopePlatformAdminId);
    if (status && status !== 'all') members = members.filter((m) => m.status === status);
    if (search) {
      const q = search.toLowerCase();
      members = members.filter((m) => m.emp_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    return members.map((m) => this.enrich(m));
  }

  getById(teamRole: TeamRole, id: string, scopePlatformAdminId: string | null) {
    const member = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === teamRole);
    if (!member) throw new NotFoundException('Team member not found');
    if (scopePlatformAdminId && member.platform_admin_id !== scopePlatformAdminId) throw new NotFoundException('Team member not found');
    return this.enrich(member);
  }

  create(teamRole: TeamRole, dto: CreateTeamMemberDto, actor: Actor) {
    const existing = this.dataStore.getEmployees().find((e) => e.email === dto.email);
    if (existing) throw new BadRequestException('An account with this email already exists');

    const prefix = teamRole === 'TECHNICAL_TEAM' ? 'TT-' : 'ST-';
    const member = {
      emp_id: prefix + Date.now(),
      emp_name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: null,
      role: teamRole,
      status: 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0],
      companyId: null,
      platform_admin_id: actor.emp_id,
      specialization: dto.specialization || null,
    };
    this.dataStore.getEmployees().push(member);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: teamRole === 'TECHNICAL_TEAM' ? 'Technical Team member added' : 'Support Team member added',
      details: `Added ${dto.name} to the ${teamRole === 'TECHNICAL_TEAM' ? 'Technical' : 'Support'} Team.`,
    });

    return this.enrich(member);
  }

  update(teamRole: TeamRole, id: string, dto: UpdateTeamMemberDto, scopePlatformAdminId: string | null) {
    const member = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === teamRole);
    if (!member) throw new NotFoundException('Team member not found');
    if (scopePlatformAdminId && member.platform_admin_id !== scopePlatformAdminId) throw new NotFoundException('Team member not found');
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) member[key] = dto[key];
    });
    return this.enrich(member);
  }

  updateStatus(teamRole: TeamRole, id: string, dto: UpdateTeamMemberStatusDto, actor: Actor, scopePlatformAdminId: string | null) {
    const member = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === teamRole);
    if (!member) throw new NotFoundException('Team member not found');
    if (scopePlatformAdminId && member.platform_admin_id !== scopePlatformAdminId) throw new NotFoundException('Team member not found');

    if (dto.status !== 'ACTIVE') {
      const stillAssigned = this.dataStore.getPlatformTickets().some((t) => t.assigned_to === id && (t.status === 'OPEN' || t.status === 'IN_PROGRESS'));
      if (stillAssigned) throw new BadRequestException('Reassign this team member\'s open tickets before deactivating their account');
    }

    member.status = dto.status;
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: dto.status === 'ACTIVE' ? 'Team member activated' : 'Team member deactivated',
      details: `${member.emp_name}'s account status changed to ${dto.status}.`,
    });
    return this.enrich(member);
  }

  getWorkload(scopePlatformAdminId: string | null) {
    return {
      technical: this.getAll('TECHNICAL_TEAM', scopePlatformAdminId),
      support: this.getAll('SUPPORT_TEAM', scopePlatformAdminId),
    };
  }
}
