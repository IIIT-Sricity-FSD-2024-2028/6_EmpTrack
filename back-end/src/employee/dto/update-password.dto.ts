import { PasswordInputField, StrongPasswordField } from '../../common/validation/validators';

// EmployeeService verifies the current password, that the new one differs from it,
// and that the confirmation (when sent) matches.
export class UpdatePasswordDto {
  @PasswordInputField('Current password') currentPassword: string;
  @StrongPasswordField('New password') newPassword: string;
  @PasswordInputField('Password confirmation', { optional: true }) confirmPassword?: string;
}
