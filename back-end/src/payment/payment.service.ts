import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CompleteMockPaymentDto } from './dto/payment.dto';

type Actor = { emp_id: string; emp_name: string };

// Advances a YYYY-MM-DD date string by one billing cycle. Mirrors the seed data's
// "MONTHLY" convention (the only cycle currently offered by subscription_plans) while
// still handling an annual plan correctly if one is ever added.
function addBillingCycle(dateStr: string, cycle: string): string {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (cycle === 'ANNUAL' || cycle === 'YEARLY') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().split('T')[0];
}

@Injectable()
export class PaymentService {
  constructor(private readonly dataStore: MockDataService) {}

  private resolveCompanyAdmin(actorId: string) {
    const employee = this.dataStore.getEmployees().find((e) => e.emp_id === actorId && e.role === 'COMPANY_ADMIN');
    if (!employee) throw new ForbiddenException('Only a Company Admin can perform this action.');
    if (!employee.companyId) throw new BadRequestException('This account is not linked to a company.');
    return employee;
  }

  private getCompany(companyId: string) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === companyId);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private getPlan(planId: string) {
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === planId);
    if (!plan) throw new BadRequestException("The company's subscription plan could not be found");
    return plan;
  }

  // A company is considered paid for the current billing period as long as it has a
  // recorded payment and next_billing_date hasn't arrived yet - once it has, the
  // period has rolled over and a new payment is due, with no cron job required.
  private isCurrentPeriodPaid(company: any): boolean {
    return !!company.last_payment_date && !!company.next_billing_date && new Date(company.next_billing_date) > new Date();
  }

  private subscriptionView(company: any) {
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === company.subscription_plan_id);
    return {
      company_id: company.company_id,
      company_name: company.company_name,
      plan_id: plan ? plan.plan_id : null,
      plan_name: plan ? plan.name : 'No Plan Assigned',
      billing_cycle: plan ? plan.billing_cycle : null,
      amount: plan ? plan.price : 0,
      currency: 'USD',
      status: this.isCurrentPeriodPaid(company) ? 'PAID' : 'PENDING_PAYMENT',
      last_payment_date: company.last_payment_date || null,
      next_billing_date: company.next_billing_date || null,
      last_transaction_id: company.last_transaction_id || null,
    };
  }

  private enrichTransaction(t: any) {
    const companies = this.dataStore.getCompanies();
    const employees = this.dataStore.getEmployees();
    const plans = this.dataStore.getSubscriptionPlans();
    const company = companies.find((c) => c.company_id === t.company_id);
    const plan = plans.find((p) => p.plan_id === t.plan_id);
    const companyAdmin = employees.find((e) => e.companyId === t.company_id && e.role === 'COMPANY_ADMIN');
    const platformAdmin = company ? employees.find((e) => e.emp_id === company.platform_admin_id) : null;
    return {
      ...t,
      company_name: company ? company.company_name : t.company_id,
      company_admin_name: companyAdmin ? companyAdmin.emp_name : null,
      platform_admin_id: company ? company.platform_admin_id : null,
      platform_admin_name: platformAdmin ? platformAdmin.emp_name : null,
      plan_name: plan ? plan.name : t.plan_id,
    };
  }

  // --- Company Admin ---

  getMySubscription(actorId: string) {
    const employee = this.resolveCompanyAdmin(actorId);
    const company = this.getCompany(employee.companyId);
    return this.subscriptionView(company);
  }

  getMyPaymentHistory(actorId: string) {
    const employee = this.resolveCompanyAdmin(actorId);
    return this.dataStore
      .getRevenueTransactions()
      .filter((t) => t.company_id === employee.companyId)
      .map((t) => this.enrichTransaction(t))
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  completeMockPayment(actor: Actor, dto: CompleteMockPaymentDto) {
    const employee = this.resolveCompanyAdmin(actor.emp_id);

    if (dto.companyId && dto.companyId !== employee.companyId) {
      throw new ForbiddenException('You can only complete payment for your own company.');
    }

    const company = this.getCompany(employee.companyId);

    if (dto.subscriptionId && dto.subscriptionId !== company.subscription_plan_id) {
      throw new BadRequestException("The selected subscription does not match your company's current plan.");
    }

    if (this.isCurrentPeriodPaid(company)) {
      throw new BadRequestException('This subscription has already been paid for this billing period.');
    }

    const plan = this.getPlan(company.subscription_plan_id);

    const today = new Date().toISOString().split('T')[0];
    const dateKey = today.replace(/-/g, '');
    const transaction_id = `MOCK-TXN-${dateKey}-${String(Date.now()).slice(-6)}`;

    const transaction = {
      transaction_id,
      company_id: company.company_id,
      plan_id: plan.plan_id,
      amount: plan.price,
      currency: 'USD',
      billing_cycle: plan.billing_cycle,
      payment_date: today,
      payment_status: 'PAID',
      payment_method: 'MOCK',
      is_mock: true,
      paid_by: employee.emp_id,
      paid_by_name: employee.emp_name,
    };
    this.dataStore.getRevenueTransactions().push(transaction);

    company.last_payment_date = today;
    company.last_transaction_id = transaction_id;
    company.next_billing_date = addBillingCycle(today, plan.billing_cycle);
    this.dataStore.saveCompany(company);

    this.dataStore.logActivity({
      user_id: employee.emp_id,
      user_name: employee.emp_name,
      role: 'COMPANY_ADMIN',
      action: 'SUBSCRIPTION_PAYMENT_COMPLETED',
      company_id: company.company_id,
      company_name: company.company_name,
      details: `Paid $${plan.price} for the ${plan.name} plan (${transaction_id}).`,
    });

    return {
      transaction_id,
      amount: plan.price,
      currency: 'USD',
      payment_method: 'MOCK',
      status: 'PAID',
      is_mock: true,
      paid_at: new Date().toISOString(),
      plan_name: plan.name,
      company_name: company.company_name,
      next_billing_date: company.next_billing_date,
    };
  }

  // --- Platform Admin (scoped to assigned companies only) ---

  getPlatformAdminPayments(scopePlatformAdminId: string | null, filters: { companyId?: string; status?: string; search?: string }) {
    const companyIds = new Set(
      this.dataStore
        .getCompanies()
        .filter((c) => !scopePlatformAdminId || c.platform_admin_id === scopePlatformAdminId)
        .map((c) => c.company_id),
    );

    let transactions = this.dataStore.getRevenueTransactions().filter((t) => companyIds.has(t.company_id));
    if (filters.companyId) transactions = transactions.filter((t) => t.company_id === filters.companyId);
    if (filters.status && filters.status !== 'all') transactions = transactions.filter((t) => t.payment_status === filters.status);

    let enriched = transactions.map((t) => this.enrichTransaction(t));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter(
        (t) => t.company_name.toLowerCase().includes(q) || (t.company_admin_name || '').toLowerCase().includes(q),
      );
    }

    return enriched.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  getPlatformAdminSummary(scopePlatformAdminId: string | null) {
    const companies = this.dataStore.getCompanies().filter((c) => !scopePlatformAdminId || c.platform_admin_id === scopePlatformAdminId);
    const companyIds = new Set(companies.map((c) => c.company_id));
    const paidCompanies = companies.filter((c) => this.isCurrentPeriodPaid(c));

    const revenue = this.dataStore
      .getRevenueTransactions()
      .filter((t) => companyIds.has(t.company_id) && t.payment_status === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      assigned_companies: companies.length,
      paid_payments: paidCompanies.length,
      pending_payments: companies.length - paidCompanies.length,
      revenue,
    };
  }
}
