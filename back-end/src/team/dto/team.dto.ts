import { EmailField, EnumField, PasswordInputField, PersonNameField, PhoneField, StrongPasswordField, TextField } from '../../common/validation/validators';
import { ACCOUNT_STATUSES } from '../../common/validation/enums';

export class CreateTeamDto {
  @TextField('Team name', { min: 2, max: 60 }) team_name: string;
}

export class CreateTeamLeadDto {
  @PersonNameField('Name') name: string;
  @EmailField('Email') email: string;
  @PhoneField('Phone number') phone: string;
  @StrongPasswordField('Password') password: string;
  // Compared with password in TeamService.
  @PasswordInputField('Password confirmation') confirmPassword: string;
  @EnumField('Status', ACCOUNT_STATUSES, { optional: true }) status?: string;
}
