import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  @IsNotEmpty()
  empId: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsNotEmpty()
  days: string;

  @IsString()
  @IsNotEmpty()
  leave_type: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateLeaveStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  approved_by_id: string;

  @IsString()
  @IsOptional()
  reject_reason?: string;
}
