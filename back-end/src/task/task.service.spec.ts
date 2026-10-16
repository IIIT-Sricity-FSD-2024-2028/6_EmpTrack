import { BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { TaskService } from './task.service';

describe('TaskService persistence safety', () => {
  let store: MockDataService;
  let persistence: any;
  let service: TaskService;

  beforeEach(() => {
    store = new MockDataService();
    persistence = {
      seedTasks: jest.fn(),
      getTasks: () => store.getTasks(),
      getTaskByClientRequestId: jest.fn(() => null),
      createTask: jest.fn(() => { throw new Error('SQLite unavailable'); }),
      saveTask: jest.fn(() => { throw new Error('SQLite unavailable'); }),
      getIssues: () => [],
    };
    service = new TaskService(store, persistence);
  });

  it('does not add a task to memory when durable creation fails', () => {
    const before = store.getTasks().length;
    const deadline = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect(() => service.createTask({
      assigned_to: 'EM001', task_title: 'Persistence failure', priority: 'Medium', deadline,
    } as any, 'TL001')).toThrow('SQLite unavailable');
    expect(store.getTasks()).toHaveLength(before);
  });

  it('does not change task progress in memory when the durable update fails', () => {
    const task = store.getTasks().find((item) => item.task_id === 'TK001');
    expect(task).toBeDefined();
    const before = { status: task.status, progress_percentage: task.progress_percentage, updated_date: task.updated_date };

    expect(() => service.updateTask('TK001', { status: 'IN_PROGRESS', progress_percentage: 55 }, 'EM001'))
      .toThrow('SQLite unavailable');
    expect({ status: task.status, progress_percentage: task.progress_percentage, updated_date: task.updated_date }).toEqual(before);
  });

  it('rejects a status and progress combination inconsistent with the employee workflow', () => {
    expect(() => service.updateTask('TK001', { status: 'IN_PROGRESS', progress_percentage: 100 }, 'EM001'))
      .toThrow(BadRequestException);
    expect(persistence.saveTask).not.toHaveBeenCalled();
  });
});
