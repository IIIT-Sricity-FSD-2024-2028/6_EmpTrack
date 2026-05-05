import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  emp_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsString()
  @IsOptional()
  related_task?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

