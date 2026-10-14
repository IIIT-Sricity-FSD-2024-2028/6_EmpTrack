// Task endpoints (converted from the original js/store.js).
// Like the original, tasks created while the API was unreachable are kept in
// localStorage ('empTrack_local_tasks') and merged into the results.
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';

const LOCAL_TASKS_KEY = 'empTrack_local_tasks';

export async function getTasksForUser(empId) {
  let serverTasks = [];
  try {
    serverTasks = await api.get(`/tasks/user/${empId}`);
  } catch {
    // Fall back to locally stored tasks only.
  }
  const localTasks = readStorage(LOCAL_TASKS_KEY, []);
  const userLocal = localTasks.filter((t) => t.assigned_to === empId || t.employee_name === empId);
  return [...serverTasks, ...userLocal];
}

/** PATCH /tasks/:id with { status, progress_percentage? }. */
export async function updateTaskStatus(taskId, status, percentage) {
  const body = { status };
  if (percentage !== undefined) body.progress_percentage = percentage;

  let serverError = null;
  try {
    await api.patch(`/tasks/${taskId}`, body);
  } catch (error) {
    serverError = error;
  }

  const localTasks = readStorage(LOCAL_TASKS_KEY, []);
  const localIndex = localTasks.findIndex((t) => t.task_id === taskId);
  if (localIndex !== -1) {
    localTasks[localIndex] = { ...localTasks[localIndex], ...body };
    writeStorage(LOCAL_TASKS_KEY, localTasks);
    return localTasks[localIndex];
  }

  if (serverError) throw serverError;
  return true;
}
