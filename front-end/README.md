# EmpTrack Front-End Architecture

This directory (`front-end/`) contains the Single Page Application (SPA) for **EmpTrack**, created entirely using Vanilla HTML, CSS, and JavaScript without any boilerplate libraries or frameworks.

## Directory Structure and File Functionality

### 1. Root Files
- **`index.html`**: The main entry point for the entire application. It acts as the SPA shell, loading base styles and the `app.js` module. All dynamic views are injected into a main `<div id="app">` container here.
- **`README.md`**: This file, explaining the purpose and mechanics of the front-end structure.

### 2. Assets (`assets/`)
*Images, SVG icons, and any static media used throughout the application.*

### 3. Styles (`css/`)
*Vanilla CSS files broken down for modularity and separation of concerns.*
- **`variables.css`**: Contains CSS Custom Properties (Variables) defining the design system (primary colors, typography scales, spacing tokens) derived directly from the Figma designs.
- **`global.css`**: CSS resets and base element typography/layouts to establish a baseline standard across all browsers.
- **`layout.css`**: Styles for structural page elements like the `<nav>` Sidebar, Top Header, and the main grid structures.
- **`components.css`**: Reusable specific UI components such as `.btn`, `.card`, `.modal`, `.table`, and form `.input-groups`.
- **`views.css`**: Specific style overrides or unique layouts tailored for distinct pages (e.g., login screen background, dashboard grid placement).

### 4. JavaScript Engine (`js/`)
*All logic required for our Custom Vanilla SPA Router, State Management, and Data Handling.*

- **`app.js`**: The main controller. Listens to `#` URL hash changes (e.g., `/#dashboard`) to instantiate the router, checking user authorization constraints, and loading the correct view logic.
- **`store.js`**: Acts as an in-memory database and mock backend. Contains initial JSON objects representing Users, Attendance logs, Tasks, and Leave requests. Exposes CRUD (Create, Read, Update, Delete) methods used by the application views.
- **`auth.js`**: Manages the current user session. Contains functions like `login(email, pass)`, `logout()`, `getCurrentUser()`, and checks permissions (Super User vs Admin vs Employee).

#### Utilities (`js/utils/`)
- **`dom.js`**: Helper functions to manipulate the DOM, like `createElement`, `clearContainer`, and rendering repeating lists or tables safely.
- **`validate.js`**: Client-side validation logic. Checks form inputs for proper types, minimum lengths, and prevents invalid submissions from proceeding.

#### Components (`js/components/`)
- **`layout.js`**: JavaScript responsible for rendering the correct Header/Sidebar navigation based on whether the logged-in user is an HR, Team Lead, or Employee.
- **`common.js`**: Logic for triggering global UI elements like Toast notifications, Modals, and Loading Spinners.

#### Views (`js/views/`)
*Functions corresponding directly to screens/pages. Each file exports a `render()` function that injects HTML and adds event listeners specific to that view.*
- **`auth/`**: Contains scripts for rendering the Login, Signup, and Forgot Password landing pages.
- **`employee/`**: Contains scripts for the End-User portals (Employee Dashboard, Mark Attendance, Leave Requests, and Task Logs).
- **`teamlead/`**: Contains scripts for Admin operations (Team Dashboards, Leave Approvals, Assigning Tasks to team members).
- **`hr/`**: Contains scripts for Super User controls (System Settings, Policy Rules, Escalation Reports).

## Features

- **Dynamic Role-Based UI Rendering:** The navigation links, dashboard widgets, and available CRUD operations differ depending on whether the `user.role` is `employee`, `teamlead`, or `hr`.
- **No Page Reloads (SPA):** We use Vanilla JS hash routing to change URLs and fetch new injected DOM views cleanly.
- **Client-Side Form Validation:** Enforced rigorously to prevent submission of an invalid date for leave or a blank email.
- **Mock Data Persistence:** Using `localStorage` combined with `store.js` to fake a backend database, proving the real-time functionality of updating task boards and leave statuses.
