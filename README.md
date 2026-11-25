# EmpTrack – Attendance, Leave and Work Allocation Platform

## About the Project

EmpTrack is a web application developed to manage employee attendance, leave requests, task allocation, and work progress in one place. It has three types of users: Employee, Team Lead, and HR. Each user can access the features related to their role.

The main aim of this project is to make employee management easier and reduce the need for manual work.

## Features

### Employee

- Mark check-in and check-out.
- View attendance history.
- Apply for leave and check leave status.
- View assigned tasks and update task progress.
- Submit work logs.
- Raise issues and track their status.
- View notifications and profile details.

### Team Lead

- View team details and overall progress.
- Create, assign, and update tasks.
- Monitor employee work and task completion.
- View team attendance.
- Approve or reject leave requests.
- Manage employee-raised issues.
- Assign and resolve issues.
- Escalate issues to HR.
- View team performance and generate reports.
- Manage notifications and profile details.

### HR

- Manage attendance and leave policies.
- Review complaints and escalated issues.
- Take action on employee-related issues.
- Generate attendance, leave, and work reports.

## Technologies Used

**Frontend**

- React
- JavaScript
- HTML
- CSS
- React Router
- Vite

**Backend**

- Node.js
- NestJS
- TypeScript

**Database**

- Database schema and SQL files are maintained in the `Database/` directory.

Tools

- Git and GitHub
- npm
- Vitest and React Testing Library
- Jest

## Project Structure

```text
6_EmpTrack/
├── Database/
│   └── Dbschema.sql
├── front-end/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── employee/
│   │   │   └── teamlead/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── css/
│   ├── js/
│   ├── package.json
│   └── vite.config.js
├── back-end/
│   ├── src/
│   ├── test/
│   └── package.json
├── package.json
└── README.md
```

This is the main project structure. The repository may contain additional files and folders.

## How to Run the Project

### Requirements

Install Node.js (version 22.5.0 or later for the backend), npm, and Git before starting.

Check the installation:

```bash
node -v
npm -v
git --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/IIIT-Sricity-FSD-2024-2028/6_EmpTrack.git
cd 6_EmpTrack
```

If you have already cloned the repository, open the existing folder.

### 2. Install Backend Dependencies

From the project root:

```bash
npm run install:back-end
```

Alternatively:

```bash
cd back-end
npm install
```

### 3. Configure the Backend

Create or update the `.env` file inside `back-end/` with the environment variables required by the application.

Configure the database connection and initialize the database according to the project's setup instructions.

Do not upload passwords or other secret values to GitHub.

### 4. Install Frontend Dependencies

Open a terminal in the project root:

```bash
cd front-end
npm install
```

### 5. Start the Frontend

From the `front-end/` directory:

```bash
npm run dev
```

Open the URL displayed in the terminal. It is usually:

`http://localhost:5173`

### 6. Start the Backend

Open another terminal in the project root:

```bash
cd back-end
npm run start:dev
```

Keep both servers running while using the application.

The frontend, backend, and database must be configured correctly for the application to work.

## Application Workflow

1. Open the landing page.
2. Navigate to the login page.
3. Log in using an authorized account.
4. The user is directed to the appropriate dashboard based on their role.
5. Use the available features to manage attendance, leave, tasks, issues, or reports.

The available options depend on the user's role and the implemented functionality.

## Team Lead Portal Routes

The following routes are based on the assigned Team Lead pages. Check the actual route configuration in the project and update any paths that differ.

