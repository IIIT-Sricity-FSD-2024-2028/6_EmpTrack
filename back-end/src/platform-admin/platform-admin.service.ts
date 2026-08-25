import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { InvitationService } from '../invitation/invitation.service';
import { CreatePlatformAdminDto, UpdatePlatformAdminDto, UpdatePlatformAdminStatusDto } from './dto/platform-admin.dto';
import { hashPassword } from '../common/utils/password.util';

type Actor = { emp_id: string; emp_name: string; role: string };

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly dataStore: MockDataService,
    private readonly invitationService: InvitationService,
  ) {}

  private enrich(admin: any) {
    const companies = this.dataStore.getCompanies().filter((c) => c.platform_admin_id === admin.emp_id);
    const { password, ...safe } = admin;
    return {
      ...safe,
      assigned_company_count: companies.length,
      assigned_companies: companies.map((c) => ({ company_id: c.company_id, company_name: c.company_name, status: c.status })),
    };
  }

  getAllPlatformAdmins(status?: string, search?: string) {
    let admins = this.dataStore.getEmployees().filter((e) => e.role === 'PLATFORM_ADMIN');
    if (status && status !== 'all') admins = admins.filter((a) => a.status === status);
    if (search) {
      const q = search.toLowerCase();
      admins = admins.filter((a) => a.emp_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    return admins.map((a) => this.enrich(a));
  }

  getActiveCount() {
    return this.dataStore.getEmployees().filter((e) => e.role === 'PLATFORM_ADMIN' && e.status === 'ACTIVE').length;
  }

  getPlatformAdminById(id: string) {
    const admin = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === 'PLATFORM_ADMIN');
    if (!admin) throw new NotFoundException('Platform Admin not found');
    return this.enrich(admin);
  }

  getAssignedCompanies(id: string) {
    return this.dataStore.getCompanies().filter((c) => c.platform_admin_id === id);
  }

  getActivity(id: string) {
    return [...this.dataStore.getActivityLogs()]
      .filter((a) => a.user_id === id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createPlatformAdmin(dto: CreatePlatformAdminDto, actor: Actor) {
    const existing = this.dataStore.getEmployees().find((e) => e.email === dto.email);
    if (existing) throw new BadRequestException('An account with this email already exists');

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }

    const emp_id = 'PA-' + Date.now();
    const admin = {
      emp_id,
      emp_name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashPassword(dto.password),
      role: 'PLATFORM_ADMIN',
      status: dto.status || 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0],
      companyId: null,
    };
    this.dataStore.getEmployees().push(admin);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Platform Admin created',
      details: `Created ${dto.name} as a Platform Admin.`,
    });

    return { platformAdmin: this.enrich(admin) };
  }

  updatePlatformAdmin(id: string, dto: UpdatePlatformAdminDto) {
    const admin = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === 'PLATFORM_ADMIN');
    if (!admin) throw new NotFoundException('Platform Admin not found');
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) admin[key] = dto[key];
    });
    return this.enrich(admin);
  }

  updateStatus(id: string, dto: UpdatePlatformAdminStatusDto, actor: Actor) {
    const admin = this.dataStore.getEmployees().find((e) => e.emp_id === id && e.role === 'PLATFORM_ADMIN');
    if (!admin) throw new NotFoundException('Platform Admin not found');
    if (dto.status !== 'ACTIVE') {
      const stillManaged = this.dataStore.getCompanies().some((c) => c.platform_admin_id === id && c.status !== 'SUSPENDED');
      if (stillManaged) throw new BadRequestException("Reassign this Platform Admin's companies before deactivating their account");
    }
    admin.status = dto.status;
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: dto.status === 'ACTIVE' ? 'Platform Admin activated' : 'Platform Admin deactivated',
      details: `${admin.emp_name}'s account status changed to ${dto.status}.`,
    });
    return this.enrich(admin);
  }
}
