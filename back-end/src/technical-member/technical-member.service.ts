import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { NotificationService } from '../notification/notification.service';
import {
  UpdateIssueStatusDto,
  UpdateProgressDto,
  AddWorkNoteDto,
  AddIssueCommentDto,
  UploadAttachmentDto,
  ResolveIssueDto,
  SubmitForVerificationDto,
  ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_BYTES,
} from './dto/technical-member.dto';
import { CANONICAL_MIME, contentMatchesExtension, extensionOf } from '../common/utils/file-signature.util';

type Actor = { emp_id: string; emp_name: string; role: string };

const OPEN_STATUSES = ['OPEN', 'IN_PROGRESS'];
const TERMINAL_STATUSES = ['RESOLVED', 'CLOSED'];
// Uploads are held in memory by MockDataService, so a per-file ceiling
// (MAX_ATTACHMENT_BYTES) keeps a long-running dev server from growing without bound.

@Injectable()
export class TechnicalMemberService {
  constructor(
    private readonly dataStore: MockDataService,
    private readonly notificationService: NotificationService,
  ) {}

  // --- Identity & ownership -------------------------------------------------

  // The x-actor-id header is the only trusted identity source. Everything this
  // service returns is filtered through the acting member's own emp_id, so a
  // Technical Member can never widen their view to another member's workload.
  resolveMember(actorId: string) {
    const member = this.dataStore
      .getEmployees()
      .find((e) => e.emp_id === actorId && e.role === 'TECHNICAL_MEMBER');
    if (!member) throw new ForbiddenException('Technical member account not found');
    return member;
  }

  private myIssues(actorId: string) {
    this.resolveMember(actorId);
    return this.dataStore
      .getPlatformTickets()
      .filter((t) => t.ticket_type === 'TECHNICAL' && t.assigned_to === actorId);
  }

  // Loads one issue and asserts the acting member owns it. Issues assigned to
  // someone else are reported as "not found" rather than "forbidden" so this
  // endpoint cannot be used to probe which ticket IDs exist.
  private findOwned(actorId: string, id: string) {
    const ticket = this.myIssues(actorId).find((t) => t.ticket_id === id);
    if (!ticket) throw new NotFoundException('Technical issue not found or not assigned to you');
    return ticket;
  }

  private enrich(ticket: any) {
    const company = this.dataStore.getCompanies().find((c) => c.company_id === ticket.company_id);
    const platformAdmin = this.dataStore.getEmployees().find((e) => e.emp_id === ticket.platform_admin_id);
    const assignee = this.dataStore.getEmployees().find((e) => e.emp_id === ticket.assigned_to);
    return {
      ...ticket,
      company_name: company ? company.company_name : ticket.company_id,
      assigned_to_name: assignee ? assignee.emp_name : null,
      platform_admin_name: platformAdmin ? platformAdmin.emp_name : null,
      // Attachment payloads are large; list responses carry metadata only and the
      // dedicated attachments endpoint serves the contents.
      attachments: (ticket.attachments || []).map(({ data_url, ...meta }) => meta),
    };
  }

  private touch(ticket: any) {
    ticket.updated_date = new Date().toISOString().split('T')[0];
  }

  private notifyPlatformAdmin(ticket: any, message: string, type = 'info') {
    if (!ticket.platform_admin_id) return;
    this.notificationService.createNotification({
      employee_id: ticket.platform_admin_id,
      message,
      type,
    });
  }

  // --- Reads ----------------------------------------------------------------

  getIssues(
    actorId: string,
    filters: { status?: string; priority?: string; search?: string; scope?: string } = {},
  ) {
    let issues = this.myIssues(actorId);

    // "active" is the Assigned Issues working queue; "history" is everything the
    // member has already finished. Anything else means no scope filter.
    if (filters.scope === 'active') issues = issues.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    else if (filters.scope === 'history') issues = issues.filter((t) => TERMINAL_STATUSES.includes(t.status));

    if (filters.status && filters.status !== 'all') issues = issues.filter((t) => t.status === filters.status);
    if (filters.priority && filters.priority !== 'all') issues = issues.filter((t) => t.priority === filters.priority);

    let enriched = issues.map((t) => this.enrich(t));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter((t) =>
        (t.ticket_id || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.company_name || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q),
      );
    }

