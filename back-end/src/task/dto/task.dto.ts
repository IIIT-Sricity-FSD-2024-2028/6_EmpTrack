import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  task_title: string;

  @IsString()
  @IsOptional()
  allocation_id?: string;

  @IsString()
  @IsNotEmpty()
  assigned_to: string;

  @IsString()
  @IsOptional()
  task_description?: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsString()
  @IsNotEmpty()
  deadline: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  progress_percentage?: number;

  @IsString()
  @IsOptional()
  task_title?: string;
  
  @IsString()
  @IsOptional()
  priority?: string;
  
  @IsString()
  @IsOptional()
  deadline?: string;
  
  @IsString()
  @IsOptional()
  task_description?: string;
}
