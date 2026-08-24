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
