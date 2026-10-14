// Attendance endpoints (converted from the original js/store.js).
import api from './api';

export function getAttendanceForUser(empId) {
  return api.get(`/attendance/user/${empId}`);
}

/** mode: 'OFFICE' | 'REMOTE'; checkInTime: 'HH:mm' */
export function markAttendance(empId, checkInTime, mode = 'OFFICE') {
  return api.post('/attendance/check-in', { empId, checkInTime, mode });
}

export function markCheckOut(empId) {
  return api.post('/attendance/check-out', { empId });
}
