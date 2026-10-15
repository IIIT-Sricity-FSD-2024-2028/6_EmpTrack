import { StrongPasswordField } from '../../common/validation/validators';

export class AcceptInvitationDto {
  // Same strength rule as every other account-creation/password-change path.
  @StrongPasswordField('Password')
  password: string;
}
