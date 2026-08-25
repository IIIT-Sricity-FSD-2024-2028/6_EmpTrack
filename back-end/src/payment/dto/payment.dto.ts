import { IsString, IsOptional } from 'class-validator';

export class CompleteMockPaymentDto {
  @IsString() @IsOptional() companyId?: string;
  @IsString() @IsOptional() subscriptionId?: string;
}
