import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { TechnicalMemberService } from './technical-member.service';
import {
  UpdateIssueStatusDto,
  UpdateProgressDto,
  AddWorkNoteDto,
  AddIssueCommentDto,
  UploadAttachmentDto,
  ResolveIssueDto,
  SubmitForVerificationDto,
  WorkProgressQueryDto,
  RecentUpdatesQueryDto,
} from './dto/technical-member.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// Technical Members receive technical issues from their Platform Admin, work them,
// and hand them back for verification. Every route here is scoped to issues
// assigned to the acting member - there is deliberately no endpoint to create
// companies or users, assign or reassign issues, or close a ticket permanently.
@ApiTags('Technical Member: Technical Dashboard')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('technical-member')
@UseGuards(RolesGuard)
@Roles('TECHNICAL_MEMBER')
export class TechnicalMemberController {
  constructor(private readonly service: TechnicalMemberService) {}

  private actor(actorId: string, actorName: string) {
    return { emp_id: actorId, emp_name: actorName || 'Technical Member', role: 'TECHNICAL_MEMBER' };
  }

  @ApiOperation({ summary: 'Dashboard summary cards, status/priority distribution and 7-day work progress' })
  @Get('stats')
  getStats(@Headers('x-actor-id') actorId: string) {
    return this.service.getStats(actorId);
  }

  @ApiOperation({ summary: 'Daily work progress series for the dashboard chart' })
  @Get('work-progress')
  getWorkProgress(@Headers('x-actor-id') actorId: string, @Query() { days }: WorkProgressQueryDto) {
    return this.service.getWorkProgress(actorId, Number(days) > 0 ? Number(days) : 7);
  }

  @ApiOperation({ summary: 'Recent activity across all issues assigned to this member' })
  @Get('recent-updates')
  getRecentUpdates(@Headers('x-actor-id') actorId: string, @Query() { limit }: RecentUpdatesQueryDto) {
    return this.service.getRecentUpdates(actorId, Number(limit) > 0 ? Number(limit) : 10);
  }

  @ApiOperation({ summary: 'Technical issues assigned to this member (scope=active for the working queue, scope=history for completed work)' })
  @Get('issues')
  getIssues(
    @Headers('x-actor-id') actorId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('scope') scope?: string,
  ) {
    return this.service.getIssues(actorId, { status, priority, search, scope });
  }

  @Get('issues/:id')
  getIssueById(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.service.getIssueById(actorId, id);
  }

  @ApiOperation({ summary: 'Move an issue between Open and In Progress (escalation and closure stay with the Platform Admin)' })
  @Patch('issues/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIssueStatusDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.updateStatus(actorId, id, dto, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Record investigation progress (0-100%) with an optional note' })
  @Patch('issues/:id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.updateProgress(actorId, id, dto, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Technical notes - internal investigation detail, never shown to the company' })
  @Get('issues/:id/notes')
  getWorkNotes(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.service.getWorkNotes(actorId, id);
  }

  @Post('issues/:id/notes')
  addWorkNote(
    @Param('id') id: string,
    @Body() dto: AddWorkNoteDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.addWorkNote(actorId, id, dto, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Post a message on the issue thread visible to the Platform Admin' })
  @Post('issues/:id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: AddIssueCommentDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.addComment(actorId, id, dto, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Attachment metadata for an issue (contents excluded)' })
  @Get('issues/:id/attachments')
  getAttachments(@Param('id') id: string, @Headers('x-actor-id') actorId: string) {
    return this.service.getAttachments(actorId, id);
  }

  @ApiOperation({ summary: 'Fetch a single attachment including its contents' })
  @Get('issues/:id/attachments/:attachmentId')
  getAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Headers('x-actor-id') actorId: string,
  ) {
    return this.service.getAttachment(actorId, id, attachmentId);
  }

  @ApiOperation({ summary: 'Upload a screenshot or log file (base64 data URL, 5 MB max)' })
  @Post('issues/:id/attachments')
  uploadAttachment(
    @Param('id') id: string,
    @Body() dto: UploadAttachmentDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.uploadAttachment(actorId, id, dto, this.actor(actorId, actorName));
  }

  @Delete('issues/:id/attachments/:attachmentId')
  deleteAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.deleteAttachment(actorId, id, attachmentId, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Mark an issue as resolved with resolution notes' })
  @Patch('issues/:id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.resolve(actorId, id, dto, this.actor(actorId, actorName));
  }

  @ApiOperation({ summary: 'Send the completed issue back to the Platform Admin for verification' })
  @Patch('issues/:id/submit-verification')
  submitForVerification(
    @Param('id') id: string,
    @Body() dto: SubmitForVerificationDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.service.submitForVerification(actorId, id, dto, this.actor(actorId, actorName));
  }
}
