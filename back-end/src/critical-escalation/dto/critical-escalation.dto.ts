import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCriticalEscalationDto {
  @IsString() @IsNotEmpty() company_id: string;
  @IsString() @IsNotEmpty() category: string;
  @IsString() @IsNotEmpty() priority: string;
  @IsString() @IsOptional() assigned_team?: string;
  @IsString() @IsOptional() description?: string;
}

export class AssignEscalationDto {
  @IsString() @IsNotEmpty() assigned_team: string;
}

export class UpdatePriorityDto {
  @IsString() @IsNotEmpty() priority: string;
}

export class ResolveEscalationDto {
  @IsString() @IsOptional() resolution_notes?: string;
}

export class EscalateDto {
  @IsString() @IsOptional() note?: string;
}

export class AddCommentDto {
  @IsString() @IsNotEmpty() message: string;
}
