import { Controller, Get, Param, Post, Patch, Body, UseGuards, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Tasks')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('tasks')
@UseGuards(RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: 'Get tasks by manager' })
  @Get()
  @Roles('TEAMLEAD', 'HR', 'COMPANY_ADMIN')
  getAllTasksForManager(
    @Query('managerId') managerId: string,
    @Headers('role') role: string,
    @Headers('x-actor-id') actorId: string,
  ) {
    // A Team Lead only ever gets their own team - the query param can't be spoofed.
    if (role === 'TEAMLEAD') managerId = actorId;
    if (managerId) {
      return this.taskService.getAllTasksForManager(managerId, actorId);
    }
    return [];
  }

  @Get('user/:empId')
  getTasksForUser(@Param('empId') empId: string, @Headers('x-actor-id') actorId: string) {
    return this.taskService.getTasksForUser(empId, actorId);
  }

  @Post()
  @Roles('TEAMLEAD', 'COMPANY_ADMIN')
  createTask(@Body() createDto: CreateTaskDto, @Headers('x-actor-id') actorId: string) {
    return this.taskService.createTask(createDto, actorId);
  }

  @ApiOperation({ summary: 'Update a task - the assignee may change status/progress, their Team Lead or Company Admin anything' })
  @Patch(':id')
  updateTask(
    @Param('id') taskId: string,
    @Body() updateDto: UpdateTaskDto,
    @Headers('x-actor-id') actorId: string,
  ) {
    return this.taskService.updateTask(taskId, updateDto, actorId);
  }
}
