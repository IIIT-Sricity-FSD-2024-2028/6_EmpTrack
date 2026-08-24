import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsOptional() specialization?: string;
}

export class UpdateTeamMemberDto {
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() specialization?: string;
}

export class UpdateTeamMemberStatusDto {
  @IsString() @IsNotEmpty() status: string;
}
