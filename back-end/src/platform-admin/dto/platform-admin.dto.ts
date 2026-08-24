import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreatePlatformAdminDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
}

export class UpdatePlatformAdminDto {
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
}

export class UpdatePlatformAdminStatusDto {
  @IsString() @IsNotEmpty() status: string;
}
