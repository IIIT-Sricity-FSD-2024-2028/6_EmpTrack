import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class SupportMemberService {
  constructor(private readonly dataStore: MockDataService) {}

  // Resolves the acting Support Member's own record, and the Platform Admin scope
  // their tickets are filtered by. The x-actor-id header is the only trusted identity
  // source; a caller cannot widen their own scope via query params.
  resolveScope(actorId: string) {
    const member = this.dataStore.getEmployees().find((e) => e.emp_id === actorId && e.role === 'SUPPORT_MEMBER');
    if (!member) throw new ForbiddenException('Support member account not found');
    return { member, platformAdminId: member.platform_admin_id || null };
  }

  getCategories() {
    return this.dataStore.getTicketCategories();
  }

  getCompanySummary(companyId: string, platformAdminId: string | null) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (platformAdminId && company.platform_admin_id !== platformAdminId) throw new NotFoundException('Company not found');

    const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === company.platform_admin_id);
    const companyAdmin = this.dataStore.getEmployees().find((e) => e.companyId === company.company_id && e.role === 'COMPANY_ADMIN');
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === company.subscription_plan_id);
    const employeeCount = this.dataStore.getEmployees().filter((e) => e.companyId === company.company_id).length;

    return {
      company_id: company.company_id,
      company_name: company.company_name,
      status: company.status,
      industry: company.industry,
      assigned_platform_admin: platformAdmin ? platformAdmin.emp_name : null,
      company_admin: companyAdmin ? companyAdmin.emp_name : null,
      company_admin_email: companyAdmin ? companyAdmin.email : null,
      subscription_plan: plan ? plan.name : null,
      employee_count: employeeCount,
    };
  }

  getLinkedTechnicalTicket(id: string, platformAdminId: string | null) {
    const ticket = this.dataStore.getPlatformTickets().find((t) => t.ticket_id === id && t.ticket_type === 'TECHNICAL');
    if (!ticket) throw new NotFoundException('Technical ticket not found');
    if (platformAdminId && ticket.platform_admin_id !== platformAdminId) throw new NotFoundException('Technical ticket not found');
    const assignee = this.dataStore.getEmployees().find((e) => e.emp_id === ticket.assigned_to);
    return { ...ticket, assigned_to_name: assignee ? assignee.emp_name : null };
  }
}
