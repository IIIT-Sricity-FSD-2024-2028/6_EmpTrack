import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, Matches } from 'class-validator';
import { STRONG_PASSWORD_REGEX } from '../../common/utils/password.util';

export class CreatePlatformAdminDto {
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

export class UpdatePlatformAdminDto {
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
}

export class UpdatePlatformAdminStatusDto {
  @IsString() @IsNotEmpty() status: string;
}
