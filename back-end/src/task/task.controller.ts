import { Controller, Get, Param, Post, Patch, Body, UseGuards, Query } from '@nestjs/common';
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
  @Roles('TEAMLEAD', 'HR', 'ADMIN')
  getAllTasksForManager(@Query('managerId') managerId: string) {
    if (managerId) {
      return this.taskService.getAllTasksForManager(managerId);
    }
    return [];
  }

  @Get('user/:empId')
  getTasksForUser(@Param('empId') empId: string) {
    return this.taskService.getTasksForUser(empId);
  }

  @Post()
  @Roles('TEAMLEAD', 'ADMIN')
  createTask(@Body() createDto: CreateTaskDto) {
    return this.taskService.createTask(createDto);
  }

  @Patch(':id')
  updateTask(
    @Param('id') taskId: string,
    @Body() updateDto: UpdateTaskDto
  ) {
    return this.taskService.updateTask(taskId, updateDto);
  }
}
