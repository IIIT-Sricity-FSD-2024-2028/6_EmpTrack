// Task endpoints (converted from the original js/store.js).
// Like the original, tasks created while the API was unreachable are kept in
// localStorage ('empTrack_local_tasks') and merged into the results.
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';
import config from '../config/config';

const LOCAL_TASKS_KEY = 'empTrack_local_tasks';
export const IS_TASK_DEMO = !config.apiUrl;

export async function getTasksForUser(empId) {
  if (!IS_TASK_DEMO) return api.get(`/tasks/user/${empId}`);
  const localTasks = readStorage(LOCAL_TASKS_KEY, []);
  const userLocal = localTasks.filter((t) => t.assigned_to === empId || t.employee_name === empId);
  return userLocal;
}

/** PATCH /tasks/:id with { status, progress_percentage? }. */
export async function updateTaskStatus(taskId, status, percentage) {
  const body = { status };
  if (percentage !== undefined) body.progress_percentage = percentage;

  if (!IS_TASK_DEMO) return api.patch(`/tasks/${taskId}`, body);

  const localTasks = readStorage(LOCAL_TASKS_KEY, []);
  const localIndex = localTasks.findIndex((t) => t.task_id === taskId);
  if (localIndex !== -1) {
    localTasks[localIndex] = { ...localTasks[localIndex], ...body };
    writeStorage(LOCAL_TASKS_KEY, localTasks);
    return localTasks[localIndex];
  }

  throw new Error('Task was not found in demo storage.');
}
