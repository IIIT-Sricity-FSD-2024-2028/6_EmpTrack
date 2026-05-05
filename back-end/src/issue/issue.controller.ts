import { Controller, Get, Param, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/issue.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Issues')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('issues')
@UseGuards(RolesGuard)
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @ApiOperation({ summary: 'Get issues for a given user' })
  @Get('user/:empId')
  getIssuesForUser(@Param('empId') empId: string) {
    return this.issueService.getIssuesForUser(empId);
  }

  @ApiOperation({ summary: 'Get all issues' })
  @Get()
  getAllIssues() {
    return this.issueService.getAllIssues();
  }

  @Post()
  createIssue(@Body() createDto: CreateIssueDto) {
    return this.issueService.createIssue(createDto);
  }

  @ApiOperation({ summary: 'Update issue' })
  @Patch(':id')
  updateIssue(@Param('id') id: string, @Body() updateData: any) {
    return this.issueService.updateIssue(id, updateData);
  }
}

