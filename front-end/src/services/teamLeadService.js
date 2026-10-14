// Team Lead data access (converted from the original js/store.js).
//
// With VITE_API_URL set, calls go to the backend endpoints the original
// team lead pages used. With it empty (the default; same rule as mock login
// in authService) they read/write an isolated demo dataset in localStorage
// (seeded from teamLeadDemo.js) so the portal works without a backend.
//
// The backend has no endpoints for reports, the team lead's escalation
// history, profile edits or deleting tasks. Reports, escalation history and
// profile edits are always stored locally (LOCAL_KEY); deleting a task is
// only possible in demo mode.
import config from '../config/config';
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';
import { getAttendanceForUser } from './attendanceService';
import { getUserById, updateUserPassword } from './employeeService';
import { getNotificationsForUser } from './notificationService';
import { createDemoData } from './teamLeadDemo';
import { getWorkLogsForUser } from './worklogService';

export const IS_DEMO = !config.apiUrl;

const DEMO_KEY = 'empTrack_tl_demo_v2'; // bump when the seed shape changes
const LOCAL_KEY = 'empTrack_tl_local';
const DEMO_PASSWORD = 'Password@123'; // authService mock password

const today = () => new Date().toISOString().split('T')[0];
const randomId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

// ---- demo store ----
function demoDb() {
  const tlId = readStorage(STORAGE_KEYS.AUTH)?.user?.emp_id || 'TL001';
  let db = readStorage(DEMO_KEY);
  if (db?.tlId !== tlId) {
    db = createDemoData(tlId);
    writeStorage(DEMO_KEY, db);
  }
  return db;
}

function demoWrite(mutate) {
  const db = demoDb();
  const result = mutate(db);
  writeStorage(DEMO_KEY, db);
  return result;
}

function demoPatch(collection, idKey, id, changes) {
  return demoWrite((db) => {
    const item = db[collection].find((x) => x[idKey] === id);
    if (!item) throw new Error(`${id} was not found.`);
    return Object.assign(item, changes);
  });
}

// ---- local-only store (features without a backend endpoint) ----
const local = () => ({ escalations: [], drafts: [], reports: [], profile: {}, ...readStorage(LOCAL_KEY, {}) });
function localWrite(mutate) {
  const data = local();
  const result = mutate(data);
  writeStorage(LOCAL_KEY, data);
  return result;
}

// ---- team ----
/** Direct reports. The backend resolves "my team" from the caller's actor id. */
export async function getTeamMembers() {
  return IS_DEMO ? demoDb().members : api.get('/employees');
}

export async function getTeams() {
  return IS_DEMO ? demoDb().teams : api.get('/teams');
}

// ---- tasks ----
/** Team tasks with `hours_worked` (summed from work logs when using the API). */
export async function getTeamTasks(tlId) {
  if (IS_DEMO) return demoDb().tasks;
  const [tasks, members] = await Promise.all([api.get('/tasks', { params: { managerId: tlId } }), getTeamMembers()]);
  const logs = (await Promise.all(members.map((m) => getWorkLogsForUser(m.emp_id).catch(() => [])))).flat();
  return tasks.map((t) => ({
    ...t,
    hours_worked: logs.filter((l) => l.task_id === t.task_id).reduce((sum, l) => sum + Number(l.hours_spent || 0), 0),
  }));
}

/** taskData: { task_title, task_description, assigned_to, est_hours, deadline, priority } */
export async function createTask(taskData) {
  if (!IS_DEMO) return api.post('/tasks', taskData);
  return demoWrite((db) => {
    let taskId;
    do taskId = randomId('T'); while (db.tasks.some((t) => t.task_id === taskId));
    const task = {
      task_id: taskId,
      status: 'NOT_STARTED',
      progress_percentage: 0,
      hours_worked: 0,
      created_at: today(),
      ...taskData,
    };
    db.tasks.unshift(task);
    return task;
  });
}

// Fields the backend's UpdateTaskDto accepts; its ValidationPipe (whitelist)
// silently drops anything else, so we never send what it would ignore.
const TASK_UPDATE_FIELDS = ['status', 'progress_percentage', 'task_title', 'priority', 'deadline', 'task_description'];

/** False when a backend is configured: it cannot change a task's assignee or estimate. */
export const CAN_EDIT_ASSIGNMENT = IS_DEMO;

export async function updateTask(taskId, changes) {
  const patch = { ...changes };
  if (patch.status === 'COMPLETED') patch.progress_percentage = 100;
  if (!IS_DEMO) {
    return api.patch(`/tasks/${taskId}`, Object.fromEntries(Object.entries(patch).filter(([k]) => TASK_UPDATE_FIELDS.includes(k))));
  }
  const current = demoDb().tasks.find((t) => t.task_id === taskId);
  if (patch.status && patch.status !== current?.status) patch.completed_at = patch.status === 'COMPLETED' ? today() : null;
  return demoPatch('tasks', 'task_id', taskId, patch);
}

