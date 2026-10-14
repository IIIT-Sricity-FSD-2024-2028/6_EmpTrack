// Leave endpoints (converted from the original js/store.js).
import api from './api';

export function getLeavesForUser(empId) {
  return api.get(`/leaves/user/${empId}`);
}

/** leaveData: { empId, leave_type, days, start_date, end_date, reason } */
export function createLeave(leaveData) {
  return api.post('/leaves', leaveData);
}
