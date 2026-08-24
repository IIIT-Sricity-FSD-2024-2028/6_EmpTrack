import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { InvitationService } from '../invitation/invitation.service';
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanyStatusDto, ReassignPlatformAdminDto } from './dto/company.dto';

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

  getAllCompanies(platformAdminId?: string, status?: string, search?: string) {
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
      password: null,
      role: 'COMPANY_ADMIN',
      status: 'PENDING',
      date_of_joining: created_date,
      companyId: company_id,
    };
    this.dataStore.getEmployees().push(companyAdminEmployee);

    const invitation = this.invitationService.createInvitation({
      emp_id: admin_emp_id,
      email: dto.admin_email,
      name: dto.admin_name,
      role: 'COMPANY_ADMIN',
      company_id,
    });

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Company created',
      company_id,
      company_name: company.company_name,
      details: `Created ${company.company_name} and invited ${dto.admin_name} as Company Admin.`,
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

    return {
      company: this.enrich(company),
      invitation: { email: invitation.email, token: invitation.token, expires_at: invitation.expires_at },
    };
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
}
