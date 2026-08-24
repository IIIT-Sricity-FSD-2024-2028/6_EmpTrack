import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  date: string;
}

export class CreateCompanyEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  @IsOptional()
  visible_to_roles?: string[];
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
