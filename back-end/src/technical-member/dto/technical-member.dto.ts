import { Matches } from 'class-validator';
import { EnumField, LIMITS, NumberField, TextField } from '../../common/validation/validators';

export const ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt', '.log'];
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const Note = (label = 'Note') => TextField(label, { optional: true, max: LIMITS.COMMENT_MAX, multiline: true });

// The Technical Member may only move an issue between the two working states.
// ESCALATED and CLOSED are deliberately excluded - escalation and permanent
// closure belong to the Platform Admin.
export class UpdateIssueStatusDto {
  @EnumField('Status', ['OPEN', 'IN_PROGRESS']) status: string;
}

export class UpdateProgressDto {
  @NumberField('Progress', { min: 0, max: 100, integer: true }) progress_percentage: number;
  @Note() note?: string;
}

export class AddWorkNoteDto {
  @TextField('Work note', { max: LIMITS.DESCRIPTION_MAX, multiline: true }) message: string;
}

export class AddIssueCommentDto {
  @TextField('Comment', { max: LIMITS.DESCRIPTION_MAX, multiline: true }) message: string;
}

// The file type is decided by the server from the extension and the file's actual
// bytes (TechnicalMemberService.uploadAttachment); file_type and file_size are only
// cross-checked.
export class UploadAttachmentDto {
  @TextField('File name', { max: 255 })
  @Matches(/^[^\\/:*?"<>|]+$/, { message: 'File name contains characters that are not allowed.' })
  file_name: string;

  @TextField('File type', { optional: true, max: 100 }) file_type?: string;
  @NumberField('File size', { optional: true, integer: true, min: 1, max: MAX_ATTACHMENT_BYTES }) file_size?: number;
  @EnumField('Attachment kind', ['SCREENSHOT', 'LOG', 'OTHER'], { optional: true }) kind?: string;
  @TextField('Description', { optional: true, max: LIMITS.REASON_MAX, multiline: true }) description?: string;
  // Base64 data URL of the file contents. The mock data store keeps uploads in
  // memory, so the frontend sends the encoded file rather than a multipart body.
  @TextField('File contents', { max: Math.ceil(MAX_ATTACHMENT_BYTES * 1.4) })
  @Matches(/^data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/]+=*$/, { message: 'File contents must be a base64 data URL.' })
  data_url: string;
}

export class ResolveIssueDto {
  @TextField('Resolution notes', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }) resolution_notes: string;
}

export class SubmitForVerificationDto {
  @Note() note?: string;
}

/** ?days= / ?limit= on the dashboard feeds. */
export class WorkProgressQueryDto {
  @TextField('Days', { optional: true, max: 3 })
  @Matches(/^([1-9]|[1-8]\d|90)$/, { message: 'Days must be a whole number between 1 and 90.' })
  days?: string;
}

export class RecentUpdatesQueryDto {
  @TextField('Limit', { optional: true, max: 3 })
  @Matches(/^([1-9]|[1-9]\d|100)$/, { message: 'Limit must be a whole number between 1 and 100.' })
  limit?: string;
}
