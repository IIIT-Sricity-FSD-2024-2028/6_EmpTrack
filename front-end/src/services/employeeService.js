// Employee account endpoints (converted from the original js/store.js).
import api from './api';

export function getUserById(empId) {
  return api.get(`/employees/${empId}`);
}

/** The backend verifies currentPassword and the strength rules. */
export function updateUserPassword(empId, currentPassword, newPassword, confirmPassword) {
  return api.patch(`/employees/${empId}/password`, { currentPassword, newPassword, confirmPassword });
}
