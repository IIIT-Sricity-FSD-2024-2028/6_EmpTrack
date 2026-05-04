import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEscalationDto {
  @IsString()
  @IsNotEmpty()
  reference_type: string;

  @IsString()
  @IsNotEmpty()
  reference_id: string;

  @IsString()
  @IsNotEmpty()
  escalated_from: string;

  @IsString()
  @IsNotEmpty()
  escalated_to: string;
  
  @IsString()
  @IsNotEmpty()
  escalation_reason: string;
}
