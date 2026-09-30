# SafeConnect: How It Works

This document explains every part of SafeConnect and how the pieces connect: the Express backend, the MySQL database and the React frontend. It is written for developers joining the project and for anyone who needs to explain the system.

For setup and deployment, see [README.md](README.md).

---

## Contents

1. [The Big Picture](#1-the-big-picture)
2. [How the Frontend Talks to the Backend](#2-how-the-frontend-talks-to-the-backend)
3. [Backend](#3-backend)
   - [3.1 Startup: `server.js`](#31-startup-serverjs)
   - [3.2 The request pipeline](#32-the-request-pipeline)
   - [3.3 Config](#33-config)
   - [3.4 Middleware](#34-middleware)
   - [3.5 Routes and endpoints](#35-routes-and-endpoints)
   - [3.6 Controllers](#36-controllers)
   - [3.7 Services](#37-services)
   - [3.8 Models](#38-models)
   - [3.9 Utils](#39-utils)
   - [3.10 Background work and in-memory state](#310-background-work-and-in-memory-state)
4. [Database](#4-database)
5. [End-to-End Flows](#5-end-to-end-flows)
6. [Frontend](#6-frontend)
   - [6.1 Entry point, routing and language](#61-entry-point-routing-and-language)
   - [6.2 `Services/api.js`](#62-servicesapijs)
   - [6.3 Pages](#63-pages)
   - [6.4 Landing components](#64-landing-components)
   - [6.5 Resident components](#65-resident-components)
   - [6.6 Admin components](#66-admin-components)
   - [6.7 Shared components](#67-shared-components)
   - [6.8 Styles](#68-styles)
7. [Browser Storage Keys](#7-browser-storage-keys)
8. [External Services](#8-external-services)

---

## 1. The Big Picture

SafeConnect has three layers:

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React single-page app                                          │
│    /           LandingPage   (public site, sign-in / sign-up)   │
│    /resident   ResidentPage  (report forms, My Reports, news)   │
│    /admin      AdminPage     (dashboard, reports, system tabs)  │
│                        │                                        │
│              src/Services/api.js  ← the only file using fetch() │
│                        │             for our own API            │
└────────────────────────┼────────────────────────────────────────┘
                         │ HTTPS, JSON, "Authorization: Bearer <JWT>"
┌────────────────────────▼────────── Express API (backend/) ──────┐
│  server.js → routes/ → middleware/ → controllers/               │
│                                         │                       │
│                         services/ (logic, email, exports)       │
│                                         │                       │
│                         models/ (SQL) → config/db.js (pool)     │
└────────────────────────┼────────────────────────────────────────┘
                         │ mysql2
┌────────────────────────▼────────────────────────────────────────┐
│  MySQL database "safeconnect"                                   │
└─────────────────────────────────────────────────────────────────┘
```

Key ideas:
- **One gateway on each side.** On the frontend, every call to our API goes through `src/Services/api.js`. On the backend, every SQL query lives in a `models/` class.
- **Stateless API.** The backend knows who you are from the JWT sent with each request. It keeps no login sessions. The few in-memory items (sign-up codes, admin "online" status) are listed in [3.10](#310-background-work-and-in-memory-state).
- **snake_case in, camelCase out.** MySQL columns use `snake_case`, such as `reporter_name`. `api.js` converts them to the `camelCase` fields the components read, such as `reporter`.
- **Polling, not push.** The admin panel refreshes its data every 30 seconds and the resident navbar checks for news and notifications every minute. There are no WebSockets.

---

## 2. How the Frontend Talks to the Backend

### Base URLs
`api.js` reads two build-time settings:
- `REACT_APP_API_BASE` (default `http://localhost:5000/api`) is used for every API call.
- `REACT_APP_ASSET_BASE` (default `http://localhost:5000`) is used to turn stored paths such as `/uploads/123.jpg` into full image URLs (`resolveAssetUrl()`).

### Authentication tokens
1. When sign-in succeeds, the backend returns `{ token, isAdmin, isSuperAdmin, user }`.
2. `setAuthToken(token, isAdmin)` saves the token in `localStorage`, under **`adminAuthToken`** for admins or **`authToken`** for residents. The two keys are separate so that an admin and a resident can be signed in in the same browser without replacing each other's session.
3. `getAuthToken()` picks the key based on the current URL: pages under `/admin` use the admin token, and every other page uses the resident token.
4. Each protected request sends `Authorization: Bearer <token>`, built by `authHeaders()`.

### Session expiry
Every call goes through `apiFetch()`. If the backend answers 401 or 403 with `"Invalid token."` or `"Access denied. No token provided."`, `apiFetch()`:
- clears the token for the current page, then
- dispatches a `safeconnect:session-expired` browser event.

The admin panel listens for this event in `useAdminAuth` and shows the sign-in box over the current screen, so work in progress (such as a half-written announcement) isn't lost.

### Response shapes
Most write endpoints answer `{ success: true|false, message? }`. List endpoints return a plain array of rows. `api.js` maps each row to the shape the UI expects, and returns `[]` if the response wasn't an array, so the UI shows "No results" instead of crashing.

### CORS
The backend accepts requests only from `http://localhost:3000`, `http://127.0.0.1:3000` and any URL in `ALLOWED_ORIGINS`, which is set to the Azure Static Web App URL in production.

---

## 3. Backend

All backend code is in `backend/`. It is CommonJS Node.js running Express 5.

### 3.1 Startup: `server.js`

When the server starts, it runs these steps in order:
1. Loads `.env` (`dotenv`) and creates the MySQL pool (`config/db.js`).
2. Registers global middleware:
   - `cors` (allowed origins, see above)
   - `express.json` / `urlencoded` with a **50 MB** limit, because reports carry base64 photos and videos
   - `helmet` for security headers. Cross-origin resource loading is allowed so the frontend on another domain can show uploaded images.
3. Mounts the routers:

   | Mount path | Router file |
   |---|---|
   | `/api/auth` | `routes/authRoutes.js` |
   | `/api/users` | `routes/userRoutes.js` |
   | `/api/logs` | `routes/logRoutes.js` |
   | `/api/reports` | `routes/reportRoutes.js` |
   | `/api/emergency-reports` | `routes/emergencyReportRoutes.js` |
   | `/api/assistance-requests` | `routes/assistanceRequestRoutes.js` |
   | `/api/petty-crimes` | `routes/pettyCrimeRoutes.js` |
   | `/api/export` | `routes/exportRoutes.js` |
   | `/api/dashboard` | `routes/dashboardRoutes.js` |
   | `/api/announcements` | `routes/announcementRoutes.js` |
   | `/api/settings` | `routes/systemSettingRoutes.js` |
   | `/api/notifications` | `routes/notificationRoutes.js` |

4. Serves `backend/uploads/` at **`/uploads`**, with a cross-origin header so images load on the frontend's domain.
5. Adds `GET /` ("SafeConnect API is running!") and `GET /api/health`, which runs `SELECT NOW()` to prove the database connection works.
6. Starts listening on `PORT` (default 5000).
7. Runs the **automatic schema updates** described below.

#### Automatic schema updates
These run on every start, so local and Azure databases stay in sync without manual migrations:

| Code | What it ensures |
|---|---|
| `AdminActivity.ensureTable()` | Table `admin_activity_logs` exists |
| `Log.ensureColumns()` | `signin_logs` has `ip_address`, `device` and `location` |
| `archiveService.startScheduler()` | The three report tables have `resolved_at` and `archived_at`; table `system_settings` exists with `report_auto_archive_months` (default `12`). It then runs auto-archive immediately and every 6 hours. |

### 3.2 The request pipeline

Every API request passes through the same layers:

```
HTTP request
   │
   ▼
routes/*.js          Matches the URL and method, and lists the middleware to run
   │
   ▼
middleware/          verifyToken → verifyAdmin → verifySuperAdmin … (reject early with 401/403)
   │                 logActivity (records the admin action if the request succeeds)
   │                 multer upload (parses multipart files)
   ▼
controllers/*.js     Reads req.params / req.query / req.body, validates, decides the response
   │
   ▼
services/*.js        Multi-step business logic (reference numbers, notifications, emails,
   │                 exports, archiving). Simple controllers skip this and call models directly.
   ▼
models/*.js          One class per table; parameterized SQL (the `?` placeholders prevent SQL injection)
   │
   ▼
config/db.js         mysql2 connection pool → MySQL
```

For example, **`PATCH /api/petty-crimes/42/status`** with body `{ "status": "In Progress" }` is handled like this:
1. `pettyCrimeRoutes.js` matches the route and runs `verifyToken`, `verifyAdmin` and `logStatus`, then calls `controller.updateStatus`.
2. `verifyToken` decodes the JWT into `req.user = { id, role }`.
3. `verifyAdmin` loads the account from the database, checks that it's an admin and Active, sets `req.admin`, and marks the admin as online.
4. `logStatus` (from `logActivity`) looks up the report reference now and prepares the log entry. It is written only after a successful response.
5. `pettyCrimeController.updateStatus`:
   - loads the report's current status
   - calls `validateStatusTransition("Received", "In Progress")`, which returns the reply message for the resident
   - runs `PettyCrime.updateStatus()`
   - creates a `Notification` for the reporter
   - responds `{ success: true }`
6. When the response finishes, `logActivity` writes "Updated report status: Petty crime report SC-2026-000042 → In Progress" to `admin_activity_logs`.

### 3.3 Config

| File | Purpose |
|---|---|
| `config/db.js` | Creates the `mysql2/promise` **connection pool** (10 connections) from the `DB_*` variables. SSL is used when `DB_SSL=true`, which Azure requires. Every model imports this pool. |
| `config/reportStyle.js` | The look of generated PDF and Excel files: colors, header text and logo paths (`backend/assets/*.png`). Change it here and every export type updates. |

### 3.4 Middleware

#### `middleware/authMiddleware.js`
| Function | Lets the request through when… | Otherwise |
|---|---|---|
| `verifyToken` | The `Authorization: Bearer` token is valid and signed with `JWT_SECRET`. Sets `req.user = { id, role }`. | 401 when no token is sent; 403 "Invalid token." |
| `verifyAdmin` | The account in the **database** has role `admin` or `super_admin` and status `Active`. Sets `req.admin` (the full user row) and calls `adminPresence.touch()`. | 403 "Admin access only." |
| `verifySuperAdmin` | `req.admin.role === "super_admin"`. It must run after `verifyAdmin`. | 403 "Super admin access only." |
| `verifySelfOrAdmin` | The URL `:id` is the caller's own id, **or** the caller is an active super admin. Used for profile endpoints. | 403 |
| `verifyReportAccess(table, level)` | The caller submitted that report (`reporter_id`), **or** is an admin at `level`: `"admin"` can view, `"super"` can edit or delete. | 404 if the report doesn't exist; 403 otherwise |
| `verifySelfOrAnyAdmin` | The URL `:userId` is the caller, or the caller is any admin. Used for the "My Reports" list. | 403 |

**Why roles come from the database and not the token:** tokens last 7 days. If only the token were checked, a demoted or suspended admin would keep admin access until it expired. Looking up the role on each request makes role changes take effect immediately.

#### `middleware/activityLogger.js`
- **`logActivity(action, describe)`** returns middleware for admin routes. `describe(req)` runs **before** the controller, so it can still read, for example, the title of an announcement that is about to be deleted. The log entry is written to `admin_activity_logs` only **after** a successful response (a 2xx/3xx status and a body without `success: false`).
- **`describeStatusChange(table, label)`** builds text such as "Emergency report SC-2026-000007 → Resolved".

The actions recorded are: Logged in, Logged out, Updated report status, Updated request status, Archived report, Restored archived report, Changed archive settings, Created / Edited / Deleted announcement, Changed user status, Changed user role, and Generated report.

#### `middleware/uploadMiddleware.js`
A `multer` instance used for **announcement images** and **profile photos**. It saves files to `backend/uploads/` under a unique name (`<timestamp>-<random>.<ext>`), accepts only PNG, JPEG and WebP, and allows at most **5 MB**. The report routes define their own multer setup (images and videos, 10 MB); the resident forms send media as base64 inside the JSON body.

### 3.5 Routes and endpoints

All paths start with `/api`. The **Access** column uses these values:
- **public**: no token needed
- **user**: any signed-in account (`verifyToken`)
- **owner**: the report's submitter or their own account (see `verifyReportAccess` / `verifySelfOrAdmin`)
- **admin**: `verifyAdmin`
- **super**: `verifySuperAdmin`

The **Called from (frontend)** column names the function in `api.js`, or the component that calls it.

#### Auth: `authRoutes.js` → `authController.js`
| Method | Path | Access | Purpose | Called from (frontend) |
|---|---|---|---|---|
| POST | `/auth/request-otp` | public | Validates the sign-up form, checks the email domain has MX records, emails a 6-digit code | `Hero.jsx` (`apiPost`) |
| POST | `/auth/verify-otp` | public | Checks the code and creates the **resident** account, then sends a welcome email | `Hero.jsx` |
| POST | `/auth/resend-otp` | public | Sends a new sign-up code | `Hero.jsx` |
| POST | `/auth/signin` | public | Checks the password and account status, logs the attempt, returns the JWT and user | `signinUser()`: `Hero.jsx`, `SignInModal.jsx` |
| POST | `/auth/forgot-password` | public | Emails a reset code. It always replies "if an account exists…" so it doesn't reveal which emails have accounts. | `Hero.jsx` |
| POST | `/auth/verify-reset-otp` | public | Checks the reset code | `Hero.jsx` |
| POST | `/auth/reset-password` | public | Sets the new password (at least 8 characters, different from the old one) | `Hero.jsx` |
| POST | `/auth/resend-reset-otp` | public | Sends a new reset code | `Hero.jsx` |
| POST | `/auth/signup` | public | Older direct sign-up without a code | `signupUser()` (no longer used by the UI) |

#### Users: `userRoutes.js` → `userController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/users` | super | All accounts | `fetchRegisteredUsers()` → Users tab |
| PUT, PATCH | `/users/:id`, `/users/:id/status` | super | Set status (Active / Pending / Suspended / Closed). You can't change your own. | `updateStatus("users")` |
| PATCH | `/users/:id/role` | super | Set role. You can't change your own. | `updateUserRole()` |
| GET | `/users/:id` | owner | Profile (the password is never returned) | `fetchUserProfile()`: `SettingsPage`, `useAdminAuth` |
| POST | `/users/:id/photo` | owner | Upload a photo (multipart field `photo`) | `uploadProfilePhoto()` |
| PATCH | `/users/:id/username` | owner | Change username (must be unique) | `updateUsername()` |
| PATCH | `/users/:id/contact` | owner | Change the number (must be `+63` followed by 10 digits) | `updateContact()` |
| PATCH | `/users/:id/email` | owner | Change the email (requires the current password) | `updateEmail()` |
| PATCH | `/users/:id/password` | owner | Change the password (requires the current password) | `changePassword()` |

#### Reports: three routers with the same structure
`emergencyReportRoutes.js` → `reportController.js`, `assistanceRequestRoutes.js` → `assistanceRequestController.js`, `pettyCrimeRoutes.js` → `pettyCrimeController.js`.

| Method | Path (under `/emergency-reports`, `/assistance-requests`, `/petty-crimes`) | Access | Purpose |
|---|---|---|---|
| POST | `/` | user | Submit a report (a JSON body with base64 media) |
| GET | `/` | admin | All reports of this type, newest first |
| GET | `/statistics` | admin | Counts by status |
| GET | `/:id` | owner, or admin | One report |
| PUT | `/:id` | owner, or super | Edit (from the resident's "My Reports") |
| PUT / PATCH | `/:id/status` | admin | Move the status forward (petty crime accepts PATCH only) |
| DELETE | `/:id` | owner, or super | Delete |

Frontend callers: `fetchEmergencyReports()`, `fetchAssistanceRequests()`, `fetchPettyCrimes()`, the matching `create…`, `update…` and `delete…` functions, and `updateStatus(type, id, status)`.

#### Cross-report: `reportRoutes.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/reports/user/:userId` | owner, or admin | A resident's reports of all three types, merged and sorted (`myReportsController`) | `fetchMyReports()` → `MyReportsPage` |
| GET | `/reports/archive-settings` | admin | `{ months }`: the auto-archive period (0, 6 or 12) | `fetchArchiveSettings()` → `ArchiveToolbar` |
| PUT | `/reports/archive-settings` | super | Change the period, then archive right away | `updateArchiveSettings()` |
| PATCH | `/reports/:type/:id/archive` | admin | Archive a **Resolved** report (`type` = emergency, assistance or pettyCrime) | `archiveReport()` → `ArchiveButton` |
| PATCH | `/reports/:type/:id/restore` | admin | Restore an archived report | `restoreReport()` |

#### Announcements: `announcementRoutes.js` → `announcementController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/announcements` | public | All announcements, newest first | `fetchAnnouncements()`: resident news, admin table |
| GET | `/announcements/link-preview?url=` | admin | Title, image and site name of a news link | `fetchLinkPreview()` |
| POST | `/announcements` | admin | Create (multipart: `title, category, message, date, source_*`, optional `image`). Emails all active residents. | `createAnnouncement()` |
| PUT | `/announcements/:id` | admin | Edit (plus `remove_image=1` to drop the image) | `updateAnnouncement()` |
| DELETE | `/announcements/:id` | admin | Delete | `deleteAnnouncement()` |

#### Notifications: `notificationRoutes.js` → `notificationController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/notifications/mine` | user | The caller's personal notifications and unread count | `fetchMyNotifications()` → resident bell |
| PUT | `/notifications/mine/:id/read` | user | Mark one as read (only if it belongs to the caller) | `markMyNotificationRead()` |
| PUT | `/notifications/mine/read-all` | user | Mark all of the caller's notifications as read | `markAllMyNotificationsRead()` |
| GET | `/notifications` | admin | Staff notifications (`user_id IS NULL`) and unread count | `fetchNotifications()` → admin bell |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | admin | Mark as read | `markNotificationRead()`, `markAllNotificationsRead()` |

#### Logs: `logRoutes.js` → `logController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/logs/signin` | super | Sign-in attempts from the last 90 days, with the account's current role | `fetchSignInLogs()` |
| GET | `/logs/admin` | super | `{ admins, activity }`: each admin's online state, last login and latest action, plus the latest 500 actions | `fetchAdminLogs()` |
| POST | `/logs/admin/logout` | admin | Records "Logged out" and clears the online state | `logoutAdmin()` |

#### Export: `exportRoutes.js` → `exportController.js` → `exportService.js`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/export/pdf/:type` | admin (super for users, signinLogs and adminLogs) | Streams a PDF file |
| GET | `/export/excel/:type` | same | Streams an `.xlsx` file |

`:type` is one of `reportsOverTime`, `statusSummary`, `emergency`, `assistance`, `pettyCrime`, `users`, `signinLogs` or `adminLogs`. The query string carries the filters: `status`, `from`, `to`, `days`, `search` and `tzOffset`. The frontend caller is `exportReport()`, which downloads the file as a blob.

#### Dashboard and Settings
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/dashboard` | admin | Totals from `Dashboard.getStatistics()`. The current UI works these totals out from the lists it already loaded, so this endpoint is mostly unused (`fetchAllData()`). |
| GET, PUT | `/settings` | super | Generic key/value settings (`system_settings`). There is no settings page yet. The archive period uses its own endpoint, shown above. |

### 3.6 Controllers

Controllers read the request, validate it, call services or models, and pick the HTTP response.

| Controller | Main responsibilities |
|---|---|
| `authController.js` | **Sign-up with a code:** checks the domain's MX records, stores the pending account (with a hashed password) in memory for 10 minutes, emails the code, then creates the account when the code matches. **Sign-in:** bcrypt comparison; rejects accounts that aren't Active (with a specific message for Pending, Suspended or Closed); records the attempt (IP, device, then location in the background); records "Logged in" for admins; emails a sign-in alert; returns the JWT and user, with a full photo URL. **Password reset:** a three-step code flow using its own in-memory store. |
| `userController.js` | User list, status and role changes (you can't change your own account), and profile self-service with validation: unique username, PH number format, current password required for email or password changes. |
| `reportController.js` | Emergency reports: create (through `reportService`), list, get, edit, delete, statistics and **status change** (validate the transition, update, notify the reporter with `emergency_status`). |
| `assistanceRequestController.js` | The same for assistance requests (`assistance_status` notifications). |
| `pettyCrimeController.js` | The same for petty crimes (`petty_crime_status` notifications). |
| `myReportsController.js` | Loads the caller's reports from all three tables in parallel and converts each to one shape (`type`, `title`, `description`, `date`, `location`, `status`, plus the type-specific fields the edit forms need), sorted newest first. |
| `archiveController.js` | Reads and changes the auto-archive period (only 0, 6 or 12 are allowed; saving applies it immediately), and archives or restores a single report. |
| `announcementController.js` | Create and edit with the uploaded image path (`/uploads/<file>`), public list, delete, and link previews (returns 422 if the link can't be read). |
| `notificationController.js` | Admin (shared) and resident (personal) notification lists, unread counts and marking as read. |
| `logController.js` | Sign-in logs; admin logs merged with in-memory presence (`online`, `last_seen`; a latest action of "Logged out" means offline); logout recording. |
| `dashboardController.js` | Returns `Dashboard.getStatistics()`. |
| `exportController.js` | Checks `:type` and hands off to `ExportService`. If the file stream fails part-way, it avoids sending a second response. |
| `systemSettingController.js` | Reads and updates generic settings. |

### 3.7 Services

Services hold logic that is shared, has several steps, or talks to outside systems.

| Service | What it does |
|---|---|
| `reportService.js`, `assistanceRequestService.js`, `pettyCrimeService.js` | **Create:** generate the reference number (`utils/reference.js`), map the form fields to model fields (for example `data.name` → `reporterName`), insert the row, then create a **staff notification** (`emergency`, `assistance` or `petty_crime`) so the admin bell lights up. **Update:** map and save the fields a resident may edit. |
| `announcementService.js` | **Create:** insert the row, create an `announcement` staff notification, and **email every active resident** in the background (a failed email doesn't fail the request). **Update:** keeps the existing image unless a new one is uploaded or `remove_image` is set. **`fetchLinkPreview(url)`:** fetches the page (with a browser User-Agent, up to 3 redirects and a 5-second timeout), reads only the `<head>`, and pulls out `og:title`, `og:image` and `og:site_name` (falling back to Twitter-card tags and then `<title>`). |
| `notificationService.js` | A thin helper that creates a staff notification (with no `user_id`). |
| `emailService.js` | `nodemailer` over SMTP with a branded HTML layout. Sends: the sign-up code, the welcome email, the sign-in alert, the password-reset code, and announcement emails (`sendAnnouncementToAll` sends each one separately, so one bad address doesn't block the rest). |
| `exportService.js` | The **`EXPORTERS`** map. Each export type has a title, a file name prefix and a `build(filters)` function that returns `{ summary, columns, rows }`. It handles status and date-range filters, the admin's timezone (`tzOffset`) and Philippine time formatting. The result is passed to `pdfService` or `excelService`. |
| `pdfService.js` | Generic branded table PDF (`pdfkit`): header with logos, summary block, table with page breaks, and page-number footers. Streams straight into the HTTP response. |
| `excelService.js` | The Excel version (`exceljs`): header rows, summary, a styled table and column widths. Streams an `.xlsx` file. |
| `archiveService.js` | Report archiving. `ensureSchema()` adds the columns and settings table. `runAutoArchive()` sets `archived_at = NOW()` on Resolved rows whose `COALESCE(resolved_at, submitted time)` is older than the configured number of months. `setArchived(type, id, bool)` archives only Resolved reports. `startScheduler()` runs the setup, then auto-archives now and every 6 hours. |
| `adminPresence.js` | An in-memory map from admin id to "last seen". `verifyAdmin` updates it on every admin request. An admin counts as online if seen in the last **2 minutes**; the admin panel polls every 30 seconds while open. |
| `systemSettingService.js` | Turns the `system_settings` rows into a `{ key: value }` object. |

### 3.8 Models

Each model is a class of `static async` methods that run parameterized SQL through the pool.

| Model | Table | Notable methods |
|---|---|---|
| `User.js` | `registered_users` | `findByEmail`, `findByUsername`, `findById` (no password), `findByIdWithPassword` (internal use only), `create`, `getAll`, `updateStatus`, `updateRole`, `updatePhoto`/`Username`/`Contact`/`Email`/`Password` |
| `Report.js` | `emergency_reports` | `create`, `findAll(filters)` (status and date range; used by lists and exports), `findByReporter`, `findById`, `findStatusById` (a light query that skips the media column), `update`, `updateStatus` (also sets `resolved_at` when the status becomes Resolved), `delete`, `getStatistics`, `getLatestReference` |
| `AssistanceRequest.js` | `assistance_requests` | The same set |
| `PettyCrime.js` | `petty_crimes` | The same set |
| `Announcement.js` | `announcements` | `create`, `findAll`, `findById`, `update` (keeps the old image if no new one is given), `clearImage`, `delete` |
| `Notification.js` | `notifications` | `create`; staff: `findAll`, `unreadCount`, `markAsRead`, `markAllAsRead` (all where `user_id IS NULL`); personal: `findByUser`, `unreadCountForUser`, `markAsReadForUser`, `markAllAsReadForUser` |
| `Log.js` | `signin_logs` | `ensureColumns`, `logSignin(name, email, status, { ip, device })`, `setSigninLocation`, `getSigninLogs()` (last 90 days, joined with the account's current role) |
| `AdminActivity.js` | `admin_activity_logs` | `ensureTable`, `record(admin, action, details)`, `getRecent(500)`, `getAdminSummaries()` (each admin account with its last login and latest action) |
| `Dashboard.js` | several | `getStatistics()`: the user count, emergency report counts by status and the announcement count |
| `SystemSetting.js` | `system_settings` | `getAll`, `get(key)`, `update(key, value)` |

### 3.9 Utils

| File | Purpose |
|---|---|
| `utils/jwt.js` | `generateToken(user)` signs `{ id, role }` with `JWT_SECRET`, valid for **7 days** |
| `utils/roles.js` | Role constants (`resident`, `admin`, `super_admin`) and `isAdminRole()` / `isSuperAdminRole()` |
| `utils/statusWorkflow.js` | `STATUS_ORDER = Received → In Progress → Resolved`. `validateStatusTransition(current, next)` only allows moving **one step forward**. Reports with older statuses (such as "Dispatched") can only move to "Received" first. It returns the reply message sent to the resident. |
| `utils/reference.js` | `generateReference(getLatestFn)` returns `SC-<year>-<6-digit number>`, which restarts at 1 each year. Each report table has its own sequence. |
| `utils/signinContext.js` | Works out the client's IP (Azure's `X-Client-IP` header, then the last `X-Forwarded-For` entry, then the socket address). Turns the User-Agent and optional browser hints into text such as "Phone · Samsung SM-S918B · Android 14 · Chrome". `lookupLocation(ip)` asks ipapi.co for "City, Region, Country · ISP" (skipped for private IPs). |

### 3.10 Background work and in-memory state

| What | Where | Lost on restart? |
|---|---|---|
| Auto-archive (on start, then every 6 hours) | `archiveService.startScheduler()` | No, all state is in MySQL |
| Sign-in location lookup (after the response is sent) | `authController.recordSignin` | No |
| Emails (welcome, sign-in alert, announcements) sent without waiting | `emailService` | No |
| Pending sign-up and reset codes | `authController` `otpStore` / `resetStore` (a `Map`) | **Yes**: users would request a new code |
| Admin "online / last seen" | `adminPresence.js` | **Yes**: harmless, it refills within 30 seconds |

---

## 4. Database

Database: **`safeconnect`** (MySQL 8, `utf8mb4`). The schema file is `database/safeconnect_db.sql`. Some columns and tables are added at startup (see [Automatic schema updates](#automatic-schema-updates)).

### Relationships
```
registered_users (id)
   ├──< emergency_reports.reporter_id      (ON DELETE SET NULL)
   ├──< assistance_requests.reporter_id    (ON DELETE SET NULL)
   ├──< petty_crimes.reporter_id           (ON DELETE SET NULL)
   ├──< announcements.created_by           (ON DELETE SET NULL)
   └──< notifications.user_id              (ON DELETE CASCADE; NULL = staff notification)

signin_logs          matched to accounts by email_address (no foreign key)
admin_activity_logs  admin_id (no foreign key, so entries survive account changes)
system_settings      key/value
```
Deleting a user keeps their reports, which become anonymous, but deletes their personal notifications.

### Tables

**`registered_users`**: accounts
`id`, `full_name`, `username` (unique), `contact_number`, `email_address` (unique), `password` (bcrypt hash), `role` (`resident` / `admin` / `super_admin`), `photo_url` (`/uploads/…`), `status` (`Active` / `Pending` / `Suspended` / `Closed`), `created_at`.

**`emergency_reports`**
`id`, `report_reference` (`SC-YYYY-NNNNNN`), `reporter_id`, `time` (submitted), `emergency_type`, `severity`, `reporter_name`, `contact_number`, `location`, `latitude`, `longitude`, `incident_details`, `number_of_people_affected`, `special_needs`, `photo_url` (base64 data URL, `LONGTEXT`), `media_type` (image / video), `status`, `assigned_to`, `assigned_at`, `resolved_at`, `archived_at`, plus the report-for-someone-else fields: `report_for` (`self` / `others`), `victim_name`, `victim_contact`, `victim_relationship`, `victim_details`.

**`assistance_requests`**
`id`, `report_reference`, `reporter_id`, `timestamp`, `request_assistance_type`, `full_name`, `contact_number`, `email_address`, `current_location`, `latitude`, `longitude`, `number_of_people_needing_help`, `urgency_level`, `describe_your_situation`, `special_needs`, `status`, `resolved_at`, `archived_at`, plus the same report-for fields.

**`petty_crimes`**
`id`, `report_reference`, `reporter_id`, `timestamp`, `crime_type`, `reporter_name`, `contact_number`, `location`, `latitude`, `longitude`, `description`, `suspect_info`, `status`, `resolved_at`, `archived_at`, plus the same report-for fields.

> The report-for columns (`report_for`, `victim_*`) are used by the models but are **not yet in `safeconnect_db.sql`**. See README → Known Issues.

**`announcements`**
`id`, `title`, `category`, `message`, `date_posted`, `image_path`, `source_url`, `source_title`, `source_image`, `source_site` (the link preview), `created_by`, `created_at`.

**`notifications`**
`id`, `user_id` (NULL means a staff notification; otherwise it belongs to that resident), `title`, `message`, `notification_type` (`emergency`, `assistance`, `petty_crime`, `announcement`, `*_status`), `reference_id` (the report or announcement id), `is_read`, `created_at`.

**`signin_logs`**
`id`, `full_name`, `email_address`, `status` (`Success` / `Failed`), `ip_address`, `device`, `location`, `timestamp`.

**`admin_activity_logs`**
`id`, `admin_id`, `admin_email`, `admin_username`, `action`, `details`, `created_at`.

**`system_settings`**
`setting_key` (primary key), `setting_value`. Currently holds `report_auto_archive_months` = `0`, `6` or `12`.

---

## 5. End-to-End Flows

### Sign-up with email verification
1. **`Hero.jsx`**: the resident fills in the sign-up form, then calls `POST /auth/request-otp`.
2. **`authController.requestOtp`**:
   - checks the required fields
   - checks the email domain's **DNS MX records**, which rejects made-up domains
   - checks the email and username are unique
   - bcrypt-hashes the password and stores the pending account in `otpStore` for 10 minutes
   - `emailService.sendOtpEmail()`
3. The resident types the 6 digits, and `Hero.jsx` calls `POST /auth/verify-otp`.
4. **`verifyOtp`** compares the code and runs `User.create({ role: "resident" })`. It then sends the welcome email without waiting for it.

### Sign-in and where the user lands
1. **`Hero.jsx`** (or **`SignInModal.jsx`** on `/admin`) calls `signinUser(email, password)`. This also sends device hints (phone model, OS version) where the browser supports them.
2. **`authController.signin`**:
   - `User.findByEmail`, then a bcrypt comparison, then the status check
   - `Log.logSignin(...)` (every attempt, including failures), with the location filled in later
   - for admins, `AdminActivity.record("Logged in")`
   - the sign-in alert email
   - `generateToken()`, then responds `{ token, isAdmin, isSuperAdmin, user }`
3. **Frontend:**
   - `setAuthToken(token, isAdmin)`
   - Admins get `sessionStorage.adminAuthenticated = true` and go to `/admin`.
   - Residents get `sessionStorage.currentUser = {...}` and go to `/resident`.
4. On `/admin`, **`useAdminAuth`** reads the user id from the JWT and calls `GET /users/:id` to get the current role. The role decides whether the System tabs are shown.

### A resident submits an emergency report
1. **`ResidentEmergencyModal.jsx`**:
   - The resident picks the type and details, and pins the location on **`LocationPickerMap`**. **`useLocationPin`** checks the pin is inside Santa Fe (`santaFeArea.js`) and fills the address from **OpenStreetMap Nominatim**.
   - The attached photo or video is read into a **base64 data URL** (`FileReader`).
   - The form checks the **1-hour per-account cooldown** kept in `localStorage`.
2. It calls `createEmergencyReport({...})`, which sends `POST /api/emergency-reports` with the JWT.
3. **Backend:** `verifyToken`, then `reportController.createReport`, then **`ReportService.create`**:
   - `generateReference(Report.getLatestReference)` returns, for example, `SC-2026-000015`
   - `Report.create(...)` inserts the row with status **Received**
   - `NotificationService.create({ notificationType: "emergency" })` creates a staff notification
   - responds `{ success, id, reportReference }`
4. The modal shows the reference number to the resident.
5. Within about 30 seconds, the admin panel's refresh (`useAdminData.refreshAllData`) fetches the new report and the new notification. The **admin bell** shows it, and the report appears in the Emergency Reports tab.

### An admin moves a report forward, and the resident is told
1. **Admin, `StatusSelect.jsx`**: clicking "Mark as In Progress" opens **`StatusConfirmModal`**, which shows the message the resident will receive.
2. `useAdminData.updateStatus(id, "In Progress", "emergency")` calls `PUT /emergency-reports/:id/status`.
3. **Backend** (see the [pipeline example](#32-the-request-pipeline)):
   - checks the transition
   - updates the status (and sets `resolved_at` when the new status is **Resolved**)
   - creates a **personal notification** for `reporter_id` (`emergency_status`)
   - logs the admin action
4. **Resident:** `useNotifications` polls `GET /notifications/mine` every minute, so the bell shows the update. Clicking it opens **My Reports**, where the progress bar now shows In Progress.

### Archiving
- **By hand:** a Resolved report's card shows **Archive** (`ArchiveButton`). Clicking it calls `PATCH /reports/emergency/:id/archive`, which sets `archived_at`. `useAdminData.setReportArchived` updates the local list, and the report moves to the **Archived** tab (`ArchiveToolbar`). **Restore** clears `archived_at`.
- **Automatically:** `archiveService` runs every 6 hours and archives Resolved reports older than the chosen period. A super admin changes the period in `ArchiveToolbar`, which calls `PUT /reports/archive-settings` and archives immediately.
- **What archiving does:** the API still returns archived reports, with `archived_at` set. `ReportsPage` only chooses **which list** shows them, so the dashboard counts and exports still include them.

### An admin posts an announcement
1. **`CreateAnnouncementView.jsx`**: the admin fills in the title, category, message and date, and adds an image or pastes a link. A pasted link calls `fetchLinkPreview()`, which calls `GET /announcements/link-preview`.
2. On save, it builds a `FormData` and calls `createAnnouncement()`, which sends `POST /announcements` as multipart data.
3. **Backend:**
   - `verifyAdmin`
   - multer saves the image to `uploads/`
   - `logActivity("Created announcement")`
   - `AnnouncementService.create`: inserts the row, creates the staff notification, and **emails every active resident** in the background
4. **Residents:** `useAnnouncements` polls `GET /announcements` every minute. The news appears in the **NewsOverlay** and the bell (announcements count as read or unread per browser, in `localStorage`).

### Generating a PDF or Excel report
1. **`GenerateReportButton`** or **`GenerateReportModal`**: the admin picks the status, date range and format.
2. `exportReport(type, format, filters)` calls `GET /export/pdf/emergency?status=Resolved&from=…&to=…&tzOffset=-480`.
3. **Backend:** `verifyAdmin` (and `verifySuperAdmin` for the system types), then `logActivity("Generated report")`, then `ExportService`:
   - `EXPORTERS.emergency.build(filters)` returns `{ summary, columns, rows }`
   - `PDFService` or `ExcelService` streams the file
4. The browser receives a blob, and `api.js` creates a temporary `<a download>` link to save it.

### Forgot password
`Hero.jsx` → `POST /auth/forgot-password` (a code is emailed if the account exists) → `POST /auth/verify-reset-otp` (marks the code as verified) → `POST /auth/reset-password` (requires a verified, unexpired code and at least 8 characters; the new password must differ from the old one).

---

## 6. Frontend

The frontend is in `src/`. It is a Create React App project with React 19.

### 6.1 Entry point, routing and language

| File | Role |
|---|---|
| `index.js` | Mounts `<App/>` and loads Bootstrap, Bootstrap Icons and the global CSS. |
| `App.js` | Wraps everything in `<LanguageProvider>`, shows `<LanguageGate>`, and defines the routes `/` → `LandingPage`, `/resident` → `ResidentPage` and `/admin` → `AdminPage`. |
| `i18n/LanguageContext.js` | Provides `useLanguage()`, which returns `{ language, setLanguage, t, hasChosenLanguage }`. `t('nav.home', vars)` looks the key up in the current language, falls back to English, and fills in `{{placeholders}}`. The choice is saved in `localStorage.sf_language`. |
| `i18n/translations.js` | The `en` and `tl` dictionaries, grouped by component. They cover the **landing page and resident app**; the admin panel is English only. |

### 6.2 `Services/api.js`

This is the **only** place that calls the SafeConnect API. It groups:
- **Setup:** `API_ENDPOINTS`, token helpers (`getAuthToken`, `setAuthToken`, `clearAuthToken`), `apiFetch` (session-expiry detection), `resolveAssetUrl`.
- **Auth and profile:** `signinUser` (also sends device hints from `navigator.userAgentData`), `signupUser`, `fetchUserProfile`, `updateUsername`, `updateContact`, `updateEmail`, `changePassword`, `uploadProfilePhoto`.
- **Users (admin):** `fetchRegisteredUsers`, `updateUserStatus`, `updateUserRole`.
- **Reports:** `fetch…`, `create…`, `update…`, `update…Status` and `delete…` for each of the three types. The fetch functions **map rows to camelCase** (for example `emergency_type` → `emergency`, `time` → `date`, `archived_at` → `archivedAt`).
- **Archive:** `archiveReport`, `restoreReport`, `fetchArchiveSettings`, `updateArchiveSettings`.
- **Announcements:** `fetchAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `fetchLinkPreview`.
- **Logs:** `fetchSignInLogs`, `fetchAdminLogs`, `logoutAdmin`.
- **Notifications:** admin: `fetchNotifications`, `markNotificationRead`, `markAllNotificationsRead`; resident: `fetchMyNotifications`, `markMyNotificationRead`, `markAllMyNotificationsRead`.
- **Other:** `fetchMyReports`, `exportReport` (blob download), and `updateStatus(type, id, status)`, a generic helper that knows each type's URL and HTTP method.

The only calls that bypass `api.js` are to **other** services (Nominatim, Open-Meteo), plus `Hero.jsx`'s small `apiPost()` helper for the code and reset endpoints.

### 6.3 Pages

| Page | What it does |
|---|---|
| `pages/LandingPage.jsx` | The public site: `Navbar`, `Hero` (sign-in and sign-up live here), `Services`, `About`, `Contact` and the footer. |
| `pages/ResidentPage.jsx` | Reads `sessionStorage.currentUser`, clears any Bootstrap modal backdrop left behind, and renders `ResidentNavbar`, `ResidentHero`, `EmergencyReportSection`, the footer and the **three report modals**. It keeps track of which modal is open. |
| `pages/AdminPage.jsx` | The admin panel's controller. It combines `useAdminAuth` (session and role), `useAdminData` (all data and actions) and `useAdminNavigation` (current tab). It holds the **filter state for every tab**, loads everything once signed in, and **refreshes every 30 seconds** (except while an announcement is being edited). It hides System tabs from non-super admins and renders the current tab inside `AdminLayout`. It shows `SignInModal` when not signed in or when the session expires. |

### 6.4 Landing components (`components/landing/`)

| Component | What it does | Talks to backend? |
|---|---|---|
| `Navbar.jsx` | Public top navigation with smooth scrolling to sections, a mobile menu and the language toggle. | No |
| `Hero.jsx` | The landing hero and **all account dialogs**: sign-in, sign-up (form, then 6-digit code step with a 60-second resend timer), and forgot password (email → code → new password → done). Also has an emergency-hotline call button. After sign-in it stores the token and redirects by role. | Yes: `signinUser()` and the `/auth/*` code endpoints |
| `Services.jsx` | Cards describing what SafeConnect offers (translated). | No |
| `About.jsx` | About the project and barangay (translated). | No |
| `Contact.jsx` | Barangay contact details and hotlines (translated). | No |

### 6.5 Resident components (`components/resident/`)

| Component | What it does | API calls |
|---|---|---|
| `ResidentNavbar.jsx` | The resident's top bar and the hub of the resident app. It uses the navbar hooks to load **announcements, notifications, weather and the profile**, polls every minute, switches between desktop and mobile layouts, and opens **NewsOverlay**, **MyReportsPage** and **SettingsPage** as overlays. Clicking a notification marks it read and opens the related news article or My Reports. Logout clears the resident token and storage. | `clearAuthToken` (the hooks do the fetching) |
| `ResidentHero.jsx` | A welcome banner at the top of the resident page. | No |
| `EmergencyReportSection.jsx` | Cards for **Report Emergency**, **Request Assistance** and **Report Petty Crime** that open the matching modal, plus an emergency call button. | No |
| `ResidentEmergencyModal.jsx` | The emergency report form: type (sets the severity automatically), details, people affected, special needs, **required photo or video** (JPG up to 20 MB, video up to 50 MB, converted to base64), a **map pin inside Santa Fe**, and self or someone-else fields. It applies a 1-hour cooldown per account, runs in **edit mode** when opened from My Reports with `editingReport`, and shows the reference number on success. | `createEmergencyReport`, `updateEmergencyReport` |
| `ResidentAssistanceModal.jsx` | The assistance request form: type, urgency, situation, people needing help, special needs, the map pin and self or someone-else fields. Same cooldown and edit mode. | `createAssistanceRequest`, `updateAssistanceRequest` |
| `ResidentPettyCrimeModal.jsx` | The petty crime form: crime type (with an "Other" option), description, suspect information, the map pin and the victim fields. Same cooldown and edit mode. | `createPettyCrimeReport`, `updatePettyCrimeReport` |
| `MyReportsPage.jsx` | A full-screen list of **every report the resident has submitted**. It has an overview bar, tabs by type, search and filters, a status progress stepper on each card, reference copy-to-clipboard, **edit** (reopens the matching modal with the data filled in) and **delete** (with confirmation). | `fetchMyReports`, `delete…` for each type |
| `SettingsPage.jsx` | Profile settings: photo (preview, then Save), username, contact (+63 format), email (requires the current password) and password. Successful changes update the navbar right away (`onProfileUpdate`). | `fetchUserProfile`, `uploadProfilePhoto`, `updateUsername`, `updateContact`, `updateEmail`, `changePassword` |

#### Navbar pieces (`components/resident/navbar/`)
| Component | What it does |
|---|---|
| `DesktopNavbar.jsx` | The wide-screen bar: links, news, the notification bell, weather, the language toggle and the user dropdown. |
| `MobileNavbar.jsx` / `MobileMenu.jsx` | The phone bar and its slide-out menu with the same features. |
| `NotificationPanel.jsx` | The notification dropdown list, with category colors and "mark all read". |
| `NewsOverlay.jsx` | A full-screen news feed built from `AnnouncementCard`s. It can scroll to a specific article. |
| `AnnouncementCard.jsx` | One announcement: its image, the linked article's preview image, or a placeholder showing the source site. |
| `UserDropdown.jsx` | The avatar menu: My Reports, Settings, Logout. |
| `WeatherCard.jsx` | Shows the forecast from `useWeather`. |
| `NavbarStyle.css` | Styles for all of the above. |

#### Navbar hooks (`components/resident/navbar/hooks/`)
| Hook | What it does |
|---|---|
| `useAnnouncements.js` | Loads announcements through `fetchAnnouncements()`. |
| `useNotifications.js` | Combines **announcements**, whose read state is kept in `localStorage` per browser, with **personal notifications** from the backend (read state kept on the server). Personal notification ids get a prefix so the two kinds can be told apart. Provides the unread count and mark-read functions. |
| `useWeather.js` | Gets Santa Fe's daily forecast from **Open-Meteo** and caches it in `localStorage`. |
| `useResidentProfile.js` | Reads and writes the signed-in resident in `sessionStorage.currentUser` (name, photo) so the navbar stays in sync after Settings changes. |
| `useClickOutside.js` | Closes dropdowns when the user clicks outside them. |

### 6.6 Admin components (`components/admin/`)

#### Hooks: the admin panel's logic
| Hook | What it does |
|---|---|
| `hooks/useAdminAuth.js` | Session state: `isAuthenticated` (from `sessionStorage.adminAuthenticated`), `adminUser` (loaded again from `GET /users/:id` using the id in the JWT, so the **role is always current**), `isSuperAdmin`, the **session-expired** listener (re-shows the sign-in box), and `handleLogout` (records the logout on the server, then clears the token). |
| `hooks/useAdminData.js` | **The admin data store.** Holds every list (the three report types, users, sign-in logs, admin logs, announcements, notifications) and exposes: `loadAllData` (first load), `refreshAllData` (silent 30-second refresh), `handleRefresh(view)` (reload only the current tab), `updateStatus`, `updateUserRole`, `setReportArchived`, notification mark-read functions and `handleFormSubmit`. System-tab data loads only for super admins. |
| `hooks/useAdminNavigation.js` | The current tab (`activeView`), mobile menu state, the announcement being edited, and navigation helpers. |
| `hooks/useIsMobile.js` | `true` below the phone breakpoint used in `admin.css`. |

#### Layout
| Component | What it does |
|---|---|
| `layout/AdminLayout.jsx` | The page shell: sidebar and header around the current tab. |
| `layout/AdminSidebar.jsx` | Navigation groups: Dashboard; Reports (Emergency, Assistance, Petty Crime); Announcements; **System** (Users, Sign-in Logs, Admin Logs), which only super admins see. On phones it becomes a drawer that also shows the signed-in admin. |
| `layout/AdminHeader.jsx` | The page title, the refresh button (with the last update time), the **notification bell** (each notification type links to its tab), and the account menu with logout. |
| `layout/AdminStats.jsx` | Clickable stat cards used on the dashboard. |

#### Dashboard (`dashboard/`)
| Component | What it does |
|---|---|
| `Dashboard.jsx` | Lays out the dashboard. On phones it shows the summary and a toggle between Recent Reports and Analytics. All numbers are **worked out from the lists `useAdminData` already loaded**. |
| `DashboardSummary.jsx` | Greeting and headline totals. |
| `ReportsOverTimeChart.jsx` | A Recharts bar chart over the last 7, 15, 30 or 90 days, by category or overall. Days are counted in local time. It has its own Generate Report button (`reportsOverTime`). |
| `DashboardCharts.jsx` + `PieChartCard.jsx` | Status pie charts for each report type (`statusSummary` export). |
| `DashboardRecentReports.jsx` | The latest reports across all three types, sorted newest first. |
| `DashboardAlerts.jsx`, `DashboardQuickActions.jsx` | Kept for possible future use. They are imported but **not rendered**. |

#### Reports (`reports/`)
| Component | What it does |
|---|---|
| `ReportsPage.jsx` | Picks the Emergency, Assistance or Petty Crime tab, and applies the **Active/Archived split**, status filter, "filed for" filter and search. Renders `ArchiveToolbar` above the list. |
| `emergency/EmergencyPage.jsx` → `EmergencyReportsTable.jsx` → `EmergencyReportDetails.jsx` | Each report is a `ReportCard` (color by severity) with a `StatusSelect`, an `ArchiveButton`, and expandable details including the photo or video and the map. |
| `assistance/…` | The same structure for assistance requests (badge shows people affected). |
| `pettyCrime/…` | The same structure for petty crimes. |
| `shared/ArchiveToolbar.jsx` | The **Active (n) / Archived (n)** switch and the auto-archive period (super admins get a dropdown; other admins see it as text). |
| `shared/ArchiveButton.jsx` | **Archive** on Resolved reports and **Restore** on archived ones. |
| `shared/ReportFor.jsx` | The "For <name>" pill, the person-affected details block and the "Filed for" filter, used when a report was filed for someone else. |
| `shared/ReportImage.jsx` | Shows the attached photo or video. |
| `shared/ReportLocationMap.jsx` | A read-only `LocationPickerMap` of the pinned spot (hidden if there's no pin). |

#### Announcements (`announcements/`)
| Component | What it does |
|---|---|
| `AnnouncementsPage.jsx` | The tab wrapper. |
| `AnnouncementsTable.jsx` | Manages itself: fetches, searches, sorts and paginates a card grid, and handles edit and delete with a `ResultPopup`. It opens the create modal right away when reached from the dashboard shortcut. |
| `AnnouncementModal.jsx` | A popup around `CreateAnnouncementView` (Esc or clicking outside closes it). |
| `CreateAnnouncementView.jsx` | The create and edit form: image upload with preview and remove, a **pasted link with automatic preview**, and multipart submission. Form contents are kept if the session expires. |
| `constants.js` | Announcement categories. |

#### Users, Logs, Modals
| Component | What it does |
|---|---|
| `users/UsersPage.jsx` | Filters users by search, status and role. |
| `users/RegisteredUsersTable.jsx` | The user table with inline `UserRoleSelect` and `UserStatusSelect`. Every change is confirmed in `UserChangeConfirmModal`, and backend errors (such as trying to change your own account) are shown. |
| `logs/LogsPage.jsx` | Switches between Sign-in Logs and Admin Logs, and filters sign-ins. |
| `logs/SignInLogsTable.jsx` | User, time, role, IP and location, device and status for the last 90 days, with export. |
| `logs/AdminLogsTable.jsx` | Admin cards with **online / last seen** status and latest action, plus the full searchable activity list with action badges. |
| `AdminModals/SignInModal.jsx` | The admin sign-in box, also shown when the session expires. |
| `AdminModals/FormModal.jsx` | A generic "add record" form, built with `shared/formUtils.js`. It is still wired into `AdminPage` but **no button opens it** at the moment. |

#### Shared admin building blocks (`shared/`)
| Component | What it does |
|---|---|
| `ListView.jsx` | The standard list page: search, status filter, extra filters, sort, an "Add" button, a **Generate Report** button, and a table or card layout with **pagination**. It resets to page 1 when filters change, but not on a background refresh. |
| `Table.jsx`, `Section.jsx` | Table shell and card wrapper. |
| `Pagination.jsx` | Page numbers with gaps ("…"), "Showing x–y of z", and a rows-per-page picker. |
| `ReportCard.jsx` | A collapsible report row (accent color, title, badge, tag, status control, details). |
| `StatusSelect.jsx` | A **forward-only** status control: the current status badge plus a single "next step" button. |
| `StatusConfirmModal.jsx` | Confirms a status change and shows the reply the resident will receive. |
| `StatusBadge.jsx` | A colored pill for any status (grey for unknown values). |
| `GenerateReportButton.jsx` | A PDF/Excel dropdown, or opens `GenerateReportModal` when `withOptions` is set. |
| `GenerateReportModal.jsx` | Status, date range (preset or custom) and format, then `exportReport()`. |
| `ResultPopup.jsx` | Success or error popup used instead of `alert()`. |
| `DetailField.jsx` | A label and value pair in detail views. |
| `chartUtils.js` | Severity and status colors, and grouping for the pie charts. |
| `formUtils.js` | Builds report submissions from `FormModal` data. |
| `timeUtils.js` | `timeAgo()` ("5m ago"). |

### 6.7 Shared components (`components/shared/`)

| Component | What it does |
|---|---|
| `DonationFooter.jsx` | The site footer (translated), used on the landing and resident pages. |
| `LanguageGate.jsx` | A full-screen **English / Tagalog** picker, shown until a language is chosen. |
| `LanguageToggle.jsx` | A small EN/TL switch for the navbars and menus. |
| `location/LocationPickerMap.jsx` | A Leaflet map of Barangay Santa Fe with its boundary. Tap or drag to pin; Map/Satellite switch (OpenStreetMap / Esri imagery); `readOnly` mode for admin details. |
| `location/useLocationPin.js` | Shared pin logic for the three report forms: GPS ("Use my current location"), the inside-Santa-Fe check, and **reverse geocoding** with Nominatim (only the newest pin's result is used). |
| `location/santaFeArea.js` | The barangay **boundary polygon** (from OpenStreetMap, adjusted to match Google Maps), a point-in-polygon test, and a 25 m tolerance near the boundary, because GPS is only accurate to 10–30 m. |

### 6.8 Styles (`src/styles/`)

| File | Covers |
|---|---|
| `App.css` / `src/App.css` | Global and landing styles |
| `resident.css` | The resident app |
| `emergencyreport.css`, `residentemergencymodal.css`, `evacuation.css` | Report section and report modals |
| `admin.css` | The admin panel, including the phone layouts (`lv-*` list filters, `report-card-*`, `dash-summary-*`) |

---

## 7. Browser Storage Keys

| Key | Storage | Set by | Purpose |
|---|---|---|---|
| `authToken` | localStorage | `setAuthToken` | Resident JWT |
| `adminAuthToken` | localStorage | `setAuthToken` | Admin JWT |
| `isAdmin` | localStorage | older sessions | Only read for backward compatibility |
| `sf_language` | localStorage | `LanguageContext` | `en` or `tl` |
| `residentName` | localStorage | `Hero`, `useResidentProfile` | Fallback display name |
| `sf_lastReportTimestamp_<type>_<userId or guest>` | localStorage | report modals | 1-hour submission cooldown |
| `sf_weatherCache`, `sf_weatherNoticeDismissed` | localStorage | `useWeather` | Forecast cache, rain-alert dismissal |
| announcement read ids | localStorage | `useNotifications` | Which announcements this browser has seen |
| `currentUser` | sessionStorage | `Hero`, `useResidentProfile` | Signed-in resident (id, name, contact, email, photo) |
| `userAuthenticated` | sessionStorage | `Hero` | Resident signed in |
| `adminAuthenticated`, `adminUser` | sessionStorage | `Hero`, `SignInModal`, `useAdminAuth` | Admin signed in, admin profile |

`sessionStorage` is cleared when the tab closes. The tokens in `localStorage` last until logout or until they expire after 7 days.

---

## 8. External Services

| Service | Used by | For |
|---|---|---|
| **SMTP** (for example Gmail) | backend `emailService.js` | Sign-up and reset codes, welcome emails, sign-in alerts, announcement emails |
| **ipapi.co** | backend `signinContext.js` | Approximate sign-in location (free, about 1,000 lookups a day) |
| **DNS (MX lookup)** | backend `authController.js` | Rejecting sign-ups from made-up email domains |
| **News sites** (any URL) | backend `announcementService.js` | Link previews for announcements |
| **OpenStreetMap tiles** | frontend `LocationPickerMap.jsx` | Street map |
| **Esri World Imagery** | frontend `LocationPickerMap.jsx` | Satellite view |
| **OpenStreetMap Nominatim** | frontend `useLocationPin.js` | Turning a pin into an address |
| **Open-Meteo** | frontend `useWeather.js` | Weather forecast |