export async function reassignTask(taskId, empId) {
  if (!CAN_EDIT_ASSIGNMENT) throw new Error('The backend cannot reassign tasks yet (UpdateTaskDto has no assigned_to).');
  return demoPatch('tasks', 'task_id', taskId, { assigned_to: empId });
}

export async function deleteTask(taskId) {
  if (!IS_DEMO) throw new Error('The backend has no endpoint for deleting tasks yet.');
  demoWrite((db) => {
    db.tasks = db.tasks.filter((t) => t.task_id !== taskId);
  });
}

// ---- leave ----
export async function getTeamLeaves(memberIds) {
  const leaves = IS_DEMO ? demoDb().leaves : await api.get('/leaves');
  return leaves.filter((l) => memberIds.includes(l.emp_id));
}

/** status: 'APPROVED' | 'REJECTED' */
export async function updateLeaveStatus(leaveId, status, approverId, rejectReason) {
  const body = { status, approved_by_id: approverId };
  if (rejectReason) body.reject_reason = rejectReason;
  if (!IS_DEMO) return api.patch(`/leaves/${leaveId}/status`, body);
  return demoPatch('leaves', 'leave_id', leaveId, body);
}

// ---- attendance ----
export async function getTeamAttendance(members) {
  if (IS_DEMO) return demoDb().attendance;
  const lists = await Promise.all(members.map((m) => getAttendanceForUser(m.emp_id).catch(() => [])));
  return lists.flatMap((list, i) => list.map((a) => ({ emp_id: members[i].emp_id, ...a })));
}

// ---- issues ----
export async function getIssues() {
  return IS_DEMO ? demoDb().issues : api.get('/issues');
}

export async function updateIssue(issueId, changes) {
  if (!IS_DEMO) return api.patch(`/issues/${issueId}`, changes);
  return demoPatch('issues', 'issue_id', issueId, changes);
}

// ---- notifications ----
export async function getNotifications(empId) {
  return IS_DEMO ? demoDb().notifications : getNotificationsForUser(empId);
}

/** Sends a notification to a team member (e.g. a performance warning). */
export async function sendNotification(empId, message, type = 'warning') {
  if (!IS_DEMO) return api.post('/notifications', { employee_id: empId, message, type });
  return demoWrite((db) => db.sentNotifications.push({ employee_id: empId, message, type, timestamp: new Date().toISOString() }));
}

// ---- HR escalations ----
/** Records the escalation with the backend (when available) and in the local history. */
export async function escalateToHr(escalation, actorId) {
  const record = { id: `HR-ESC-${Date.now().toString().slice(-6)}`, status: 'Pending', date: today(), ...escalation };
  if (!IS_DEMO) {
    await api.post('/escalations', {
      reference_type: escalation.category,
      reference_id: escalation.relatedEmployeeId || record.id,
      escalated_from: actorId,
      escalated_to: 'HR',
      escalation_reason: `${escalation.title}: ${escalation.description}`,
    });
  }
  return localWrite((data) => {
    data.escalations.unshift(record);
    return record;
  });
}

export async function getHrEscalations() {
  return local().escalations;
}

export async function saveEscalationDraft(draft) {
  localWrite((data) => {
    data.drafts = [{ ...draft, savedAt: new Date().toISOString() }];
  });
}

export function getEscalationDraft() {
  return local().drafts[0] ?? null;
}

export function clearEscalationDraft() {
  localWrite((data) => {
    data.drafts = [];
  });
}

// ---- reports (no backend endpoint; generated in the browser) ----
export async function getReports() {
  return local().reports;
}

export async function saveReport(report) {
  return localWrite((data) => {
    const record = { id: `RPT-${String(data.reports.length + 1).padStart(3, '0')}`, date: today(), ...report };
    data.reports.unshift(record);
    return record;
  });
}

// ---- profile ----
/** Account from the backend (or demo) merged with local profile edits. */
export async function getProfile(sessionUser) {
  const base = IS_DEMO ? { ...sessionUser, ...demoDb().profile } : await getUserById(sessionUser.emp_id);
  return { ...base, ...local().profile };
}

/** No self-service profile endpoint exists, so edits are kept in this browser. */
export async function saveProfile(changes) {
  return localWrite((data) => {
    data.profile = { ...data.profile, ...changes };
    return data.profile;
  });
}

/** Resolves { saved: boolean }; in demo mode the password is checked but cannot be changed. */
export async function changePassword(empId, currentPassword, newPassword, confirmPassword) {
  if (!IS_DEMO) {
    await updateUserPassword(empId, currentPassword, newPassword, confirmPassword);
    return { saved: true };
  }
  if (currentPassword !== DEMO_PASSWORD) throw new Error('Current password is incorrect.');
  return { saved: false };
}
