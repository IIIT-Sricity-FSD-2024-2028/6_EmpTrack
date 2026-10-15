# EmpTrack form validation audit

Every form in the React frontend, the rules applied to each field, the NestJS endpoint and DTO that re-check the same rules on the server, and where each is tested.

## How validation works

| Layer | Where | What it does |
|---|---|---|
| Field rules (frontend) | `front-end/src/utils/validation.js` | Rule builders: `text`, `personName`, `email`, `phone`, `strongPassword`, `passwordInput`, `matches`, `differsFrom`, `oneOf`, `number`, `date`, `dateTime`, `time`, `notBefore`, `file`, `list`. Same limits and messages as the backend. |
| Form schemas | `front-end/src/validation/formSchemas.js` | One schema per form (listed below). |
| Form behaviour | `front-end/src/hooks/useFormValidation.js` | Errors appear after blur or a submit attempt and update as the user types. Submit focuses the first invalid field. Backend `errors` are shown on their field until it changes. `validateFields` covers panels where each button submits different fields. |
| Field UI | `components/common/Input.jsx`, `components/common/FieldError.jsx`, `components/sa-common/saForm.jsx` (`Field`) | `*` marker plus `aria-required`, `aria-invalid`, `aria-describedby`. Each message has an icon as well as colour and `role="alert"`. Forms use `noValidate`, so browser popups never replace the field messages. |
| Field rules (backend) | `back-end/src/common/validation/validators.ts`, `enums.ts` | Decorators: `TextField`, `PersonNameField`, `EmailField`, `PhoneField`, `StrongPasswordField`, `PasswordInputField`, `IdField`, `DateField`, `DateTimeField`, `TimeField`, `EnumField`, `NumberField`, `NumericField`, `BooleanField`, `TextListField`, `NotBeforeField`. All trim text and reject control characters. Messages never echo the submitted value. |
| ValidationPipe | `createValidationPipe()` (used by `main.ts` and both e2e suites) | `whitelist` strips undeclared fields (no mass assignment). 400 responses carry `message` (as before) plus `errors: { field: [messages] }`, passed through by `HttpExceptionFilter`. |
| File content | `back-end/src/common/utils/file-signature.util.ts` | Both upload paths check that the bytes match the extension (PNG/JPEG/GIF/WebP/PDF/DOC/DOCX signatures; text has no binary bytes). The browser MIME type and file name are never trusted alone. |

### Shared rules

| Kind | Rule |
|---|---|
| Required text | Trimmed; whitespace-only counts as empty. |
| Person names | 2–100 chars. Letters of any script plus combining marks, spaces, `.` `'` `’` `-` `(` `)`. Digits and markup are rejected. Examples accepted: `Śrīnivās O'Neil-Kumar`, `அருண் குமார்`, `Rinku Singh (TL)`. |
| Email | Max 254; one `@`, a dotted domain, no spaces. The backend uses class-validator `IsEmail`. Uniqueness is checked server-side, case-insensitively. |
| Phone | Digits with optional leading `+`, spaces, `-`, `()`; 7–15 digits. A number written with `+91` must be a 10-digit mobile starting 6–9. Numbers without a country code are accepted in any national format. |
| New password | Existing policy: 8+ chars with upper, lower, digit and one of `@$!%*?&`; max 64 (bcrypt reads only 72 bytes). Login and current-password fields only check presence. |
| Numbers | Rejects `""`, `12abc`, `1e5`, `NaN`, `Infinity`; integer vs decimal and decimal places enforced per field. |
| Dates | Real calendar dates (`2026-02-30` rejected). Past/future limits only where the business already had them (task and issue deadlines). |
| Optional vs partial | Backend `optional: true` accepts missing / `null` / `""`. `optional: 'partial'` (PATCH) accepts a missing field but validates a sent value, so a mandatory field can't be blanked with `""`. |

## Forms

46 forms with field validation, plus search and filter inputs (length cap only) and toggle-only or select-only forms (no free input; values come from fixed options).

Legend: **S** = schema test (`formSchemas.test.js`), **C** = component test (`forms.test.jsx`), **E** = backend e2e (`back-end/test/validation.e2e-spec.ts`).

### Shared / authentication

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 1 | Login | `pages/public/Login.jsx` | email: required, email · password: required | `POST /auth/login` · `LoginDto` | S, E |
| 2 | Change password (Platform Admin, Support Member profiles) | `components/platform/ChangePasswordCard.jsx` | current: required · next: strong, ≠ current · confirm: matches next | `PATCH /employees/:id/password` · `UpdatePasswordDto` | S, C, E |
| 3 | Change password (Super Admin, Technical Member profiles) | `components/sa-common/PasswordCard.jsx` | same as #2 | same | S, E |
| 4 | Calendar add event | `components/calendar/Calendar.jsx` | title 2–80 · time HH:mm optional · type PERSONAL/MEETING · description ≤1000 | `POST /calendar/events` · `CreateEventDto` (also `CreateCompanyEventDto`: roles ⊂ known roles, `CreateHolidayDto`) | S, E |

