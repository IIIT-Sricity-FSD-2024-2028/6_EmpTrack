import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class RevenueService {
  constructor(private readonly dataStore: MockDataService) {}

  private paid() {
    return this.dataStore.getRevenueTransactions().filter((t) => t.payment_status === 'PAID');
  }

  getSummary() {
    const paid = this.paid();
    const total = paid.reduce((sum, t) => sum + t.amount, 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = String(now.getFullYear());
    const monthly = paid.filter((t) => t.payment_date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
    const annual = paid.filter((t) => t.payment_date.startsWith(yearKey)).reduce((sum, t) => sum + t.amount, 0);
    return { total_revenue: total, monthly_revenue: monthly, annual_revenue: annual, transaction_count: paid.length };
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

  getTransactions(companyId?: string, status?: string) {
    const companies = this.dataStore.getCompanies();
    let transactions = this.dataStore.getRevenueTransactions();
    if (companyId) transactions = transactions.filter((t) => t.company_id === companyId);
    if (status && status !== 'all') transactions = transactions.filter((t) => t.payment_status === status);
    return [...transactions]
      .map((t) => ({ ...t, company_name: companies.find((c) => c.company_id === t.company_id)?.company_name || t.company_id }))
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }
}
