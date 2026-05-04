import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWorkLogDto {
  @IsString()
  @IsNotEmpty()
  emp_id: string;

  @IsString()
  @IsNotEmpty()
  task_id: string;

  @IsString()
  @IsNotEmpty()
  task_title: string;

  @IsString()
  @IsNotEmpty()
  start_time: string;

  @IsString()
  @IsNotEmpty()
  end_time: string;

  @IsNumber()
  @IsNotEmpty()
  hours_spent: number;
  
  @IsString()
  @IsNotEmpty()
  description: string;
}
