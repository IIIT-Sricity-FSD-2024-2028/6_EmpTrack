import { Injectable, NotFoundException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly dataStore: MockDataService) {}

  getTasksForUser(empId: string) {
    return this.dataStore.getTasks().filter(t => t.assigned_to === empId);
  }

  getAllTasksForManager(managerId: string) {
    const teamIds = this.dataStore.getEmployees().filter(m => m.manager_id === managerId).map(m => m.emp_id);
    return this.dataStore.getTasks().filter(t => teamIds.includes(t.assigned_to));
  }

  createTask(createDto: CreateTaskDto) {
    const newTask = {
      task_id: 'TK' + Date.now(),
      ...createDto,
      status: 'NOT_STARTED',
      progress_percentage: 0,
      updated_date: new Date().toISOString().split('T')[0],
      warning_sent: false
    };
    this.dataStore.getTasks().push(newTask);
    return newTask;
  }

  updateTask(taskId: string, updateDto: UpdateTaskDto) {
    const task = this.dataStore.getTasks().find(t => t.task_id === taskId);
    if (!task) throw new NotFoundException('Task not found');

    Object.keys(updateDto).forEach(key => {
      if (updateDto[key] !== undefined) {
        task[key] = updateDto[key];
      }
    });
    task.updated_date = new Date().toISOString().split('T')[0];
    return task;
  }
}
