import { EmailField, EnumField, IdField, PasswordInputField, PersonNameField, PhoneField, StrongPasswordField } from '../../common/validation/validators';
import { ACCOUNT_STATUSES } from '../../common/validation/enums';

export class CreateEmployeeDto {
  @PersonNameField('Name') name: string;
  @EmailField('Email') email: string;
  @PhoneField('Phone number') phone: string;
  @StrongPasswordField('Password') password: string;
  // Compared with password in EmployeeService.
  @PasswordInputField('Password confirmation') confirmPassword: string;
  @IdField('Department') department_id: string;
  @IdField('Team') team_id: string;
  @EnumField('Status', ACCOUNT_STATUSES, { optional: true }) status?: string;
}
