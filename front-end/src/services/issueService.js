// Issue endpoints (converted from the original js/store.js).
// Issue records are read from and written to the backend; the browser does not
// create a local substitute when the request fails.
import api from './api';

export function getIssuesForUser(empId) {
  return api.get(`/issues/user/${empId}`);
}

/** issueData: { emp_id, type, priority, related_task, title, description } */
export async function createIssue(issueData) {
  return api.post('/issues', issueData);
}
