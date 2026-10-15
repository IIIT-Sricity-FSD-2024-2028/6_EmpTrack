import { EnumField, IdField, LIMITS, TextField } from '../../common/validation/validators';
import { PRIORITY_VALUES } from '../../common/validation/enums';

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'];
export const TICKET_TYPES = ['TECHNICAL', 'SUPPORT'];

const Note = (label = 'Note') => TextField(label, { optional: true, max: LIMITS.COMMENT_MAX, multiline: true });
const Message = (label = 'Message') => TextField(label, { max: LIMITS.DESCRIPTION_MAX, multiline: true });
const Reason = (label = 'Reason') => TextField(label, { min: 5, max: LIMITS.REASON_MAX, multiline: true });

export class AssignTicketDto {
  @IdField('Assignee') assigned_to: string;
}

export class ReassignTicketDto {
  @IdField('Assignee') assigned_to: string;
  @Reason('Reassignment reason') reason: string;
}

export class ResolveTicketDto {
  @TextField('Resolution notes', { optional: true, max: LIMITS.DESCRIPTION_MAX, multiline: true }) resolution_notes?: string;
}

export class EscalateTicketDto {
  @Note() note?: string;
}

export class AddTicketCommentDto {
  @Message('Comment') message: string;
}

export class ChangeTicketStatusDto {
  @EnumField('Status', TICKET_STATUSES) status: string;
}

export class ChangeTicketPriorityDto {
  @EnumField('Priority', PRIORITY_VALUES, { caseInsensitive: true }) priority: string;
}

// Checked against the configured categories in PlatformTicketService.
export class ChangeTicketCategoryDto {
  @TextField('Category', { min: 2, max: LIMITS.SHORT_TEXT_MAX }) category: string;
}

export class AddInternalNoteDto {
  @Message('Internal note') message: string;
}

export class ReopenTicketDto {
  @TextField('Reopen reason', { optional: true, max: LIMITS.REASON_MAX, multiline: true }) reason?: string;
}

export class EscalateToTechnicalDto {
  @Note() note?: string;
}

export class EscalateToPlatformAdminDto {
  @Note() note?: string;
  @TextField('Reason', { optional: true, max: LIMITS.REASON_MAX, multiline: true }) reason?: string;
}

// Platform Admin sign-off on work a Technical Member sent back for verification.
export class VerifyResolutionDto {
  @Note() note?: string;
}

export class RejectResolutionDto {
  @Reason('Rejection reason') reason: string;
}

// Company Admin raising a new issue to their company's Platform Admin.
export class RaiseTicketDto {
  @TextField('Title', { min: 5, max: LIMITS.TITLE_MAX }) title: string;
  @TextField('Description', { min: 10, max: LIMITS.DESCRIPTION_MAX, multiline: true }) description: string;
  @EnumField('Priority', PRIORITY_VALUES, { optional: true, caseInsensitive: true }) priority?: string;
  @TextField('Category', { optional: true, min: 2, max: LIMITS.SHORT_TEXT_MAX }) category?: string;
  @EnumField('Ticket type', TICKET_TYPES, { optional: true, caseInsensitive: true }) ticket_type?: string;
}
