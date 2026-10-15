import { IdField } from '../../common/validation/validators';

export class CompleteMockPaymentDto {
  @IdField('Company', { optional: true }) companyId?: string;
  @IdField('Subscription', { optional: true }) subscriptionId?: string;
}