### Employee

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 5 | Leave request | `pages/employee/LeaveRequest.jsx` | type CASUAL/SICK/UNPAID · start, end: valid dates, end ≥ start · reason 3–500 | `POST /leaves` · `CreateLeaveDto` (+ existing overlap check) | S, C, E |
| 6 | Raise issue | `pages/employee/RaiseIssue.jsx` | type ∈ list · priority Low/Medium/High · related task ∈ own active tasks (optional) · title 3–150 · description 10–2000 · attachments optional, ≤5 files, ≤10 MB, allowed types | `POST /issues` · `CreateIssueDto` (+ related task must be the caller's) | S, E |
| 7 | Update task progress | `pages/employee/UpdateTask.jsx` | progress 0–100 integer · status ∈ statuses, consistent with progress · hours 0.5–24 · notes ≤1000 | `PATCH /tasks/:id` · `UpdateTaskDto` | S, E |
| 8 | Log work | `pages/employee/WorkLogs.jsx` | task ∈ own tasks · start/end valid date-times, end > start, 1–24 whole hours · description 5–1000 | `POST /worklogs` · `CreateWorkLogDto` | S, E |
| 9 | Change password | `pages/employee/EmployeeProfile.jsx` | as #2 | `PATCH /employees/:id/password` | S, E |

### Team Lead

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 10 | Create & assign task | `pages/teamlead/Tasks.jsx` | assignee ∈ team · title 3–150 · est. hours 0.5–1000 (1 dp) · deadline valid, not past · priority · description ≤2000 | `POST /tasks` · `CreateTaskDto` (+ active assignee, not self, deadline not past) | S, E |
| 11 | Edit task | `pages/teamlead/Tasks.jsx` | as #10, deadline may be past, status ∈ statuses | `PATCH /tasks/:id` · `UpdateTaskDto` | S, E |
| 12 | Assign issue | `pages/teamlead/AssignIssue.jsx` | issue ∈ open issues · type 2–100 · team ∈ teams · assignee required for own team · priority · deadline not past · notes 10–2000 | `PATCH /issues/:id` · `UpdateIssueDto` | S, E |
| 13 | Resolve issue | `pages/teamlead/ResolveIssue.jsx` | issue · resolution type ∈ list · hours 0.5–200 · root cause / actions 10–2000 · preventive ≤2000 · evidence ≤20 files, ≤5 MB, allowed types | `PATCH /issues/:id` · `IssueResolutionDto` (nested) | S, E |
| 14 | Escalate to HR | `pages/teamlead/EscalateToHR.jsx` | category · priority · employee ∈ team unless personal · title 5–150 · description 20–1800 | `POST /escalations` · `CreateEscalationDto` | S, E |
| 15 | Escalation actions (warn / extend / reassign) | `pages/teamlead/Escalations.jsx` | message 10–500 · new deadline not past and after current · member ∈ team | `POST /notifications` · `CreateNotificationDto` (link must be an in-app path); `PATCH /tasks/:id` | S, E |
| 16 | Reject leave | `pages/teamlead/Leave.jsx` | reason 5–500 | `PATCH /leaves/:id/status` · `UpdateLeaveStatusDto` (reason optional, 5–500 when sent: dashboards' one-click reject sends none) | S, E |
| 17 | Change password | `pages/teamlead/Profile.jsx` | as #2 | `PATCH /employees/:id/password` | S, E |
| 18 | Edit profile (saved in browser) | `pages/teamlead/Profile.jsx` | phone optional, valid · address 5–200 optional · experience ≤50 · skills ≤30 × 50 chars | none (local storage) | S |

### Company Admin

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 19 | Create team | `pages/company-admin/CaEmployeeManagement.jsx` | team name 2–60 | `POST /teams` · `CreateTeamDto` | S, E |
| 20 | Assign Team Lead | same | name · email · phone · password · confirm | `POST /teams/:id/lead` · `CreateTeamLeadDto` | S, E |
| 21 | Add employee | same | name · email · phone · password · confirm · department ∈ list · team ∈ teams with a lead | `POST /employees` · `CreateEmployeeDto` | S, E |
| 22 | Inline employee edit | same | name · email · phone · department · status ACTIVE/INACTIVE | `PATCH /employees/:id` · `UpdateEmployeeDto` (partial; role/companyId/password stripped) | S, E |
| 23 | Raise issue to Platform Admin | `pages/company-admin/CaRaiseIssue.jsx` | priority ∈ LOW..CRITICAL · category 2–100 optional · title 5–150 · description 10–2000 | `POST /company/tickets` · `RaiseTicketDto` | S, E |

The Company Admin profile reuses `pages/hr/HrProfile.jsx` (#27).

### HR

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 24 | General settings | `pages/hr/HrSettings.jsx` | company name 2–120 · hours/day 1–24 int · days/week 1–7 int | none (browser) | S |
| 25 | Attendance settings | same | min progress 1–100 int · late threshold 0–240 int | none (browser) | S |
| 26 | Email settings | same | SMTP host name · port 1–65535 · from email · from name 2–100 | none (browser) | S |
| 27 | Change password | `pages/hr/HrProfile.jsx` | as #2 (eye toggle now keyboard-operable) | `PATCH /employees/:id/password` | S, E |

### Platform Admin

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 28 | Create Company Admin | `pages/platform-admin/MyCompanies.jsx` | account fields · company ∈ own companies · status | `POST /companies/:id/admins` · `CreateCompanyAdminDto` | S, E |
| 29 | Add / edit Support or Technical member | `pages/platform-admin/components/TeamMembersPage.jsx` | name · email · phone (required on add; blank on edit leaves it unchanged) · specialization ≤100 | `POST/PATCH /support-team`, `/technical-team` · `CreateTeamMemberDto`, `UpdateTeamMemberDto` | S, C, E |
| 30 | Ticket panel (assign / reassign / verify / rework / comment) | `pages/platform-admin/components/PlatformTicketsPage.jsx` | assignee ∈ members · reason 5–500 · rework note 5–500 · comment ≤2000 | `PATCH /support-tickets/:id/*`, `/technical-issues/:id/*` · `AssignTicketDto`, `ReassignTicketDto`, `RejectResolutionDto`, `AddTicketCommentDto`… | S, E |

### Super Admin

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 31 | Create company | `pages/super-admin/SaCompanies.jsx` | company name 2–120 · email · phone · industry 2–100 · address 5–300 · plan ∈ active plans · status · admin name/email/phone/password/confirm · Platform Admin ∈ active | `POST /companies` · `CreateCompanyDto` (+ plan/admin exist, email unused) | S, E |
| 32 | Edit company | same | company fields | `PATCH /companies/:id` · `UpdateCompanyDto` (partial; plan must exist) | S, E |
| 33 | Create Company Admin | same | account fields · company | `POST /companies/:id/admins` | S, E |
| 34 | Reassign Platform Admin | same | admin ∈ active admins | `PATCH /companies/:id/reassign` · `ReassignPlatformAdminDto` | S, E |
| 35 | Create Platform Admin | `pages/super-admin/SaPlatformAdmins.jsx` | account fields · status | `POST /platform-admins` · `CreatePlatformAdminDto` | S, E |
| 36 | Edit Platform Admin | same | name · email · phone optional | `PATCH /platform-admins/:id` · `UpdatePlatformAdminDto` | S, E |
| 37–38 | Create / edit plan | `pages/super-admin/SaSubscriptions.jsx` | name 2–60 · price 0–1,000,000 (2 dp) · billing MONTHLY/ANNUAL · max employees 1–1,000,000 int optional · features ≤30 × 100 chars | `POST/PATCH /subscriptions` · `CreatePlanDto`, `UpdatePlanDto`; status `UpdatePlanStatusDto` | S, E |
| 39 | Raise critical escalation | `pages/super-admin/SaEscalations.jsx` | company ∈ companies · category · priority · team · description ≤2000 | `POST /critical-escalations` · `CreateCriticalEscalationDto` (+ company exists) | S, E |
| 40 | Escalation detail (comment / note) | same | comment 1–1000 · note ≤1000 | `/critical-escalations/:id/*` · `AddCommentDto`, `EscalateDto`, `ResolveEscalationDto`, `AssignEscalationDto`, `UpdatePriorityDto` | S, E |
| 41 | Platform configuration | `pages/super-admin/SaSettings.jsx` | name 2–60 · support email · currency 3-letter code · timezone valid IANA | `PATCH /platform-settings` · `UpdatePlatformSettingsDto` (was `any`) | S, E |
| 42 | Security settings | same | password min length 8–32 · session 5–1440 · invite expiry 1–720 | same (nested `SecuritySettingsDto`) | S, E |
| 43 | Analytics custom range | `pages/super-admin/SaAnalytics.jsx` | from required, to ≥ from | `GET /analytics/*` · `AnalyticsRangeQueryDto` | S, E |
| 44 | Revenue date filter | `pages/super-admin/SaRevenue.jsx` | to ≥ from (client-side table filter) | none | S |

### Support Member and Technical Member

| # | Form | Frontend | Fields → rules | Endpoint / DTO | Tests |
|---|---|---|---|---|---|
| 45 | Support ticket modal | `pages/support-member/components/SupportTicketModal.jsx` | status ∈ editable · priority · category ∈ configured or current · response ≤2000 · internal note ≤2000 · escalation note ≤1000 · resolve note ≤2000 / reopen reason ≤500 · attachment (not uploaded) pdf/jpg/png/docx ≤10 MB | `/support-member/tickets/:id/*` · `ChangeTicketStatusDto`, `ChangeTicketPriorityDto`, `ChangeTicketCategoryDto` (+ configured-category check), `AddTicketCommentDto`, `AddInternalNoteDto`, `ResolveTicketDto`, `ReopenTicketDto`, `EscalateTo*Dto` | S, E |
| 46 | Technical issue detail | `pages/technical-member/components/useIssueDetail.jsx` | status OPEN/IN_PROGRESS · progress 0–100 · progress note ≤1000 · resolution 10–2000 · verification note ≤1000 · message / note ≤2000 · attachment required, png/jpg/gif/webp/txt/log ≤5 MB | `/technical-member/issues/:id/*` · `UpdateIssueStatusDto`, `UpdateProgressDto`, `ResolveIssueDto`, `UploadAttachmentDto` (+ server-side extension, decoded size and content check; stored type comes from the server) | S, E |

### Inputs without a form schema

| Input | Treatment |
|---|---|
| Search boxes (shared `SearchBar`, `SearchInput`, `SaFilterBar`; HR, Company Admin and Technical lists) | `maxLength` 100. They only filter lists. |
| Status / priority / role filter selects, TL Reports selects, HR notification / security toggles, SA notification toggles | Fixed options with defaults. The backend validates the values it receives (e.g. `NotificationSettingsDto` booleans). |
| Payments date range (Platform Admin) | Already constrained with `min` / `max`. |
| Attendance check-in / check-out | Buttons only; backend `mode` enum. |
| Multipart `/uploads/:category` | Category whitelist, extension + MIME + size (existing) and now file content. |

## Backend endpoints

All 76 body-accepting endpoints validate through DTOs; the one that took `any` (`PATCH /platform-settings`) now has a DTO. Query parameters are validated on `/analytics/*` (range, from/to), `/calendar/*` (year, month) and `/technical-member/work-progress|recent-updates` (days, limit). Route parameters are looked up in the data store, so unknown IDs return 404.

### Business rules added or fixed on the server

- Unknown subscription plan on company update → 400.
- Unknown company on critical-escalation create → 400.
- Issue `related_task` must be one of the caller's tasks → 400.
- Ticket category must be configured, or unchanged → 400.
- Profile edits of Platform Admins, Support/Technical members and Company Admins were saved as `name` (never shown) instead of `emp_name`. They are now stored correctly, and checked for duplicate emails.
- Email uniqueness checks on every create path are now case-insensitive, matching login.
- Technical attachments: type from the extension and the real bytes (forged MIME types are ignored), declared size must equal the decoded size, and stored data is re-encoded with the verified type.
- Notification links must be in-app paths (`javascript:` and off-site URLs rejected).
- `PATCH /platform-settings` can no longer add arbitrary keys or rewrite `role_permissions`. Partial nested updates keep sibling values.

## Tests

| Suite | Count | What |
|---|---|---|
| `front-end/src/utils/validation.test.js` | rules | Empty and whitespace-only values; length boundaries; control characters; international names; email, phone and `+91` formats; password policy and confirmation; malformed numbers, ranges and decimals; impossible dates, past dates, ranges; enums; file type, size, count and empty files; lists. |
| `front-end/src/validation/formSchemas.test.js` | every form | A valid submission passes; each invalid variant fails on its field; a final check that every exported schema is covered. |
| `front-end/src/validation/forms.test.jsx` | Leave request, Change password, Team member | No errors before interaction; blur validation; errors clear when fixed; first invalid field focused; no API call when invalid; values kept; trimmed payload; double submit blocked; backend field errors mapped onto the field; non-field errors shown; `aria-required` / `aria-invalid` / `aria-describedby`; passwords never echoed. |
| `back-end/test/validation.e2e-spec.ts` | 127 | ~110 invalid-field cases across all modules (each must answer 400, name the field, and leave the data store byte-for-byte unchanged); business-rule and reference cases; malformed query parameters; unauthenticated and wrong-role requests; mass-assignment stripping; accepted boundary values (100-char name, 150-char title, same-day leave, price 0, progress 0/100, 24-hour log, real PNG upload, partial settings update). |
| `back-end/src/common/validation/validators.spec.ts` | helpers | Phone, name, date, date-time and time-zone rules; file signatures. |
