import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { getTeamAttendance, getTeamTasks } from './teamLeadService';
import { getAttendanceForUser } from './attendanceService';
import { getWorkLogsForUser } from './worklogService';

vi.mock('../config/config', () => ({ default: { apiUrl: 'http://api.test' } }));
vi.mock('./api', () => ({ default: { get: vi.fn() } }));
vi.mock('./attendanceService', () => ({ getAttendanceForUser: vi.fn() }));
vi.mock('./worklogService', () => ({ getWorkLogsForUser: vi.fn() }));

describe('Team Lead aggregate data requests', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not calculate task hours from a partial work log response', async () => {
    api.get.mockImplementation((path) => path === '/tasks'
      ? Promise.resolve([{ task_id: 'T1' }])
      : Promise.resolve([{ emp_id: 'EM001' }, { emp_id: 'EM002' }]));
    getWorkLogsForUser.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Work log service unavailable'));

    await expect(getTeamTasks('TL001')).rejects.toThrow('Work log service unavailable');
  });

  it('does not treat a failed team attendance request as an absent employee', async () => {
    const failure = new Error('Attendance service unavailable');
    getAttendanceForUser.mockResolvedValueOnce([]).mockRejectedValueOnce(failure);

    await expect(getTeamAttendance([{ emp_id: 'EM001' }, { emp_id: 'EM002' }])).rejects.toBe(failure);
  });
});
