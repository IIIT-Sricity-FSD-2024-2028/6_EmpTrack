import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignTicketDto {
  @IsString() @IsNotEmpty() assigned_to: string;
}

export class ReassignTicketDto {
  @IsString() @IsNotEmpty() assigned_to: string;
  @IsString() @IsNotEmpty() reason: string;
}

export class ResolveTicketDto {
  @IsString() @IsOptional() resolution_notes?: string;
}

export class EscalateTicketDto {
  @IsString() @IsOptional() note?: string;
}

export class AddTicketCommentDto {
  @IsString() @IsNotEmpty() message: string;
}

export class ChangeTicketStatusDto {
  @IsString() @IsNotEmpty() status: string;
}

export class ChangeTicketPriorityDto {
  @IsString() @IsNotEmpty() priority: string;
}

export class ChangeTicketCategoryDto {
  @IsString() @IsNotEmpty() category: string;
}

export class AddInternalNoteDto {
  @IsString() @IsNotEmpty() message: string;
}

export class ReopenTicketDto {
  @IsString() @IsOptional() reason?: string;
}

export class EscalateToTechnicalDto {
  @IsString() @IsOptional() note?: string;
}

export class EscalateToPlatformAdminDto {
  @IsString() @IsOptional() note?: string;
  @IsString() @IsOptional() reason?: string;
}
