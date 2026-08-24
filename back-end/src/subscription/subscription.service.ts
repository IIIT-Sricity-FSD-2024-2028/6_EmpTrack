import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreatePlanDto, UpdatePlanDto, UpdatePlanStatusDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly dataStore: MockDataService) {}

  private enrich(plan: any) {
    const companyCount = this.dataStore.getCompanies().filter((c) => c.subscription_plan_id === plan.plan_id).length;
    return { ...plan, company_count: companyCount };
  }

  getAllPlans() {
    return this.dataStore.getSubscriptionPlans().map((p) => this.enrich(p));
  }

  getPlanById(id: string) {
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return this.enrich(plan);
  }

  getCompaniesForPlan(id: string) {
    return this.dataStore.getCompanies().filter((c) => c.subscription_plan_id === id);
  }

  createPlan(dto: CreatePlanDto) {
    const plan = {
      plan_id: 'PLAN-' + Date.now(),
      name: dto.name,
      price: dto.price,
      billing_cycle: dto.billing_cycle,
      max_employees: dto.max_employees ?? null,
      features: dto.features || [],
      status: dto.status || 'ACTIVE',
      created_date: new Date().toISOString().split('T')[0],
    };
    this.dataStore.getSubscriptionPlans().push(plan);
    return this.enrich(plan);
  }

  updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) plan[key] = dto[key];
    });
    return this.enrich(plan);
  }

  updateStatus(id: string, dto: UpdatePlanStatusDto) {
    const plan = this.dataStore.getSubscriptionPlans().find((p) => p.plan_id === id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (dto.status !== 'ACTIVE') {
      const inUse = this.dataStore.getCompanies().some((c) => c.subscription_plan_id === id && c.status === 'ACTIVE');
      if (inUse) throw new BadRequestException('Cannot deactivate a plan that active companies are subscribed to');
    }
    plan.status = dto.status;
    return this.enrich(plan);
  }
}
