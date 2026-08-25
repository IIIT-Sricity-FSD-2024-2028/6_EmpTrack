import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class RevenueService {
  constructor(private readonly dataStore: MockDataService) {}

  private paid() {
    return this.dataStore.getRevenueTransactions().filter((t) => t.payment_status === 'PAID');
  }

  getSummary() {
    const all = this.dataStore.getRevenueTransactions();
    const paid = this.paid();
    const total = paid.reduce((sum, t) => sum + t.amount, 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = String(now.getFullYear());
    const monthly = paid.filter((t) => t.payment_date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
    const annual = paid.filter((t) => t.payment_date.startsWith(yearKey)).reduce((sum, t) => sum + t.amount, 0);
    return {
      total_revenue: total,
      monthly_revenue: monthly,
      annual_revenue: annual,
      transaction_count: paid.length,
      pending_count: all.filter((t) => t.payment_status === 'PENDING').length,
      failed_count: all.filter((t) => t.payment_status === 'FAILED').length,
    };
  }

  getByPlatformAdmin() {
    const employees = this.dataStore.getEmployees();
    const companies = this.dataStore.getCompanies();
    const platformAdmins = employees.filter((e) => e.role === 'PLATFORM_ADMIN');
    const paid = this.paid();
    return platformAdmins.map((admin) => {
      const companyIds = new Set(companies.filter((c) => c.platform_admin_id === admin.emp_id).map((c) => c.company_id));
      const transactions = paid.filter((t) => companyIds.has(t.company_id));
      return {
        platform_admin_id: admin.emp_id,
        platform_admin_name: admin.emp_name,
        revenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        transaction_count: transactions.length,
      };
    });
  }

  getByPlan() {
    const plans = this.dataStore.getSubscriptionPlans();
    const paid = this.paid();
    return plans.map((plan) => ({
      plan_id: plan.plan_id,
      plan_name: plan.name,
      revenue: paid.filter((t) => t.plan_id === plan.plan_id).reduce((sum, t) => sum + t.amount, 0),
      transaction_count: paid.filter((t) => t.plan_id === plan.plan_id).length,
    }));
  }

  getByCompany() {
    const companies = this.dataStore.getCompanies();
    const paid = this.paid();
    return companies.map((company) => ({
      company_id: company.company_id,
      company_name: company.company_name,
      revenue: paid.filter((t) => t.company_id === company.company_id).reduce((sum, t) => sum + t.amount, 0),
      transaction_count: paid.filter((t) => t.company_id === company.company_id).length,
    }));
  }

  getTransactions(companyId?: string, status?: string, platformAdminId?: string, search?: string) {
    const companies = this.dataStore.getCompanies();
    const employees = this.dataStore.getEmployees();
    const plans = this.dataStore.getSubscriptionPlans();
    let transactions = this.dataStore.getRevenueTransactions();
    if (companyId) transactions = transactions.filter((t) => t.company_id === companyId);
    if (status && status !== 'all') transactions = transactions.filter((t) => t.payment_status === status);
    if (platformAdminId) {
      const scopedIds = new Set(companies.filter((c) => c.platform_admin_id === platformAdminId).map((c) => c.company_id));
      transactions = transactions.filter((t) => scopedIds.has(t.company_id));
    }

    let enriched = transactions.map((t) => {
      const company = companies.find((c) => c.company_id === t.company_id);
      const plan = plans.find((p) => p.plan_id === t.plan_id);
      const companyAdmin = employees.find((e) => e.companyId === t.company_id && e.role === 'COMPANY_ADMIN');
      const platformAdmin = company ? employees.find((e) => e.emp_id === company.platform_admin_id) : null;
      return {
        ...t,
        company_name: company ? company.company_name : t.company_id,
        plan_name: plan ? plan.name : t.plan_id,
        company_admin_name: companyAdmin ? companyAdmin.emp_name : null,
        platform_admin_id: company ? company.platform_admin_id : null,
        platform_admin_name: platformAdmin ? platformAdmin.emp_name : null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (t) =>
          t.company_name.toLowerCase().includes(q) ||
          t.transaction_id.toLowerCase().includes(q) ||
          (t.company_admin_name || '').toLowerCase().includes(q),
      );
    }

    return enriched.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }
}
