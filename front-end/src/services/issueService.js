// Issue endpoints (converted from the original js/store.js).
// Like the original, a new issue is also kept in localStorage
// ('empTrack_local_issues') so it is not lost if the API is unreachable.
import { readStorage, writeStorage } from '../utils/helpers';
import api from './api';

const LOCAL_ISSUES_KEY = 'empTrack_local_issues';

export function getIssuesForUser(empId) {
  return api.get(`/issues/user/${empId}`);
}

/** issueData: { emp_id, type, priority, related_task, title, description } */
export async function createIssue(issueData) {
  const localIssues = readStorage(LOCAL_ISSUES_KEY, []);
  const newIssue = {
    issue_id: `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
    ...issueData,
    status: 'Pending',
    raised_date: new Date().toISOString().split('T')[0],
  };
  localIssues.push(newIssue);
  writeStorage(LOCAL_ISSUES_KEY, localIssues);

  try {
    return await api.post('/issues', issueData);
  } catch {
    return newIssue;
  }
}
