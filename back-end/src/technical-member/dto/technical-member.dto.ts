import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

// The Technical Member may only move an issue between the two working states.
// ESCALATED and CLOSED are deliberately excluded - escalation and permanent
// closure belong to the Platform Admin.
export class UpdateIssueStatusDto {
  @IsString() @IsNotEmpty() @IsIn(['OPEN', 'IN_PROGRESS']) status: string;
}

export class UpdateProgressDto {
  @IsInt() @Min(0) @Max(100) progress_percentage: number;
  @IsString() @IsOptional() note?: string;
}

export class AddWorkNoteDto {
  @IsString() @IsNotEmpty() message: string;
}

export class AddIssueCommentDto {
  @IsString() @IsNotEmpty() message: string;
}

export class UploadAttachmentDto {
  @IsString() @IsNotEmpty() file_name: string;
  @IsString() @IsOptional() file_type?: string;
  @IsInt() @IsOptional() @Min(0) file_size?: number;
  @IsString() @IsOptional() @IsIn(['SCREENSHOT', 'LOG', 'OTHER']) kind?: string;
  @IsString() @IsOptional() description?: string;
  // Base64 data URL of the file contents. The mock data store keeps uploads in
  // memory, so the frontend sends the encoded file rather than a multipart body.
  @IsString() @IsOptional() data_url?: string;
}

export class ResolveIssueDto {
  @IsString() @IsNotEmpty() resolution_notes: string;
}

export class SubmitForVerificationDto {
  @IsString() @IsOptional() note?: string;
}
