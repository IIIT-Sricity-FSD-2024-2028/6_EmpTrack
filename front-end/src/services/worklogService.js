// Work log endpoints (converted from the original js/store.js).
import api from './api';

export function getWorkLogsForUser(empId) {
  return api.get(`/worklogs/user/${empId}`);
}

/** logData: { emp_id, task_id, task_title, hours_spent, start_time, end_time, description } */
export function createWorkLog(logData) {
  return api.post('/worklogs', logData);
}
