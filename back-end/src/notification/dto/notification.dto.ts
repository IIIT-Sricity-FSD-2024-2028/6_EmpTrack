import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

