// Work log endpoints (converted from the original js/store.js).
import api from './api';

export function getWorkLogsForUser(empId) {
  return api.get(`/worklogs/user/${empId}`);
}

/** logData: { emp_id, task_id, task_title, hours_spent, start_time, end_time, description } */
export function createWorkLog(logData) {
  return api.post('/worklogs', logData);
}

export function getActiveWorkSession() {
  return api.get('/worklogs/timer/active');
}

export function startWorkSession(taskId) {
  return api.post('/worklogs/timer/start', { task_id: taskId });
}

export function stopWorkSession(sessionId) {
  return api.post(`/worklogs/timer/${encodeURIComponent(sessionId)}/stop`, {});
}

export function confirmWorkSession(sessionId, description) {
  return api.post(`/worklogs/timer/${encodeURIComponent(sessionId)}/confirm`, { description });
}
