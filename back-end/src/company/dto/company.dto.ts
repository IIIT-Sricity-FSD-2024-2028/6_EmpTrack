import {
  EmailField,
  EnumField,
  IdField,
  LIMITS,
  PasswordInputField,
  PersonNameField,
  PhoneField,
  StrongPasswordField,
  TextField,
} from '../../common/validation/validators';
import { ACCOUNT_STATUSES, COMPANY_STATUSES } from '../../common/validation/enums';

export class CreateCompanyDto {
  @TextField('Company name', { min: 2, max: 120 }) company_name: string;
  @EmailField('Company email') company_email: string;
  @PhoneField('Company phone') phone: string;
  @TextField('Industry', { min: 2, max: LIMITS.SHORT_TEXT_MAX }) industry: string;
  @TextField('Address', { min: 5, max: LIMITS.ADDRESS_MAX, multiline: true }) address: string;
  @IdField('Subscription plan') subscription_plan_id: string;
  @IdField('Platform Admin') platform_admin_id: string;
  @EnumField('Status', COMPANY_STATUSES, { optional: true }) status?: string;

  @PersonNameField('Admin name') admin_name: string;
  @EmailField('Admin email') admin_email: string;
  @PhoneField('Admin phone') admin_phone: string;
  @StrongPasswordField('Admin password') admin_password: string;
  // Compared with admin_password in CompanyService.
  @PasswordInputField('Password confirmation') admin_confirm_password: string;
}

export class UpdateCompanyDto {
  @TextField('Company name', { min: 2, max: 120, optional: 'partial' }) company_name?: string;
  @EmailField('Company email', { optional: 'partial' }) company_email?: string;
  @PhoneField('Company phone', { optional: 'partial' }) phone?: string;
  @TextField('Industry', { min: 2, max: LIMITS.SHORT_TEXT_MAX, optional: 'partial' }) industry?: string;
  @TextField('Address', { min: 5, max: LIMITS.ADDRESS_MAX, multiline: true, optional: 'partial' }) address?: string;
  @IdField('Subscription plan', { optional: 'partial' }) subscription_plan_id?: string;
}

export class UpdateCompanyStatusDto {
  @EnumField('Status', COMPANY_STATUSES) status: string;
}

export class ReassignPlatformAdminDto {
  @IdField('Platform Admin') platform_admin_id: string;
}

export class CreateCompanyAdminDto {
  @PersonNameField('Name') name: string;
  @EmailField('Email') email: string;
  @PhoneField('Phone number') phone: string;
  @StrongPasswordField('Password') password: string;
  @PasswordInputField('Password confirmation') confirmPassword: string;
  @EnumField('Status', ACCOUNT_STATUSES, { optional: true }) status?: string;
}

export class UpdateCompanyAdminDto {
  @PersonNameField('Name', { optional: 'partial' }) name?: string;
  @EmailField('Email', { optional: 'partial' }) email?: string;
  @PhoneField('Phone number', { optional: 'partial' }) phone?: string;
}

export class UpdateCompanyAdminStatusDto {
  @EnumField('Status', ACCOUNT_STATUSES) status: string;
}
