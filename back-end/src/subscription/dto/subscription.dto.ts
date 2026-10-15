import { EnumField, NumberField, TextField, TextListField } from '../../common/validation/validators';
import { BILLING_CYCLES, PLAN_STATUSES } from '../../common/validation/enums';

const PRICE = { min: 0, max: 1_000_000, maxDecimals: 2 };
const MAX_EMPLOYEES = { min: 1, max: 1_000_000, integer: true };

export class CreatePlanDto {
  @TextField('Plan name', { min: 2, max: 60 }) name: string;
  @NumberField('Price', PRICE) price: number;
  @EnumField('Billing cycle', BILLING_CYCLES) billing_cycle: string;
  @NumberField('Max employees', { ...MAX_EMPLOYEES, optional: true }) max_employees?: number;
  @TextListField('Features', { optional: true, maxItems: 30 }) features?: string[];
  @EnumField('Status', PLAN_STATUSES, { optional: true }) status?: string;
}

export class UpdatePlanDto {
  @TextField('Plan name', { min: 2, max: 60, optional: 'partial' }) name?: string;
  @NumberField('Price', { ...PRICE, optional: 'partial' }) price?: number;
  @EnumField('Billing cycle', BILLING_CYCLES, { optional: 'partial' }) billing_cycle?: string;
  @NumberField('Max employees', { ...MAX_EMPLOYEES, optional: true }) max_employees?: number;
  @TextListField('Features', { optional: true, maxItems: 30 }) features?: string[];
}

export class UpdatePlanStatusDto {
  @EnumField('Status', PLAN_STATUSES) status: string;
}
