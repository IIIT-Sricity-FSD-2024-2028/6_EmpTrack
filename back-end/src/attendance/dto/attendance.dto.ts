import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  empId: string;

  @IsString()
  @IsNotEmpty()
  checkInTime: string;

  @IsString()
  @IsOptional()
  mode?: string;
}

export class CheckOutDto {
  @IsString()
  @IsNotEmpty()
  empId: string;
}
