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