| Page                   | Route                              |
| ---------------------- | ---------------------------------- |
| Dashboard              | `/teamlead/dashboard`              |
| Tasks                  | `/teamlead/tasks`                  |
| Work Monitoring        | `/teamlead/work-monitoring`        |
| Team Performance       | `/teamlead/team-performance`       |
| Attendance             | `/teamlead/attendance`             |
| Leave                  | `/teamlead/leave`                  |
| Issue Management       | `/teamlead/issue-management`       |
| Employee-Raised Issues | `/teamlead/employee-raised-issues` |
| Assign Issue           | `/teamlead/assign-issue`           |
| Resolve Issue          | `/teamlead/resolve-issue`          |
| Escalations            | `/teamlead/escalations`            |
| Escalate to HR         | `/teamlead/escalate-to-hr`         |
| Reports                | `/teamlead/reports`                |
| Notifications          | `/teamlead/notifications`          |
| Profile                | `/teamlead/profile`                |

## Testing

### Frontend

Run the frontend tests:

```bash
cd front-end
npm test
```

Create a production build:

```bash
npm run build
```

### Backend

Run the backend tests:

```bash
cd back-end
npm test
```

Build the backend:

```bash
npm run build
```

Run end-to-end tests if the project has the required configuration:

```bash
npm run test:e2e
```

These commands depend on the scripts configured in the respective `package.json` files.

### Manual Testing

- Check whether the landing page and login page load.
- Test login and role-based navigation.
- Check the Team Lead dashboard and its pages.
- Test task creation and assignment.
- Check attendance and leave management.
- Test issue assignment and escalation.
- Check notifications and profile functionality.
- Verify that API requests and database operations work correctly.

## Individual Contribution – Member 1

**Role: Team Lead Portal Development**

My responsibility in this project is the development of the Team Lead portal. It allows team leads to manage team tasks, monitor employee progress, review attendance and leave requests, handle issues, and generate reports.

### Pages Assigned to Me

| S. No. | Page                              | Description                                                                               |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------------- |
| 1      | `teamlead/dashboard`              | Displays team progress, task distribution, pending leave approvals, and escalated issues. |
| 2      | `teamlead/tasks`                  | Used to create, assign, and update tasks.                                                 |
| 3      | `teamlead/work-monitoring`        | Displays employee tasks, working hours, and progress.                                     |
| 4      | `teamlead/team-performance`       | Shows employee performance and task completion statistics.                                |
| 5      | `teamlead/attendance`             | Displays team attendance and check-in/check-out details.                                  |
| 6      | `teamlead/leave`                  | Allows team leads to review, approve, or reject leave requests.                           |
| 7      | `teamlead/issue-management`       | Displays team issues and supports filtering by status and priority.                       |
| 8      | `teamlead/employee-raised-issues` | Displays employee-raised issues and related escalations.                                  |
| 9      | `teamlead/assign-issue`           | Allows issues to be assigned to team members with priorities and deadlines.               |
| 10     | `teamlead/resolve-issue`          | Records issue resolutions, root causes, and corrective actions.                           |
| 11     | `teamlead/escalations`            | Displays escalated tasks and supports related actions.                                    |
| 12     | `teamlead/escalate-to-hr`         | Allows employee-related issues to be forwarded to HR.                                     |
| 13     | `teamlead/reports`                | Provides access to team reports.                                                          |
| 14     | `teamlead/notifications`          | Displays notifications and supports unread filtering.                                     |
| 15     | `teamlead/profile`                | Displays and allows updates to personal and work information.                             |

### Main Responsibilities

- Developing the Team Lead dashboard.
- Working on task allocation and progress monitoring.
- Developing attendance and leave management pages.
- Working on issue assignment, resolution, and escalation.
- Developing team performance and reporting interfaces.
- Implementing notification and profile features.
- Connecting the pages with the shared application layout and API layer where required.

### Files Related to My Contribution

The main assigned directories are:

- `front-end/js/views/teamlead/` – JavaScript page logic.
- `front-end/css/views/teamlead/` – Styles for Team Lead pages.
- `Figma Design/` – Design references.

For the React version, relevant files may also be present in:

- `front-end/src/pages/teamlead/`
- `front-end/src/App.jsx` or the file containing route definitions.
- Related shared components, API services, and CSS file

