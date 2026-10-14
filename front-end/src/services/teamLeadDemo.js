// DEMO DATA ONLY - not a backend.
// Seed dataset for the Team Lead portal while VITE_API_URL is empty (the same
// rule that makes authService fall back to mock users). teamLeadService.js
// copies it into localStorage on first use; with a backend configured this
// file is never read. Names/records follow the original front-end's
// hardcoded team lead mock data. Dates are relative to today so the
// dashboards always look current.

const MEMBERS = [
  ['EM001', 'John Doe', 'john.doe@emptrack.com'],
  ['EM002', 'Sarah Johnson', 'sarah.johnson@emptrack.com'],
  ['EM003', 'Mike Davis', 'mike.davis@emptrack.com'],
  ['EM004', 'Emma Wilson', 'emma.wilson@emptrack.com'],
  ['EM005', 'James Brown', 'james.brown@emptrack.com'],
  ['EM006', 'Lisa Anderson', 'lisa.anderson@emptrack.com'],
];

function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export function createDemoData(tlId) {
  const members = MEMBERS.map(([emp_id, emp_name, email]) => ({
    emp_id,
    emp_name,
    email,
    status: emp_id === 'EM006' ? 'ON_LEAVE' : 'ACTIVE',
    manager_id: tlId,
    team_id: 'TEAM-ENG-A',
  }));

  // Open work: [id, member, title, description, est, worked, progress, status, deadline offset, priority]
  const active = [
    ['T-045', 'EM001', 'Payment Gateway', 'Integrate Stripe checkout', 40, 30, 75, 'IN_PROGRESS', 5, 'High'],
    ['T-046', 'EM002', 'Profile Enhancement', 'Add form validation', 24, 20, 82, 'IN_PROGRESS', 3, 'Medium'],
    ['T-019', 'EM003', 'Database Schema Design', 'Normalise reporting tables', 24, 14, 48, 'IN_PROGRESS', -2, 'High'],
    ['T-048', 'EM004', 'Mobile Design', 'Responsive UI for the dashboard', 48, 40, 88, 'IN_PROGRESS', 7, 'Medium'],
    ['T-023', 'EM005', 'Feature Implementation', 'Export module for reports', 56, 32, 39, 'IN_PROGRESS', -3, 'High'],
    ['T-034', 'EM001', 'Code Refactoring', 'Split legacy services', 24, 14, 42, 'IN_PROGRESS', 1, 'Low'],
    ['T-041', 'EM006', 'API Development', 'Leave balance endpoints', 40, 22, 35, 'IN_PROGRESS', -4, 'Medium'],
    ['T-050', 'EM002', 'Unit Tests', 'Cover the auth module', 16, 0, 0, 'NOT_STARTED', 10, 'Low'],
    ['T-051', 'EM005', 'Bug Triage', 'Sort the QA backlog', 8, 0, 0, 'NOT_STARTED', 6, 'Medium'],
  ].map(([task_id, assigned_to, task_title, task_description, est_hours, hours_worked, progress_percentage, status, dl, priority]) => ({
    task_id, assigned_to, task_title, task_description, est_hours, hours_worked, progress_percentage, status, priority,
    deadline: day(dl),
    created_at: day(dl - 14),
  }));

  // Six months of finished work so the performance charts have history.
  // James Brown (EM005) completes fewer tasks, so he lands in "Needs Support".
  const completed = [];
  for (let i = 0; i < 60; i += 1) {
    const member = MEMBERS[i % MEMBERS.length][0];
    if (member === 'EM005' && i % 18 !== 4) continue;
    const created = -(i * 3 + 4);
    const est = 8 + (i % 5) * 4;
    completed.push({
      task_id: `T-${100 + i}`, // above the open-task ids so keys never collide
      assigned_to: member,
      task_title: ['API Integration', 'Testing and QA', 'Security Audit', 'Documentation Update', 'UI Polish'][i % 5],
      task_description: 'Completed sprint task',
      est_hours: est,
      hours_worked: est - (i % 3),
      progress_percentage: 100,
      status: 'COMPLETED',
      priority: ['Low', 'Medium', 'High'][i % 3],
      created_at: day(created),
      deadline: day(created + 7),
      completed_at: day(created + 2 + (i % 4)),
    });
  }

  const attendance = [];
  for (let offset = -13; offset <= 0; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const [emp_id] of MEMBERS) {
      const absent =
        (emp_id === 'EM006' && offset >= -1) || // approved leave (see LV-003)
        (emp_id === 'EM005' && (offset === -2 || offset === -3)) || // no leave filed
        (emp_id === 'EM003' && offset === -6); // no leave filed
      attendance.push({
        emp_id,
        attendance_date: day(offset),
        status: absent ? 'ABSENT' : 'PRESENT',
        check_in_time: absent ? null : `09:${String(5 + MEMBERS.findIndex((m) => m[0] === emp_id) * 7).padStart(2, '0')}`,
        check_out_time: absent || offset === 0 ? null : '18:00',
        mode: emp_id === 'EM004' ? 'REMOTE' : 'OFFICE',
      });
    }
  }

  return {
    tlId,
    members,
    teams: [
      { team_id: 'TEAM-ENG-A', team_name: 'Engineering Alpha', team_lead_id: tlId },
      { team_id: 'TEAM-SUP', team_name: 'Tech Support', team_lead_id: null },
      { team_id: 'TEAM-OPS', team_name: 'DevOps Team', team_lead_id: null },
    ],
    tasks: [...active, ...completed],
    attendance,
    leaves: [
      { leave_id: 'LV-001', emp_id: 'EM002', leave_type: 'CASUAL', days: 3, start_date: day(9), end_date: day(11), reason: 'Family function out of town', status: 'PENDING', applied_date: day(-1) },
      { leave_id: 'LV-002', emp_id: 'EM003', leave_type: 'SICK', days: 1, start_date: day(1), end_date: day(1), reason: 'Doctor appointment', status: 'PENDING', applied_date: day(0) },
      { leave_id: 'LV-003', emp_id: 'EM006', leave_type: 'CASUAL', days: 4, start_date: day(-1), end_date: day(2), reason: 'Planned vacation', status: 'APPROVED', applied_date: day(-10) },
      { leave_id: 'LV-004', emp_id: 'EM001', leave_type: 'UNPAID', days: 1, start_date: day(-20), end_date: day(-20), reason: 'Personal errand', status: 'APPROVED', applied_date: day(-25) },
      { leave_id: 'LV-005', emp_id: 'EM005', leave_type: 'CASUAL', days: 2, start_date: day(14), end_date: day(15), reason: 'Short trip', status: 'PENDING', applied_date: day(-2) },
    ],
    issues: [
      { issue_id: 'ISS-102', emp_id: 'EM005', title: 'Need access to AWS Console', type: 'Access Request', priority: 'High', status: 'Pending', related_task: 'T-023', assigned_to: 'Unassigned', raised_date: day(-1), description: 'Deployment for the export module is blocked without console access.' },
      { issue_id: 'ISS-105', emp_id: 'EM006', title: 'Laptop overheating', type: 'Hardware', priority: 'Medium', status: 'In Progress', related_task: '', assigned_to: 'Tech Support', raised_date: day(-2), description: 'Laptop shuts down under build load.' },
      { issue_id: 'ISS-108', emp_id: 'EM002', title: 'Clarification on new leave policy', type: 'HR Query', priority: 'Low', status: 'Resolved', related_task: '', assigned_to: 'Demo Team Lead', raised_date: day(-6), resolved_date: day(-5), description: 'How many casual leaves carry over?' },
      { issue_id: 'ISS-111', emp_id: 'EM003', title: 'Conflict with teammate regarding API', type: 'Interpersonal', priority: 'High', status: 'Pending', related_task: 'T-019', assigned_to: 'Unassigned', raised_date: day(0), description: 'Disagreement on the schema contract is delaying work.' },
      { issue_id: 'ISS-114', emp_id: 'EM004', title: 'Extend deadline for UI task', type: 'Task Update', priority: 'Low', status: 'In Progress', related_task: 'T-048', assigned_to: 'Demo Team Lead', raised_date: day(-3), description: 'Design feedback added two extra screens.' },
      { issue_id: 'ISS-097', emp_id: 'EM001', title: 'Build pipeline failing intermittently', type: 'Technical', priority: 'Medium', status: 'Resolved', related_task: 'T-045', assigned_to: 'DevOps Team', raised_date: day(-12), resolved_date: day(-10), description: 'CI fails roughly one run in five.' },
    ],
    notifications: [
      { id: 'N-1', message: 'Sarah Johnson applied for 3 days of casual leave', type: 'info', timestamp: new Date(Date.now() - 2 * 3600e3).toISOString(), link: '/teamlead/leave' },
      { id: 'N-2', message: 'Task T-023 auto-escalated: 39% progress after 32h of 56h', type: 'error', timestamp: new Date(Date.now() - 5 * 3600e3).toISOString(), link: '/teamlead/escalations' },
      { id: 'N-3', message: 'James Brown raised a High priority issue: Need access to AWS Console', type: 'warning', timestamp: new Date(Date.now() - 26 * 3600e3).toISOString(), link: '/teamlead/issue-management' },
      { id: 'N-4', message: 'Emma Wilson completed task T-121 (Testing and QA)', type: 'info', timestamp: new Date(Date.now() - 50 * 3600e3).toISOString() },
      { id: 'N-5', message: 'Mike Davis was absent without an approved leave', type: 'warning', timestamp: new Date(Date.now() - 6 * 86400e3).toISOString(), link: '/teamlead/leave' },
    ],
    profile: {
      phone: '5552345678',
      address: '456 Leadership Ave, San Francisco',
      department: 'Engineering',
      position: 'Team Lead',
      reports_to: 'HR Manager',
      date_of_joining: '2023-03-10',
      experience: '6 years',
      skills: ['Team Management', 'React', 'TypeScript', 'System Design', 'Agile/Scrum', 'Mentoring', 'Project Planning', 'Conflict Resolution'],
    },
    sentNotifications: [],
  };
}
