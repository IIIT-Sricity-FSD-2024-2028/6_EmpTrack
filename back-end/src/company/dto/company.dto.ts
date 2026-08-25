import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, Matches } from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '../../common/utils/password.util';

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
  @IsString() @MinLength(8) @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.',
  })
  admin_password: string;
  @IsString() @IsNotEmpty() admin_confirm_password: string;
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

export class CreateCompanyAdminDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @MinLength(8) @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must be 8+ characters with uppercase, lowercase, a number, and a special character.',
  })
  password: string;
  @IsString() @IsNotEmpty() confirmPassword: string;
  @IsString() @IsOptional() status?: string;
}

export class UpdateCompanyAdminDto {
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
}

export class UpdateCompanyAdminStatusDto {
  @IsString() @IsNotEmpty() status: string;
}
