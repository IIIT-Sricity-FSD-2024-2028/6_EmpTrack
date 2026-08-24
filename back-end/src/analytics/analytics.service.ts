import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

const RANGE_DAYS: Record<string, number> = { today: 1, '7d': 7, '30d': 30, '6m': 182, '1y': 365 };

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataStore: MockDataService) {}

  private rangeStart(range?: string, from?: string) {
    if (from) return new Date(from);
    const days = RANGE_DAYS[range || '6m'] || 182;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  getOverview() {
    const companies = this.dataStore.getCompanies();
    const employees = this.dataStore.getEmployees();
    const platformAdmins = employees.filter((e) => e.role === 'PLATFORM_ADMIN');
    const paid = this.dataStore.getRevenueTransactions().filter((t) => t.payment_status === 'PAID');
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const criticalEscalations = this.dataStore.getCriticalEscalations();

    return {
      total_companies: companies.length,
      active_companies: companies.filter((c) => c.status === 'ACTIVE').length,
      inactive_companies: companies.filter((c) => c.status !== 'ACTIVE').length,
      total_platform_admins: platformAdmins.length,
      total_employees: employees.filter((e) => e.companyId && e.role !== 'COMPANY_ADMIN').length,
      active_subscriptions: companies.filter((c) => c.status === 'ACTIVE').length,
      monthly_revenue: paid.filter((t) => t.payment_date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0),
      annual_revenue: paid.filter((t) => t.payment_date.startsWith(String(now.getFullYear()))).reduce((sum, t) => sum + t.amount, 0),
      open_critical_issues: criticalEscalations.filter((e) => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length,
    };
  }

  getCompanyGrowth(range?: string, from?: string, to?: string) {
    const start = this.rangeStart(range, from);
    const end = to ? new Date(to) : new Date();
    const companies = this.dataStore.getCompanies();
    return this.monthBuckets(start, end).map((bucket) => ({
      period: bucket.label,
      total: companies.filter((c) => new Date(c.created_date) <= bucket.end).length,
      new: companies.filter((c) => {
        const d = new Date(c.created_date);
        return d >= bucket.start && d <= bucket.end;
      }).length,
    }));
  }

  getEmployeeGrowth(range?: string, from?: string, to?: string) {
    const start = this.rangeStart(range, from);
    const end = to ? new Date(to) : new Date();
    const employees = this.dataStore.getEmployees().filter((e) => e.companyId && e.role !== 'COMPANY_ADMIN');
    return this.monthBuckets(start, end).map((bucket) => ({
      period: bucket.label,
      total: employees.filter((e) => new Date(e.date_of_joining) <= bucket.end).length,
      new: employees.filter((e) => {
        const d = new Date(e.date_of_joining);
        return d >= bucket.start && d <= bucket.end;
      }).length,
    }));
  }

  getSubscriptionDistribution() {
    const plans = this.dataStore.getSubscriptionPlans();
    const companies = this.dataStore.getCompanies();
    return plans.map((plan) => ({
      plan_id: plan.plan_id,
      plan_name: plan.name,
      company_count: companies.filter((c) => c.subscription_plan_id === plan.plan_id).length,
    }));
  }

  getPlatformActivity(range?: string, from?: string, to?: string) {
    const start = this.rangeStart(range, from);
    const end = to ? new Date(to) : new Date();
    const logs = this.dataStore.getActivityLogs().filter((a) => {
      const d = new Date(a.timestamp);
      return d >= start && d <= end;
    });
    const byAction: Record<string, number> = {};
    logs.forEach((l) => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    });
    return {
      total_actions: logs.length,
      by_action: Object.entries(byAction).map(([action, count]) => ({ action, count })),
    };
  }

  private monthBuckets(start: Date, end: Date) {
    const buckets: { label: string; start: Date; end: Date }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) {
      const bucketStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
      buckets.push({
        label: bucketStart.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: bucketStart,
        end: bucketEnd,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }
}
