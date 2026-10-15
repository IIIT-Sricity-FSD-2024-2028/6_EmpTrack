import { Controller, Get, Param, Post, Body, Patch, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { IssueService } from './issue.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Issues')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('issues')
@UseGuards(RolesGuard)
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @ApiOperation({ summary: 'Get issues for a given user' })
  @Get('user/:empId')
  getIssuesForUser(@Param('empId') empId: string, @Headers('x-actor-id') actorId: string) {
    return this.issueService.getIssuesForUser(empId, actorId);
  }

  @ApiOperation({ summary: 'Get the issues the caller may see (own company / own team / own)' })
  @Get()
  getAllIssues(@Headers('x-actor-id') actorId: string) {
    return this.issueService.getAllIssues(actorId);
  }

  @Post()
  createIssue(@Body() createDto: CreateIssueDto, @Headers('x-actor-id') actorId: string) {
    return this.issueService.createIssue(createDto, actorId);
  }

  @ApiOperation({ summary: 'Update issue (Team Lead / HR / Company Admin of the raiser)' })
  @Patch(':id')
  updateIssue(@Param('id') id: string, @Body() updateData: UpdateIssueDto, @Headers('x-actor-id') actorId: string) {
    return this.issueService.updateIssue(id, updateData, actorId);
  }
}
