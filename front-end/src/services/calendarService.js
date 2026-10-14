// Calendar endpoints (converted from the original js/store.js).
// Events: { id, type, title, date: 'YYYY-MM-DD', endDate?, meta? }
import { ROLES } from '../utils/constants';
import api from './api';

const calParams = (requesterEmpId, year, month) => ({ requesterEmpId: requesterEmpId || '', year, month });

export function getMyCalendar(requesterEmpId, year, month) {
  return api.get('/calendar/my-calendar', { params: calParams(requesterEmpId, year, month) });
}

export function getTeamCalendar(requesterEmpId, year, month) {
  return api.get('/calendar/team-calendar', { params: calParams(requesterEmpId, year, month) });
}

export function getCompanyCalendar(requesterEmpId, year, month) {
  return api.get('/calendar/company-calendar', { params: calParams(requesterEmpId, year, month) });
}

/** eventData: { title, date, time?, type: 'PERSONAL'|'MEETING', description? } */
export function createEvent(requesterEmpId, eventData) {
  return api.post('/calendar/events', eventData, { params: { requesterEmpId } });
}

/** The calendar scope each role sees (employee: own, team lead: team, HR/admin: company). */
export function calendarFetcherFor(user) {
  if (user.role === ROLES.EMPLOYEE) return (y, m) => getMyCalendar(user.emp_id, y, m);
  if (user.role === ROLES.TEAM_LEAD) return (y, m) => getTeamCalendar(user.emp_id, y, m);
  return (y, m) => getCompanyCalendar(user.emp_id, y, m);
}
