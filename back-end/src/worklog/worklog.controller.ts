import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { WorkLogService } from './worklog.service';
import { CreateWorkLogDto } from './dto/worklog.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('WorkLogs')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('worklogs')
@UseGuards(RolesGuard)
export class WorkLogController {
  constructor(private readonly worklogService: WorkLogService) {}

  @ApiOperation({ summary: 'Get work logs for a given user' })
  @Get('user/:empId')
  getWorkLogsForUser(@Param('empId') empId: string) {
    return this.worklogService.getWorkLogsForUser(empId);
  }

  @Post()
  createWorkLog(@Body() createDto: CreateWorkLogDto) {
    return this.worklogService.createWorkLog(createDto);
  }
}

