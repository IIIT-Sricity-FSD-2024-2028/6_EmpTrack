import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { getAttendanceFor, getTasksFor } from './hrService';
import { getAttendanceForUser } from './attendanceService';

vi.mock('./api', () => ({ default: { get: vi.fn() } }));
vi.mock('./attendanceService', () => ({ getAttendanceForUser: vi.fn() }));

describe('HR aggregate data requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not turn a failed employee task request into an empty task list', async () => {
    const failure = new Error('Task service unavailable');
    api.get.mockResolvedValueOnce([{ task_id: 'T1' }]).mockRejectedValueOnce(failure);

    await expect(getTasksFor([{ emp_id: 'EM001' }, { emp_id: 'EM002' }])).rejects.toBe(failure);
  });

  it('does not turn a failed employee attendance request into an absent record', async () => {
    const failure = new Error('Attendance service unavailable');
    getAttendanceForUser.mockResolvedValueOnce([{ attendance_id: 'A1' }]).mockRejectedValueOnce(failure);

    await expect(getAttendanceFor([{ emp_id: 'EM001' }, { emp_id: 'EM002' }])).rejects.toBe(failure);
  });

  it('tags successful attendance rows with their employee id', async () => {
    getAttendanceForUser.mockResolvedValueOnce([{ attendance_id: 'A1' }]);

    await expect(getAttendanceFor([{ emp_id: 'EM001' }])).resolves.toEqual([
      { attendance_id: 'A1', emp_id: 'EM001' },
    ]);
  });
});
