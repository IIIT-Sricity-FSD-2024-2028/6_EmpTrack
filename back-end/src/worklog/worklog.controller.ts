import { Controller, Get, Param, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { WorkLogService } from './worklog.service';
import { ConfirmWorkSessionDto, CreateWorkLogDto, StartWorkSessionDto } from './dto/worklog.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('WorkLogs')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('worklogs')
@UseGuards(RolesGuard)
export class WorkLogController {
  constructor(private readonly worklogService: WorkLogService) {}

  @Get('timer/active')
  @Roles('EMPLOYEE')
  getActiveWorkSession(@Headers('x-actor-id') actorId: string) {
    return this.worklogService.getActiveWorkSession(actorId);
  }

  @Post('timer/start')
  @Roles('EMPLOYEE')
  startWorkSession(@Body() body: StartWorkSessionDto, @Headers('x-actor-id') actorId: string) {
    return this.worklogService.startWorkSession(body.task_id, actorId);
  }

  @Post('timer/:sessionId/stop')
  @Roles('EMPLOYEE')
  stopWorkSession(@Param('sessionId') sessionId: string, @Headers('x-actor-id') actorId: string) {
    return this.worklogService.stopWorkSession(sessionId, actorId);
  }

  @Post('timer/:sessionId/confirm')
  @Roles('EMPLOYEE')
  confirmWorkSession(@Param('sessionId') sessionId: string, @Body() body: ConfirmWorkSessionDto,
    @Headers('x-actor-id') actorId: string) {
    return this.worklogService.confirmWorkSession(sessionId, body.description, actorId);
  }

  @ApiOperation({ summary: 'Get work logs for a given user' })
  @Get('user/:empId')
  getWorkLogsForUser(@Param('empId') empId: string, @Headers('x-actor-id') actorId: string) {
    return this.worklogService.getWorkLogsForUser(empId, actorId);
  }

  @Post()
  createWorkLog(@Body() createDto: CreateWorkLogDto, @Headers('x-actor-id') actorId: string) {
    return this.worklogService.createWorkLog(createDto, actorId);
  }
}
