import { EmailField, EnumField, PasswordInputField, PersonNameField, PhoneField, StrongPasswordField } from '../../common/validation/validators';
import { ACCOUNT_STATUSES } from '../../common/validation/enums';

export class CreatePlatformAdminDto {
  @PersonNameField('Name') name: string;
  @EmailField('Email') email: string;
  @PhoneField('Phone number') phone: string;
  @StrongPasswordField('Password') password: string;
  // Compared with password in PlatformAdminService.
  @PasswordInputField('Password confirmation') confirmPassword: string;
  @EnumField('Status', ACCOUNT_STATUSES, { optional: true }) status?: string;
}

export class UpdatePlatformAdminDto {
  @PersonNameField('Name', { optional: 'partial' }) name?: string;
  @EmailField('Email', { optional: 'partial' }) email?: string;
  @PhoneField('Phone number', { optional: 'partial' }) phone?: string;
}

export class UpdatePlatformAdminStatusDto {
  @EnumField('Status', ACCOUNT_STATUSES) status: string;
}
