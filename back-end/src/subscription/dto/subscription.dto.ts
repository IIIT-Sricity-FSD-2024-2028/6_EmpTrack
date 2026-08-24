import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) price: number;
  @IsString() @IsNotEmpty() billing_cycle: string;
  @IsNumber() @IsOptional() max_employees?: number;
  @IsArray() @IsOptional() features?: string[];
  @IsString() @IsOptional() status?: string;
}

export class UpdatePlanDto {
  @IsString() @IsOptional() name?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() billing_cycle?: string;
  @IsNumber() @IsOptional() max_employees?: number;
  @IsArray() @IsOptional() features?: string[];
}

export class UpdatePlanStatusDto {
  @IsString() @IsNotEmpty() status: string;
}
