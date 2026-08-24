import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateCompanyDto {
  @IsString() @IsNotEmpty() company_name: string;
  @IsEmail() company_email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() industry: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() subscription_plan_id: string;
  @IsString() @IsNotEmpty() platform_admin_id: string;
  @IsString() @IsOptional() status?: string;

  @IsString() @IsNotEmpty() admin_name: string;
  @IsEmail() admin_email: string;
  @IsString() @IsNotEmpty() admin_phone: string;
}

export class UpdateCompanyDto {
  @IsString() @IsOptional() company_name?: string;
  @IsEmail() @IsOptional() company_email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() industry?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() subscription_plan_id?: string;
}

export class UpdateCompanyStatusDto {
  @IsString() @IsNotEmpty() status: string;
}

export class ReassignPlatformAdminDto {
  @IsString() @IsNotEmpty() platform_admin_id: string;
}
