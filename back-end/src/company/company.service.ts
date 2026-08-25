import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { InvitationService } from '../invitation/invitation.service';
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanyStatusDto, ReassignPlatformAdminDto, CreateCompanyAdminDto, UpdateCompanyAdminDto, UpdateCompanyAdminStatusDto } from './dto/company.dto';
import { hashPassword } from '../common/utils/password.util';

type Actor = { emp_id: string; emp_name: string; role: string };

@Injectable()
export class CompanyService {
  constructor(
    private readonly dataStore: MockDataService,
    private readonly invitationService: InvitationService,
  ) {}

  private enrich(company: any) {
    const employees = this.dataStore.getEmployees();
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === company.subscription_plan_id);
    const platformAdmin = employees.find((e) => e.emp_id === company.platform_admin_id);
    const companyAdmin = employees.find((e) => e.companyId === company.company_id && e.role === 'COMPANY_ADMIN');
    const employeeCount = employees.filter((e) => e.companyId === company.company_id && e.role !== 'COMPANY_ADMIN').length;
    return {
      ...company,
      subscription_plan_name: plan ? plan.name : null,
      platform_admin_name: platformAdmin ? platformAdmin.emp_name : null,
      company_admin_name: companyAdmin ? companyAdmin.emp_name : null,
      company_admin_email: companyAdmin ? companyAdmin.email : null,
      company_admin_status: companyAdmin ? companyAdmin.status : null,
      employee_count: employeeCount,
    };
  }

  getAllCompanies(platformAdminId?: string | null, status?: string, search?: string) {
    let companies = this.dataStore.getCompanies();
    if (platformAdminId) companies = companies.filter((c) => c.platform_admin_id === platformAdminId);
    if (status && status !== 'all') companies = companies.filter((c) => c.status === status);
    if (search) {
      const q = search.toLowerCase();
      companies = companies.filter((c) => c.company_name.toLowerCase().includes(q) || c.company_email.toLowerCase().includes(q));
    }
    return companies.map((c) => this.enrich(c));
  }

  getCompanyById(id: string) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === id);
    if (!company) throw new NotFoundException('Company not found');
    return this.enrich(company);
  }

  createCompany(dto: CreateCompanyDto, actor: Actor) {
    const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === dto.platform_admin_id && e.role === 'PLATFORM_ADMIN');
    if (!platformAdmin) throw new BadRequestException('Selected Platform Admin was not found');
    if (platformAdmin.status !== 'ACTIVE') throw new BadRequestException('Selected Platform Admin is not active');

    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === dto.subscription_plan_id);
    if (!plan) throw new BadRequestException('Selected subscription plan was not found');

    const existingEmail = this.dataStore.getEmployees().find((e) => e.email === dto.admin_email);
    if (existingEmail) throw new BadRequestException('An account with the Company Admin email already exists');

    if (dto.admin_password !== dto.admin_confirm_password) {
      throw new BadRequestException('Company Admin password and confirmation do not match');
    }

    const company_id = 'COMP-' + Date.now();
    const created_date = new Date().toISOString().split('T')[0];
    const company = {
      company_id,
      company_name: dto.company_name,
      company_email: dto.company_email,
      phone: dto.phone,
      industry: dto.industry,
      address: dto.address,
      status: dto.status || 'ACTIVE',
      subscription_plan_id: dto.subscription_plan_id,
      platform_admin_id: dto.platform_admin_id,
      created_date,
    };
    this.dataStore.getCompanies().push(company);

    const admin_emp_id = 'CA-' + Date.now();
    const companyAdminEmployee = {
      emp_id: admin_emp_id,
      emp_name: dto.admin_name,
      email: dto.admin_email,
      phone: dto.admin_phone,
      password: hashPassword(dto.admin_password),
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
      date_of_joining: created_date,
      companyId: company_id,
    };
    this.dataStore.getEmployees().push(companyAdminEmployee);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Company created',
      company_id,
      company_name: company.company_name,
      details: `Created ${company.company_name} and its Company Admin ${dto.admin_name}.`,
    });
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Company assigned',
      company_id,
      company_name: company.company_name,
      details: `Assigned ${platformAdmin.emp_name} to manage ${company.company_name}.`,
    });

    return { company: this.enrich(company) };
  }

  updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === id);
    if (!company) throw new NotFoundException('Company not found');
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) company[key] = dto[key];
    });
    return this.enrich(company);
  }

  updateStatus(id: string, dto: UpdateCompanyStatusDto, actor: Actor) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === id);
    if (!company) throw new NotFoundException('Company not found');
    const previousStatus = company.status;
    company.status = dto.status;

    const actionLabel = dto.status === 'ACTIVE' ? 'Company activated' : dto.status === 'SUSPENDED' ? 'Company suspended' : 'Company deactivated';
    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: actionLabel,
      company_id: id,
      company_name: company.company_name,
      details: `Status changed from ${previousStatus} to ${dto.status}.`,
    });
    return this.enrich(company);
  }

  reassignPlatformAdmin(id: string, dto: ReassignPlatformAdminDto, actor: Actor) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === id);
    if (!company) throw new NotFoundException('Company not found');
    const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === dto.platform_admin_id && e.role === 'PLATFORM_ADMIN');
    if (!platformAdmin) throw new BadRequestException('Selected Platform Admin was not found');
    if (platformAdmin.status !== 'ACTIVE') throw new BadRequestException('Selected Platform Admin is not active');

    const previousAdminId = company.platform_admin_id;
    company.platform_admin_id = dto.platform_admin_id;

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Company reassigned',
      company_id: id,
      company_name: company.company_name,
      details: `Reassigned from ${previousAdminId || 'unassigned'} to ${platformAdmin.emp_name}.`,
    });
    return this.enrich(company);
  }

  // A Platform Admin may only create/view/manage Company Admins for companies
  // actually assigned to them (company.platform_admin_id) - enforced here, not just
  // hidden in the UI, so the check holds even if a caller edits the request directly.
  private assertManagesCompany(company: any, actor: Actor) {
    if (actor.role === 'PLATFORM_ADMIN' && company.platform_admin_id !== actor.emp_id) {
      throw new ForbiddenException('You do not manage this company');
    }
  }

  private getCompanyOrThrow(id: string) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === id);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private enrichAdmin(admin: any) {
    const { password, ...safe } = admin;
    return safe;
  }

  getCompanyAdmins(companyId: string, actor: Actor) {
    const company = this.getCompanyOrThrow(companyId);
    this.assertManagesCompany(company, actor);
    return this.dataStore
      .getEmployees()
      .filter((e) => e.companyId === companyId && e.role === 'COMPANY_ADMIN')
      .map((e) => this.enrichAdmin(e));
  }

  createCompanyAdmin(companyId: string, dto: CreateCompanyAdminDto, actor: Actor) {
    const company = this.getCompanyOrThrow(companyId);
    this.assertManagesCompany(company, actor);

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }
    const existingEmail = this.dataStore.getEmployees().find((e) => e.email === dto.email);
    if (existingEmail) throw new BadRequestException('An account with this email already exists');

    const emp_id = 'CA-' + Date.now();
    const admin = {
      emp_id,
      emp_name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashPassword(dto.password),
      role: 'COMPANY_ADMIN',
      status: dto.status || 'ACTIVE',
      date_of_joining: new Date().toISOString().split('T')[0],
      companyId,
    };
    this.dataStore.getEmployees().push(admin);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Company Admin created',
      company_id: companyId,
      company_name: company.company_name,
      details: `Created ${dto.name} as Company Admin for ${company.company_name}.`,
    });

    return this.enrichAdmin(admin);
  }

  updateCompanyAdmin(companyId: string, adminId: string, dto: UpdateCompanyAdminDto, actor: Actor) {
    const company = this.getCompanyOrThrow(companyId);
    this.assertManagesCompany(company, actor);
    const admin = this.dataStore.getEmployees().find((e) => e.emp_id === adminId && e.companyId === companyId && e.role === 'COMPANY_ADMIN');
    if (!admin) throw new NotFoundException('Company Admin not found');
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) admin[key] = dto[key];
    });
    return this.enrichAdmin(admin);
  }

  updateCompanyAdminStatus(companyId: string, adminId: string, dto: UpdateCompanyAdminStatusDto, actor: Actor) {
    const company = this.getCompanyOrThrow(companyId);
    this.assertManagesCompany(company, actor);
    const admin = this.dataStore.getEmployees().find((e) => e.emp_id === adminId && e.companyId === companyId && e.role === 'COMPANY_ADMIN');
    if (!admin) throw new NotFoundException('Company Admin not found');
    admin.status = dto.status;

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: dto.status === 'ACTIVE' ? 'Company Admin activated' : 'Company Admin deactivated',
      company_id: companyId,
      company_name: company.company_name,
      details: `${admin.emp_name}'s account status changed to ${dto.status}.`,
    });
    return this.enrichAdmin(admin);
  }
}