    return enriched.sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime());
  }

  getIssueById(actorId: string, id: string) {
    return this.enrich(this.findOwned(actorId, id));
  }

  getWorkNotes(actorId: string, id: string) {
    return this.findOwned(actorId, id).internal_notes || [];
  }

  getAttachments(actorId: string, id: string) {
    return this.findOwned(actorId, id).attachments || [];
  }

  getAttachment(actorId: string, id: string, attachmentId: string) {
    const attachment = (this.findOwned(actorId, id).attachments || []).find(
      (a) => a.attachment_id === attachmentId,
    );
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  // Flattened, newest-first activity across every issue assigned to this member -
  // progress updates, technical notes, attachments, messages and verification
  // events - so the dashboard can show a single "Recent Updates" timeline.
  getRecentUpdates(actorId: string, limit = 10) {
    const updates: any[] = [];

    this.myIssues(actorId).forEach((t) => {
      const ref = { ticket_id: t.ticket_id, title: t.title, priority: t.priority, status: t.status };

      (t.progress_log || []).forEach((p) =>
        updates.push({ ...ref, kind: 'PROGRESS', actor: p.author, timestamp: p.timestamp, message: `Progress updated ${p.from}% → ${p.to}%${p.note ? ': ' + p.note : ''}` }),
      );
      (t.internal_notes || []).forEach((n) =>
        updates.push({ ...ref, kind: 'NOTE', actor: n.author, timestamp: n.timestamp, message: n.message }),
      );
      (t.attachments || []).forEach((a) =>
        updates.push({ ...ref, kind: 'ATTACHMENT', actor: a.uploaded_by_name, timestamp: a.uploaded_at, message: `Uploaded ${a.kind === 'LOG' ? 'log' : a.kind === 'SCREENSHOT' ? 'screenshot' : 'file'} ${a.file_name}` }),
      );
      (t.comments || []).forEach((c) =>
        updates.push({ ...ref, kind: 'COMMENT', actor: c.author, timestamp: c.timestamp, message: c.message }),
      );
      if (t.submitted_for_verification_at) {
        updates.push({ ...ref, kind: 'VERIFICATION', actor: null, timestamp: t.submitted_for_verification_at, message: 'Sent to the Platform Admin for verification' });
      }
      if (t.verified_at) {
        updates.push({
          ...ref, kind: 'VERIFICATION', actor: t.verified_by_name, timestamp: t.verified_at,
          message: t.verification_status === 'REJECTED'
            ? `Verification rejected${t.verification_note ? ': ' + t.verification_note : ''}`
            : 'Verified by the Platform Admin',
        });
      }
    });

    return updates
      .filter((u) => u.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getStats(actorId: string) {
    const issues = this.myIssues(actorId);
    const today = new Date().toISOString().split('T')[0];

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    issues.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    const resolvedIssues = issues.filter((t) => t.resolved_date);
    const avgResolutionDays = resolvedIssues.length
      ? Math.round(
          (resolvedIssues.reduce(
            (sum, t) => sum + (new Date(t.resolved_date).getTime() - new Date(t.created_date).getTime()),
            0,
          ) / resolvedIssues.length) / (1000 * 60 * 60 * 24) * 10,
        ) / 10
      : 0;

    const active = issues.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    const avgProgress = active.length
      ? Math.round(active.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / active.length)
      : 0;

    return {
      assigned_issues: issues.length,
      open_issues: issues.filter((t) => t.status === 'OPEN').length,
      in_progress_issues: issues.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved_today: issues.filter((t) => t.resolved_date === today).length,
      high_priority_issues: issues.filter(
        (t) => (t.priority === 'High' || t.priority === 'Critical') && OPEN_STATUSES.includes(t.status),
      ).length,
      pending_verification: issues.filter((t) => t.verification_status === 'PENDING_VERIFICATION').length,
      verification_rejected: issues.filter((t) => t.verification_status === 'REJECTED').length,
      resolved_total: issues.filter((t) => TERMINAL_STATUSES.includes(t.status)).length,
      active_issues: active.length,
      avg_progress: avgProgress,
      avg_resolution_days: avgResolutionDays,
      by_status: byStatus,
      by_priority: byPriority,
      work_progress: this.getWorkProgress(actorId, 7),
    };
  }

  // Daily counts for the work progress chart: how many issues this member closed
  // out each day, and how much activity (progress updates, notes, uploads) they
  // logged. Both series are derived from real timestamps, never synthesised.
  getWorkProgress(actorId: string, days = 7) {
    const issues = this.myIssues(actorId);
    const series: { date: string; label: string; resolved: number; updates: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      series.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        resolved: 0,
        updates: 0,
      });
    }

    const bucket = (timestamp: string) => {
      if (!timestamp) return null;
      const key = new Date(timestamp).toISOString().split('T')[0];
      return series.find((s) => s.date === key) || null;
    };

    issues.forEach((t) => {
      const resolvedBucket = series.find((s) => s.date === t.resolved_date);
      if (resolvedBucket) resolvedBucket.resolved += 1;

      (t.progress_log || []).forEach((p) => { const b = bucket(p.timestamp); if (b) b.updates += 1; });
      (t.internal_notes || []).forEach((n) => { const b = bucket(n.timestamp); if (b) b.updates += 1; });
      (t.attachments || []).forEach((a) => { const b = bucket(a.uploaded_at); if (b) b.updates += 1; });
    });

    return series;
  }

  // --- Writes ---------------------------------------------------------------

  updateStatus(actorId: string, id: string, dto: UpdateIssueStatusDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    if (TERMINAL_STATUSES.includes(ticket.status) && ticket.verification_status === 'VERIFIED') {
      throw new BadRequestException('This issue has been verified by the Platform Admin and can no longer be reopened.');
    }

    const previousStatus = ticket.status;
    ticket.status = dto.status;
    ticket.resolved_date = null;
    // Reopening after a resolution withdraws the pending verification request.
    if (ticket.verification_status === 'PENDING_VERIFICATION') {
      ticket.verification_status = null;
      ticket.submitted_for_verification_at = null;
    }
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue status changed',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} status changed from ${previousStatus} to ${dto.status}.`,
    });

    return this.enrich(ticket);
  }

  updateProgress(actorId: string, id: string, dto: UpdateProgressDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    if (TERMINAL_STATUSES.includes(ticket.status)) {
      throw new BadRequestException('Progress cannot be changed on a resolved or closed issue.');
    }

    const from = ticket.progress_percentage || 0;
    ticket.progress_percentage = dto.progress_percentage;
    ticket.progress_log.push({
      author_id: actor.emp_id,
      author: actor.emp_name,
      from,
      to: dto.progress_percentage,
      note: dto.note || null,
      timestamp: new Date().toISOString(),
    });
    // Recording progress on an untouched issue implicitly starts work on it.
    if (ticket.status === 'OPEN' && dto.progress_percentage > 0) ticket.status = 'IN_PROGRESS';
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue progress updated',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} progress ${from}% -> ${dto.progress_percentage}%.${dto.note ? ' ' + dto.note : ''}`,
    });

    return this.enrich(ticket);
  }

  addWorkNote(actorId: string, id: string, dto: AddWorkNoteDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    ticket.internal_notes.push({
      author: actor.emp_name,
      author_id: actor.emp_id,
      message: dto.message,
      timestamp: new Date().toISOString(),
    });
    this.touch(ticket);
    return this.enrich(ticket);
  }

  addComment(actorId: string, id: string, dto: AddIssueCommentDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    ticket.comments.push({
      author: actor.emp_name,
      message: dto.message,
      timestamp: new Date().toISOString(),
    });
    this.touch(ticket);
    this.notifyPlatformAdmin(ticket, `${actor.emp_name} commented on technical issue ${ticket.ticket_id}: ${dto.message}`);
    return this.enrich(ticket);
  }

  uploadAttachment(actorId: string, id: string, dto: UploadAttachmentDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);

    // Type and size come from the file itself, not from what the client declares.
    const extension = extensionOf(dto.file_name);
    if (!ATTACHMENT_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${ATTACHMENT_EXTENSIONS.join(', ')}.`);
    }
    const bytes = Buffer.from(dto.data_url.slice(dto.data_url.indexOf(',') + 1), 'base64');
    if (bytes.length === 0) throw new BadRequestException('The uploaded file is empty.');
    if (bytes.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException('Attachments must be 5 MB or smaller.');
    if (dto.file_size !== undefined && dto.file_size !== null && dto.file_size !== bytes.length) {
      throw new BadRequestException('The file size does not match the uploaded contents.');
    }
    if (!contentMatchesExtension(bytes, extension)) {
      throw new BadRequestException(`The file contents do not match its ${extension} extension.`);
    }
    const fileType = CANONICAL_MIME[extension];

    const attachment = {
      attachment_id: 'ATT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      file_name: dto.file_name,
      file_type: fileType,
      file_size: bytes.length,
      kind: dto.kind || (fileType.startsWith('image/') ? 'SCREENSHOT' : extension === '.log' ? 'LOG' : 'OTHER'),
      description: dto.description || null,
      uploaded_by: actor.emp_id,
      uploaded_by_name: actor.emp_name,
      uploaded_at: new Date().toISOString(),
      // Re-encoded with the verified type so a forged data: prefix is never served back.
      data_url: `data:${fileType};base64,${bytes.toString('base64')}`,
    };
    ticket.attachments.push(attachment);
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue attachment uploaded',
      company_id: ticket.company_id,
      details: `${attachment.file_name} attached to ${ticket.ticket_id}.`,
    });

    const { data_url, ...meta } = attachment;
    return meta;
  }

  deleteAttachment(actorId: string, id: string, attachmentId: string, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    const index = ticket.attachments.findIndex((a) => a.attachment_id === attachmentId);
    if (index === -1) throw new NotFoundException('Attachment not found');
    // A member may only remove uploads they made themselves.
    if (ticket.attachments[index].uploaded_by !== actor.emp_id) {
      throw new ForbiddenException('You can only remove attachments you uploaded.');
    }
    const [removed] = ticket.attachments.splice(index, 1);
    this.touch(ticket);
    return { removed: removed.attachment_id };
  }

  resolve(actorId: string, id: string, dto: ResolveIssueDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    if (TERMINAL_STATUSES.includes(ticket.status)) {
      throw new BadRequestException('This issue is already resolved.');
    }

    ticket.status = 'RESOLVED';
    ticket.progress_percentage = 100;
    ticket.resolved_date = new Date().toISOString().split('T')[0];
    ticket.resolution_notes = dto.resolution_notes;
    // Resolving clears a previous rejection so the issue can be re-submitted.
    ticket.verification_status = null;
    ticket.verification_note = null;
    ticket.comments.push({
      author: actor.emp_name,
      message: dto.resolution_notes,
      timestamp: new Date().toISOString(),
    });
    ticket.progress_log.push({
      author_id: actor.emp_id,
      author: actor.emp_name,
      from: ticket.progress_log.length ? ticket.progress_log[ticket.progress_log.length - 1].to : 0,
      to: 100,
      note: 'Marked as resolved.',
      timestamp: new Date().toISOString(),
    });
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue resolved',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} marked as resolved by ${actor.emp_name}.`,
    });
    this.notifyPlatformAdmin(ticket, `${actor.emp_name} resolved technical issue ${ticket.ticket_id} (${ticket.title}).`);

    return this.enrich(ticket);
  }

  // Hands the finished issue back to the Platform Admin. The Technical Member
  // cannot close a ticket permanently - only the Platform Admin can, after
  // verifying the work.
  submitForVerification(actorId: string, id: string, dto: SubmitForVerificationDto, actor: Actor) {
    const ticket = this.findOwned(actorId, id);
    if (ticket.status !== 'RESOLVED') {
      throw new BadRequestException('Mark the issue as resolved before sending it for verification.');
    }
    if (ticket.verification_status === 'PENDING_VERIFICATION') {
      throw new BadRequestException('This issue is already awaiting Platform Admin verification.');
    }
    if (ticket.verification_status === 'VERIFIED') {
      throw new BadRequestException('This issue has already been verified.');
    }

    ticket.verification_status = 'PENDING_VERIFICATION';
    ticket.verification_note = null;
    ticket.submitted_for_verification_at = new Date().toISOString();
    if (dto.note) {
      ticket.comments.push({
        author: actor.emp_name,
        message: dto.note,
        timestamp: new Date().toISOString(),
      });
    }
    this.touch(ticket);

    this.dataStore.logActivity({
      user_id: actor.emp_id,
      user_name: actor.emp_name,
      role: actor.role,
      action: 'Technical issue sent for verification',
      company_id: ticket.company_id,
      details: `${ticket.ticket_id} sent to the Platform Admin for verification.`,
    });
    this.notifyPlatformAdmin(
      ticket,
      `Technical issue ${ticket.ticket_id} (${ticket.title}) is resolved and awaiting your verification.${dto.note ? ' ' + dto.note : ''}`,
      'warning',
    );

    return this.enrich(ticket);
  }
}
