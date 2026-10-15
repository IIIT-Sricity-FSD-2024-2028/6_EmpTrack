import { EmailField, PasswordInputField } from '../../common/validation/validators';

// Login checks an existing password, so it is never strength-tested here.
export class LoginDto {
  @EmailField('Email') email: string;
  @PasswordInputField('Password') password: string;
}
