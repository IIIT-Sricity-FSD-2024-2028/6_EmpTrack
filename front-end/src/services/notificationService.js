// Notification endpoints (converted from the original js/store.js).
import api from './api';

/** Returns [{ id, message, type: 'info'|'warning'|'error', timestamp, link? }] */
export function getNotificationsForUser(empId) {
  return api.get(`/notifications/user/${empId}`);
}
