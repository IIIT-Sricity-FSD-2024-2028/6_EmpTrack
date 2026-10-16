import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { WorkLogService } from './worklog.service';

describe('WorkLogService timer', () => {
  let data: MockDataService;
  let persistence: any;
  let service: WorkLogService;
  let now: Date;

  beforeEach(() => {
    data = new MockDataService();
    persistence = {
      seedWorkLogs: jest.fn(), getWorkLogs: jest.fn(() => []),
      startWorkSession: jest.fn((row) => ({ ...row, status: 'ACTIVE' })),
      getOpenWorkSession: jest.fn(() => null),
      stopWorkSession: jest.fn((_employeeId, _sessionId, stopTime) => ({ status: 'STOPPED', stop_time: stopTime })),
      getWorkSession: jest.fn(), saveStoppedWorkSession: jest.fn((_employeeId, _sessionId, _description, log) => log),
    };
    service = new WorkLogService(data, persistence);
    now = new Date('2026-10-17T09:00:00.000Z');
    (service as any).now = () => new Date(now);
  });

  it('starts a session from server identity and the employee assigned task', () => {
    const session = service.startWorkSession('TK001', 'EM001');
    expect(persistence.startWorkSession).toHaveBeenCalledWith(expect.objectContaining({
      employee_id: 'EM001', task_id: 'TK001', task_title: expect.any(String), start_time: now.toISOString(),
    }));
    expect(session.status).toBe('ACTIVE');
  });

  it('rejects other employees tasks and non-employee callers', () => {
    expect(() => service.startWorkSession('TK002', 'EM001')).toThrow(ForbiddenException);
    expect(() => service.startWorkSession('TK001', 'TL001')).toThrow(ForbiddenException);
    expect(persistence.startWorkSession).not.toHaveBeenCalled();
  });

  it('uses server stop time and persists a calculated log without accepting client duration', () => {
    const session = {
      session_id: 'WS-1', employee_id: 'EM001', task_id: 'TK001', task_title: 'Task',
      start_time: '2026-10-17T09:00:00.000Z', stop_time: '2026-10-17T10:30:00.000Z',
      elapsed_ms: 90 * 60 * 1000, status: 'STOPPED',
    };
    persistence.getWorkSession.mockReturnValue(session);
    persistence.saveStoppedWorkSession.mockImplementation((_employeeId, _sessionId, _description, log) => log);
    now = new Date('2026-10-17T10:30:01.000Z');
    const log = service.confirmWorkSession('WS-1', 'Completed timer work.', 'EM001');
    expect(log).toMatchObject({ emp_id: 'EM001', task_id: 'TK001', hours_spent: 1.5, elapsed_ms: 90 * 60 * 1000 });
    expect(persistence.saveStoppedWorkSession).toHaveBeenCalledWith('EM001', 'WS-1', 'Completed timer work.', log);
  });

  it('does not confirm a running session', () => {
    persistence.getWorkSession.mockReturnValue({ session_id: 'WS-1', status: 'ACTIVE' });
    expect(() => service.confirmWorkSession('WS-1', 'Work completed.', 'EM001')).toThrow(BadRequestException);
    expect(persistence.saveStoppedWorkSession).not.toHaveBeenCalled();
  });
});
