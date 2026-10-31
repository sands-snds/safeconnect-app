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
- **Push, with polling as a backup.** Each signed-in tab keeps one **Server-Sent Events** connection (`GET /api/me/events`, `services/liveUpdates.js`, `shared/useLiveUpdates.js`). When something it shows changes (a new notification, an announcement, read state, the profile), it gets a short event naming what changed and reloads just that. Events carry no data. The admin panel still refreshes every 30 seconds and the resident navbar every minute, in case a connection drops.

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
The backend accepts requests only from `http://localhost:3000`, `http://127.0.0.1:3000` and any URL in `ALLOWED_ORIGINS`, which in production lists both frontends: the Vercel site (https://safeconnect-santafe.vercel.app, the official address) and the Azure Static Web App.

---

## 3. Backend

All backend code is in `backend/`. It is CommonJS Node.js running Express 5.

> **Role names.** The stored role values didn't change, only what people see: `resident` is shown as **Resident**, `admin` as **Official** and `super_admin` as **Admin**. In this document, "admin" in middleware names such as `verifyAdmin` means "Official or Admin", and `verifySuperAdmin` means "Admin". Always show `ROLE_LABELS[role]` (`backend/utils/roles.js`, `src/components/shared/roles.js`) to people.

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
   | `/api/site-content` | `routes/siteContentRoutes.js` |

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
| `AnnouncementLike.ensureTable()` | Table `announcement_likes` exists |
| `AnnouncementComment.ensureTable()` | Table `announcement_comments` exists, including the `parent_id` column used for replies |
| `logArchiveService.startScheduler()` | `signin_logs` and `admin_activity_logs` have `archived_at`; the settings `signin_log_auto_archive_days` and `admin_log_auto_archive_days` exist (default `90`). It then archives old log entries immediately and every 6 hours. |
| `siteContentService.ensureSchema()` | `system_settings.setting_value` is `TEXT`, so the site contacts JSON fits. Then `siteMediaService.hideNewsVideoOnce()` turns the News tab's video off once on sites saved before its switch came back (marker setting `site_media_news_off_v1`). |
| `announcementArchiveService.startScheduler()` | `announcements.archived_at` exists; the setting `announcement_auto_archive_months` exists (default `0` = Off). It then auto-archives now and every 6 hours. |
| `Notification.ensureColumns()` | `notifications` has `archived_at` (Notifications page archive) and `comment_id` (the comment to reply to) |
| `ResidentActivity.ensureTable()` | Table `resident_activity_logs` exists (the Activity column of Resident Logs) |
| `User.ensureArchiveColumn()` | `registered_users.archived_at` exists (archived Closed accounts) |
| `mainAccount.ensureMainAccount()` | The barangay's main account (safeconnect.brgy.santafe@gmail.com) exists and is an Active Admin. A new one gets a random password; the barangay sets theirs with "Forgot password?". |
| `archiveService.startScheduler()` | The three report tables have `resolved_at`, `archived_at` and `dismissal_reason` (an older `rejection_reason` column is renamed, and "Rejected" reports become "Dismissed"); table `system_settings` exists with `report_auto_archive_months` (default `12`). It then runs auto-archive immediately and every 6 hours. |

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
| `verifySuperAdmin` | `req.admin.role === "super_admin"` (shown as **Admin**). It must run after `verifyAdmin`. | 403 "Only Admins can do this." |
| `verifySelfOrAdmin` | The URL `:id` is the caller's own id, **or** the caller is an active super admin. Used for profile endpoints. | 403 |
| `verifyReportAccess(table, level)` | The caller submitted that report (`reporter_id`), **or** is an admin at `level`: `"admin"` can view, `"super"` can edit or delete. | 404 if the report doesn't exist; 403 otherwise |
| `verifySelfOrAnyAdmin` | The URL `:userId` is the caller, or the caller is any admin. Used for the "My Reports" list. | 403 |

**Why roles come from the database and not the token:** tokens last 7 days. If only the token were checked, a demoted or suspended admin would keep admin access until it expired. Looking up the role on each request makes role changes take effect immediately.

#### `middleware/activityLogger.js`
- **`logActivity(action, describe)`** returns middleware for admin routes. `describe(req)` runs **before** the controller, so it can still read, for example, the title of an announcement that is about to be deleted. The log entry is written to `admin_activity_logs` only **after** a successful response (a 2xx/3xx status and a body without `success: false`).
- **`describeStatusChange(table, label)`** builds text such as "Emergency report SC-2026-000007 → Resolved".

The actions recorded are: Logged in, Logged out, Updated report status (a dismissal includes its reason), Archived report, Restored archived report, Changed archive settings, Created / Edited / Deleted / Archived / Restored announcement, Changed user status, Changed user role, Archived account, Restored archived account, Updated page contacts / contents, and Generated report.

#### `middleware/residentActivity.js`
- **`logResidentActivity(action, describe)`** works like `logActivity`, but for residents: after a successful response it writes to `resident_activity_logs` (only when the signed-in account's role is `resident`). Used on report submit, edit and delete (`Submitted / Edited / Deleted emergency report`, `… assistance request`, `… petty crime report`) and on `POST /auth/logout` (`Signed out`). A new report's reference comes from the response (`reportReference`).
- **`reportReference(table)`** reads a report's reference before the controller runs, so a deleted report's reference is still logged.

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
| POST | `/auth/logout` | user | Revokes a saved login; records "Signed out" for residents | `logoutUser()` |

#### Users: `userRoutes.js` → `userController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/users` | super | All accounts, each with `is_main_account` | `fetchRegisteredUsers()` → Users tab |
| PUT, PATCH | `/users/:id`, `/users/:id/status` | super | Set status (Active / Pending / Suspended / Closed). You can't change your own. | `updateStatus("users")` |
| PATCH | `/users/:id/role` | super | Set role. You can't change your own, or the main barangay account's. | `updateUserRole()` |
| PATCH | `/users/:id/archive`, `/users/:id/restore` | super | Move a **Closed** account to the Archived tab, or back (reopening an account also clears it) | `setUserArchived()` |
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
| PUT / PATCH | `/:id/status` | admin | Move the status forward, or `{ status: "Dismissed", reason }` to dismiss an open report (the reason, 5–500 characters, is saved in `dismissal_reason` and sent to the reporter). Petty crime accepts PATCH only. |
| DELETE | `/:id` | owner, or super | Delete |

Frontend callers: `fetchEmergencyReports()`, `fetchAssistanceRequests()`, `fetchPettyCrimes()`, the matching `create…`, `update…` and `delete…` functions, and `updateStatus(type, id, status)`.

#### Cross-report: `reportRoutes.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/reports/user/:userId` | owner, or admin | A resident's reports of all three types, merged and sorted (`myReportsController`) | `fetchMyReports()` → `MyReportsPage` |
| GET | `/reports/archive-settings` | admin | `{ months }`: the auto-archive period (0, 6 or 12) | `fetchArchiveSettings()` → `ArchiveToolbar` |
| PUT | `/reports/archive-settings` | super | Change the period, then archive right away | `updateArchiveSettings()` |
| PATCH | `/reports/:type/:id/archive` | admin | Archive a **Resolved** or **Dismissed** report (`type` = emergency, assistance or pettyCrime) | `archiveReport()` → `ArchiveButton` |
| PATCH | `/reports/:type/:id/restore` | admin | Restore an archived report | `restoreReport()` |

#### Announcements: `announcementRoutes.js` → `announcementController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/announcements` | public | Announcements that aren't archived, newest first, each with `likeCount`, `commentCount` and `likedByMe`. `attachUserIfPresent` reads the token if one is sent, without requiring it. `?includeArchived=1` (Officials and Admins only) adds the archived ones, with `archived_at`. | `fetchAnnouncements({ includeArchived })`: resident news, admin table |
| GET, PUT | `/announcements/archive-settings` | admin (PUT: super) | `{ months }`: auto-archive 0 (Off), 3, 6 or 12 months after posting; saving archives right away | `fetchAnnouncementArchiveSettings()`, `updateAnnouncementArchiveSettings()` → `ArchiveToolbar` |
| PATCH | `/announcements/:id/archive`, `/announcements/:id/restore` | admin | Archive or restore one | `archiveAnnouncement(id, archived)` → Edit form |
| GET | `/announcements/link-preview?url=` | admin | Title, image and site name of a news link | `fetchLinkPreview()` |
| POST | `/announcements` | admin | Create (multipart: `title, category, message, date, source_*`, optional `image`). Emails all active residents. | `createAnnouncement()` |
| PUT | `/announcements/:id` | admin | Edit (plus `remove_image=1` to drop the image) | `updateAnnouncement()` |
| DELETE | `/announcements/:id` | admin | Delete | `deleteAnnouncement()` |
| GET | `/announcements/:id/comments` | public | All comments, oldest first: `{ id, parentId, text, author, userId, isAdmin, date }` | `fetchAnnouncementComments()`: `AnnouncementCard`, admin `AnnouncementComments` |
| POST | `/announcements/:id/comments` | user | Post a comment `{ text }`, or a reply `{ text, parentId }`. A reply to a reply attaches to the top-level comment. When an admin replies, the comment's author gets a `comment_reply` notification. A resident's comment or reply creates a staff `announcement_comment` notification (with `comment_id`), so it can be answered from the Notifications page. | `postAnnouncementComment()` |
| DELETE | `/announcements/comments/:commentId` | the comment's author, or admin | Delete a comment and its replies | `deleteAnnouncementComment()` |
| POST | `/announcements/:id/like` | user | Like or unlike (toggle); returns `{ liked, count }` | `toggleAnnouncementLike()` (residents only) |

#### Notifications: `notificationRoutes.js` → `notificationController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/notifications/mine` | user | The caller's personal notifications and unread count | `fetchMyNotifications()` → resident bell and Notifications page |
| PUT | `/notifications/mine/archive` | user | Archive or restore some of the caller's notifications | resident Notifications page |
| POST | `/notifications/mine/delete` | user | Delete some of the caller's notifications | resident Notifications page |
| PUT | `/notifications/mine/:id/read` | user | Mark one as read (only if it belongs to the caller) | `markMyNotificationRead()` |
| PUT | `/notifications/mine/read-all` | user | Mark all of the caller's notifications as read | `markAllMyNotificationsRead()` |
| GET | `/notifications` | admin | Staff notifications (`user_id IS NULL`) that aren't archived, and the unread count. `?archived=1`: the archived ones. | `fetchNotifications({ archived })` → admin bell, Notifications page |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | admin | Mark one / all as read | `markNotificationRead()`, `markAllNotificationsRead()` |
| PUT | `/notifications/read` | admin | `{ ids }`: mark several as read | `markNotificationsRead()` → Notifications page |
| PUT | `/notifications/archive` | admin | `{ ids, archived }`: archive or restore several (shared by all staff) | `archiveNotifications()` → Notifications page |

#### Logs: `logRoutes.js` → `logController.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/logs/signin` | super | **Residents'** sign-in attempts (and attempts with an email that has no account) that aren't archived, with the account's current role. Each successful sign-in has `activity`: the resident's `resident_activity_logs` entries until their next successful sign-in. `?archived=1` lists the archived ones. | `fetchSignInLogs({ archived })` |
| GET | `/logs/admin` | super | `{ admins, activity }`: each Admin/Official account's role, online state, last login and latest action, plus the latest 500 actions that aren't archived (`?archived=1`: up to 2,000 archived ones) | `fetchAdminLogs({ archived })` |
| GET | `/logs/archive-settings/:log` | super | `{ days }`: the auto-archive period for `signin` or `admin` (0 = off) | `fetchLogArchiveSettings()` → `ArchiveToolbar` |
| PUT | `/logs/archive-settings/:log` | super | Change the period (0, 30, 90, 180 or 365 days), then archive right away | `updateLogArchiveSettings()` |
| POST | `/logs/admin/logout` | admin | Records "Logged out" and clears the online state | `logoutAdmin()` |

#### Export: `exportRoutes.js` → `exportController.js` → `exportService.js`
| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/export/pdf/:type` | admin (super for users, signinLogs and adminLogs) | Streams a PDF file |
| GET | `/export/excel/:type` | same | Streams an `.xlsx` file |

`:type` is one of `analytics`, `reportsOverTime`, `statusSummary`, `emergency`, `assistance`, `pettyCrime`, `users`, `signinLogs` or `adminLogs`. The query string carries the filters: `status`, `from`, `to`, `days`, `search` and `tzOffset`. The System types also take `role` (`resident`, `admin`, `super_admin`, or `unknown` for sign-ins without an account) and `archived=1`, and `adminLogs` takes `admin` (an email). `signinLogs` only ever includes residents and `unknown`. Statuses include `Dismissed`. `analytics` (the dashboard's Analytical Report) takes `bar=0` / `pie=0` to leave a part out, and `status` for the pie chart only. The file name comes back in `Content-Disposition` (e.g. `SafeConnect-SantaFe Emergency Reports_All time.pdf`); `server.js` exposes that header through CORS so the browser can read it. The frontend caller is `exportReport()`, which downloads the file as a blob.

#### Site contacts: `siteContentRoutes.js` → `siteContentController.js` → `siteContentService.js`
| Method | Path | Access | Purpose | Called from |
|---|---|---|---|---|
| GET | `/site-content` | public | `{ content: { emergencyContacts, footerHotlines, officials, socials }, options: { icons, colors } }`. Falls back to the defaults if the database can't be read. Older saved data is upgraded on read: numbers to `+63…` with a `numberType`, one-line official names split into parts. | `fetchSiteContent()` → `useSiteContent()`, Page Contacts tab |
| PUT | `/site-content` | super | Save everything (validated: names, text up to 40 characters, Mobile `+63` + 10 digits starting with 9 or Landline `+63` + 9 digits, `911` kept as is, email, https facebook.com link, list limits) | `updateSiteContent()` → `SiteContactsPage` |
| PUT | `/site-content/media` | super | Save `{ carousel, residentCarousel, systemDemo, adminDemo }` (validated: only uploaded or built-in images, YouTube links reduced to the video id, titles and photo descriptions up to 40 characters) | `updateSiteMedia()` → `SiteContentsPage` |
| POST | `/site-content/upload` | super | Upload one carousel photo (JPG/PNG/WebP, 5 MB) or demo video (MP4/WebM, 100 MB), multipart field `file`; returns `{ url: "/uploads/…" }` | `uploadSiteMedia()` (XHR, with progress) |

The GET above also returns `media`: the carousel photos and demo videos.

#### Dashboard and Settings
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/dashboard` | admin | Totals from `Dashboard.getStatistics()`. The current UI works these totals out from the lists it already loaded, so this endpoint is mostly unused (`fetchAllData()`). |
| GET, PUT | `/settings` | super | Generic key/value settings (`system_settings`). There is no settings page yet. The archive period uses its own endpoint, shown above. |

### 3.6 Controllers

Controllers read the request, validate it, call services or models, and pick the HTTP response.

| Controller | Main responsibilities |
|---|---|
| `authController.js` | **Sign-up with a code:** checks the domain's MX records, stores the pending account (with a hashed password) in memory for 10 minutes, emails the code, then creates the account when the code matches. **Sign-in:** bcrypt comparison; rejects accounts that aren't Active, returning a `code` (`ACCOUNT_SUSPENDED`, `ACCOUNT_CLOSED`, `ACCOUNT_PENDING`) that the sign-in screens turn into a translated popup; records the attempt (IP, device, then location in the background); records "Logged in" for admins; emails a sign-in alert; returns the JWT and user, with a full photo URL. **Password reset:** a three-step code flow using its own in-memory store. |
| `userController.js` | User list, status and role changes (you can't change your own account or the main barangay account; statuses are Active, Suspended and Closed), archiving Closed accounts, and profile self-service (the main account's email can't be changed) with validation: unique username, PH number format, current password required for email or password changes. |
| `reportController.js` | Emergency reports: create (through `reportService`), list, get, edit, delete, statistics and **status change** (validate the transition, update, notify the reporter with `emergency_status`). Dismissing checks the reason and sends it to the reporter instead of the usual reply. |
| `assistanceRequestController.js` | The same for assistance requests (`assistance_status` notifications). |
| `pettyCrimeController.js` | The same for petty crimes (`petty_crime_status` notifications). |
| `myReportsController.js` | Loads the caller's reports from all three tables in parallel and converts each to one shape (`type`, `title`, `description`, `date`, `location`, `status`, plus the type-specific fields the edit forms need), sorted newest first. |
| `archiveController.js` | Reads and changes the auto-archive period (only 0, 6 or 12 are allowed; saving applies it immediately), and archives or restores a single report. |
| `announcementController.js` | Create and edit with the uploaded image path (`/uploads/<file>`), public list (with like and comment counts), delete, and link previews (returns 422 if the link can't be read). Also likes and comments: checks comment text (1–1,000 characters), attaches replies to their top-level comment, marks admin comments with `isAdmin`, and notifies a resident when an admin replies to them (and the admin panel when a resident comments). Also the announcement archive: the auto-archive period, and archive / restore one. |
| `notificationController.js` | Admin (shared) and resident (personal) notification lists, unread counts and marking as read; for the admin Notifications page, archiving / restoring and marking several at once. |
| `logController.js` | Resident sign-in logs (each successful sign-in with that resident's activity until their next one, `withActivity`) and admin logs, current or archived (`?archived=1`); admin logs merged with in-memory presence (`online`, `last_seen`; a latest action of "Logged out" means offline); reading and changing each log's auto-archive period; logout recording. |
| `siteContentController.js` | Returns the site contacts (public) and saves them after `siteContentService.validate()`. |
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
| `exportService.js` | The **`EXPORTERS`** map. Each export type has a title, a `fileTitle` (the download's name, plus the period via `fileName()`) and a `build(filters)` function that returns `{ summary, columns, rows }`, or `{ summary, sections }` for the Analytical Report (each section: title, an optional bar or pie chart, a table and a Total row). It handles status and date-range filters, the admin's timezone (`tzOffset`) and Philippine time formatting. The result is passed to `pdfService` or `excelService`. |
| `pdfService.js` | Generic branded table PDF (`pdfkit`): header with logos, summary block, one table or several sections (with vector bar and pie charts drawn by `drawChart`, and bold Total rows), page breaks, and page-number footers. |
| `excelService.js` | The Excel version (`exceljs`): header rows, summary, one table or several sections (no charts), and column widths. |
| `archiveService.js` | Report archiving. `ensureSchema()` adds the columns and settings table. `runAutoArchive()` sets `archived_at = NOW()` on Resolved and Dismissed rows whose `COALESCE(resolved_at, submitted time)` is older than the configured number of months (`resolved_at` is the closing time for both). `setArchived(type, id, bool)` archives only Resolved or Dismissed reports. `startScheduler()` runs the setup, then auto-archives now and every 6 hours. |
| `announcementArchiveService.js` | Announcement archiving: the `announcement_auto_archive_months` setting (0, 3, 6 or 12; default 0 = Off), `runAutoArchive()` (announcements posted longer ago than that), `setArchived(id, bool)`, and a 6-hour scheduler. |
| `adminPresence.js` | An in-memory map from admin id to "last seen". `verifyAdmin` updates it on every admin request. An admin counts as online if seen in the last **2 minutes**; the admin panel polls every 30 seconds while open. |
| `logArchiveService.js` | Log archiving for `signin_logs` and `admin_activity_logs`. Same idea as `archiveService`, but in days (0, 30, 90, 180 or 365; default 90) with one setting per log. `runAutoArchive(log?)` sets `archived_at` on entries older than the period; nothing is deleted. Runs on start and every 6 hours. |
| `siteContentService.js` | The public contact details, stored as JSON under `system_settings.site_contacts`: `emergencyContacts` (the call button), `footerHotlines` (the footer's Emergency Hotline, its own list without the officials), `officials` (`position`, `firstName`, `middleName`, `lastName`, `number`, `numberType`, plus `name` for display) and `socials`. Holds the defaults, the allowed icons and colors, `checkNumber()` (Mobile / Landline), the upgrades for older saved data, and `validate()`. Default contacts keep a `sublabelKey` so their description stays translated until an Admin edits it. |
| `siteMediaService.js` | The two carousels and two videos, stored as JSON under `system_settings.site_media`. A video is `{ source: "none" | "upload" | "youtube", url }`; the Video for Residents (`systemDemo`) has `showOnLanding` and `showInNews` (default off). Holds the defaults, `validate()` and `hideNewsVideoOnce()`. |
| `mainAccount.js` | `ensureMainAccount()`: creates the barangay's main Admin account if missing, or restores it to an Active Admin. |
| `systemSettingService.js` | Turns the `system_settings` rows into a `{ key: value }` object. |

### 3.8 Models

Each model is a class of `static async` methods that run parameterized SQL through the pool.

| Model | Table | Notable methods |
|---|---|---|
| `User.js` | `registered_users` | `findByEmail`, `findByUsername`, `findById` (no password), `findByIdWithPassword` (internal use only), `create`, `getAll` (with `archived_at`), `updateStatus` (reopening clears `archived_at`), `updateRole`, `ensureArchiveColumn`, `setArchived`, `updatePhoto`/`Username`/`Contact`/`Email`/`Password` |
| `Report.js` | `emergency_reports` | `create`, `findAll(filters)` (status and date range; used by lists and exports), `findByReporter`, `findById`, `findStatusById` (a light query that skips the media column), `update`, `updateStatus(id, status, dismissalReason)` (sets `resolved_at` when the status becomes Resolved or Dismissed, and `dismissal_reason` when Dismissed), `delete`, `getStatistics`, `getLatestReference` |
| `AssistanceRequest.js` | `assistance_requests` | The same set |
| `PettyCrime.js` | `petty_crimes` | The same set |
| `Announcement.js` | `announcements` | `create`, `findAll({ includeArchived })`, `findById`, `update` (keeps the old image if no new one is given), `clearImage`, `delete` |
| `AnnouncementComment.js` | `announcement_comments` | `ensureTable` (also adds `parent_id` to older databases), `create(announcementId, userId, text, parentId)`, `findByAnnouncement` (joins the author's name and role), `findById`, `delete` (also deletes replies), `countsForAll` |
| `AnnouncementLike.js` | `announcement_likes` | `ensureTable`, `toggle`, `countFor`, `countsForAll`, `likedAnnouncementIdsFor(userId)` |
| `Notification.js` | `notifications` | `ensureColumns`, `create` (optional `commentId`); staff: `findAll({ archived })`, `unreadCount`, `markAsRead`, `markAllAsRead`, `markManyAsRead(ids)`, `setArchived(ids, bool)` (all where `user_id IS NULL`; counts skip archived ones); personal: `findByUser`, `unreadCountForUser`, `markAsReadForUser`, `markAllAsReadForUser` |
| `Log.js` | `signin_logs` | `ensureColumns`, `logSignin(name, email, status, { ip, device })`, `setSigninLocation`, `getSigninLogs({ archived, role, status, from, to, residentsOnly })` (joined with the account's current role) |
| `ResidentActivity.js` | `resident_activity_logs` | `ensureTable`, `record(userId, email, action, details)`, `forEmailsSince(emails, since)` |
| `AdminActivity.js` | `admin_activity_logs` | `ensureTable`, `record(admin, action, details)`, `getRecent(limit, { archived, role, from, to })` (joined with the account's current role), `getAdminSummaries()` (each Admin/Official account with its role, contact number, last login and latest action) |
| `Dashboard.js` | several | `getStatistics()`: the user count, emergency report counts by status and the announcement count |
| `SystemSetting.js` | `system_settings` | `getAll`, `get(key)`, `update(key, value)` |

### 3.9 Utils

| File | Purpose |
|---|---|
| `utils/jwt.js` | `generateToken(user)` signs `{ id, role }` with `JWT_SECRET`, valid for **7 days** |
| `utils/roles.js` | Role constants (`resident`, `admin`, `super_admin`), `ROLE_LABELS` / `roleLabel()` (Resident, Official, Admin), `isAdminRole()` / `isSuperAdminRole()`, and `MAIN_ACCOUNT_EMAIL` / `isMainAccount()` |
| `utils/statusWorkflow.js` | `STATUS_ORDER = Received → In Progress → Resolved`. `validateStatusTransition(current, next)` only allows moving **one step forward**, or to **Dismissed** from any open status (Dismissed is final, like Resolved). Reports with older statuses (such as "Dispatched") can only move to "Received" first. It returns the reply message sent to the resident. `validateDismissalReason()` and `dismissalMessage()` handle the dismissal reason; `CLOSED_STATUSES` = Resolved, Dismissed. |
| `utils/reference.js` | `generateReference(getLatestFn)` returns `SC-<year>-<6-digit number>`, which restarts at 1 each year. Each report table has its own sequence. |
| `utils/signinContext.js` | Works out the client's IP (Azure's `X-Client-IP` header, then the last `X-Forwarded-For` entry, then the socket address). Turns the User-Agent and optional browser hints into text such as "Phone · Samsung SM-S918B · Android 14 · Chrome". `lookupLocation(ip)` asks ipapi.co for "City, Region, Country · ISP" (skipped for private IPs). |

### 3.10 Background work and in-memory state

| What | Where | Lost on restart? |
|---|---|---|
| Auto-archive (on start, then every 6 hours) | `archiveService`, `announcementArchiveService`, `logArchiveService` | No, all state is in MySQL |
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
   ├──< announcement_comments.user_id      (ON DELETE CASCADE)
   ├──< announcement_likes.user_id         (ON DELETE CASCADE)
   └──< notifications.user_id              (ON DELETE CASCADE; NULL = staff notification)

announcements (id)
   ├──< announcement_comments.announcement_id  (ON DELETE CASCADE)
   └──< announcement_likes.announcement_id     (ON DELETE CASCADE)
announcement_comments.parent_id → announcement_comments.id  (a reply; NULL = top-level comment)

signin_logs          matched to accounts by email_address (no foreign key)
resident_activity_logs  user_id / email_address (no foreign key), matched to sign-ins by email
admin_activity_logs  admin_id (no foreign key, so entries survive account changes)
system_settings      key/value
```
Deleting a user keeps their reports, which become anonymous, but deletes their personal notifications.

### Tables

**`registered_users`**: accounts
`id`, `full_name`, `username` (unique), `contact_number`, `email_address` (unique), `password` (bcrypt hash), `role` (`resident` / `admin` / `super_admin`), `photo_url` (`/uploads/…`), `status` (`Active` / `Pending` / `Suspended` / `Closed`), `created_at`, `archived_at` (archived Closed accounts).

**`emergency_reports`**
`id`, `report_reference` (`SC-YYYY-NNNNNN`), `reporter_id`, `time` (submitted), `emergency_type`, `severity`, `reporter_name`, `contact_number`, `location`, `latitude`, `longitude`, `incident_details`, `number_of_people_affected`, `special_needs`, `photo_url` (base64 data URL, `LONGTEXT`), `media_type` (image / video), `status` (`Received` / `In Progress` / `Resolved` / `Dismissed`), `assigned_to`, `assigned_at`, `resolved_at` (when it was closed), `archived_at`, `dismissal_reason`, plus the report-for-someone-else fields: `report_for` (`self` / `others`), `victim_name`, `victim_contact`, `victim_relationship`, `victim_details`.

**`assistance_requests`**
`id`, `report_reference`, `reporter_id`, `timestamp`, `request_assistance_type`, `full_name`, `contact_number`, `email_address`, `current_location`, `latitude`, `longitude`, `number_of_people_needing_help`, `urgency_level` (no longer asked), `describe_your_situation`, `special_needs`, `status`, `resolved_at`, `archived_at`, `dismissal_reason`, plus the same report-for fields.

**`petty_crimes`**
`id`, `report_reference`, `reporter_id`, `timestamp`, `crime_type`, `reporter_name`, `contact_number`, `location`, `latitude`, `longitude`, `description`, `suspect_info`, `status`, `resolved_at`, `archived_at`, `dismissal_reason`, plus the same report-for fields.

> The report-for columns (`report_for`, `victim_*`) are used by the models but are **not yet in `safeconnect_db.sql`**. See README → Known Issues.

**`announcements`**
`id`, `title`, `category`, `message`, `date_posted`, `image_path`, `source_url`, `source_title`, `source_image`, `source_site` (the link preview), `created_by`, `created_at`, `archived_at`.

**`announcement_comments`**
`id`, `announcement_id`, `user_id`, `parent_id` (the comment this one replies to; NULL for a top-level comment), `comment_text`, `created_at`. Replies are one level deep.

**`announcement_likes`**
`id`, `announcement_id`, `user_id`, `created_at`. One like per user per announcement (unique key).

**`notifications`**
`id`, `user_id` (NULL means a staff notification; otherwise it belongs to that resident), `title`, `message`, `notification_type` (`emergency`, `assistance`, `petty_crime`, `announcement`, `*_status`, `comment_reply`, `announcement_comment`), `reference_id` (the report or announcement id), `comment_id` (for `announcement_comment`), `is_read`, `created_at`, `archived_at` (staff notifications archived from the Notifications page).

**`signin_logs`**
`id`, `full_name`, `email_address`, `status` (`Success` / `Failed`), `ip_address`, `device`, `location`, `timestamp`, `archived_at`.

**`resident_activity_logs`**
`id`, `user_id`, `email_address`, `action` (Signed out, Submitted / Edited / Deleted … report), `details` (the report reference), `created_at`.

**`admin_activity_logs`**
`id`, `admin_id`, `admin_email`, `admin_username`, `action`, `details`, `created_at`, `archived_at`.

**`system_settings`**
`setting_key` (primary key), `setting_value` (`TEXT`). Holds `report_auto_archive_months` (`0`, `6` or `12`), `announcement_auto_archive_months` (`0`, `3`, `6` or `12`), `signin_log_auto_archive_days` and `admin_log_auto_archive_days` (`0`, `30`, `90`, `180` or `365`), `site_contacts` and `site_media` (JSON, once an Admin has saved changes), and the one-time marker `site_media_news_off_v1`.

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
5. `logResidentActivity("Submitted emergency report")` records it for the Activity column of Resident Logs.
6. The admin panel reloads right away through the live-update channel (or the 30-second refresh), so the **admin bell** shows the notification and the report appears in the Emergency Reports tab. "See report" in the bell opens that report with its details showing.

### An admin moves a report forward, and the resident is told
1. **Admin, `StatusSelect.jsx`**: clicking the blue "Move to In Progress →" (or the green "Move to Resolved →") opens **`StatusConfirmModal`**, which shows the message the resident will receive.
2. `useAdminData.updateStatus(id, "In Progress", "emergency")` calls `PUT /emergency-reports/:id/status`.
3. **Backend** (see the [pipeline example](#32-the-request-pipeline)):
   - checks the transition
   - updates the status (and sets `resolved_at` when the new status is **Resolved**)
   - creates a **personal notification** for `reporter_id` (`emergency_status`)
   - logs the admin action
4. **Resident:** the bell shows the update. Clicking it opens **My Reports**, where the progress stepper shows In Progress and the card says "Help is on the way. Our responders have received your report and are on their way."

### An admin dismisses a report
1. **Admin, `StatusSelect.jsx`**: on an open report, the red **Dismiss** button opens `StatusConfirmModal` in dismiss mode, which asks for a reason (5–500 characters) and previews the message to the resident.
2. `updateStatus(id, "Dismissed", type, reason)` sends `{ status: "Dismissed", reason }` to the status endpoint.
3. **Backend:** `validateStatusTransition` allows it (not from Resolved or Dismissed); the model saves the status, `resolved_at` and `dismissal_reason`; the reporter gets "Your report was dismissed by the barangay. Reason: …"; the admin log includes the reason. The account isn't suspended.
4. **Admin:** the report shows a Dismissed pill and `DismissalNote` (the reason) at the top of its details; it can be archived. **Resident:** My Reports shows Dismissed ("Kinansela" in Tagalog) with the reason.

### Archiving
- **By hand:** a Resolved or Dismissed report's card shows **Archive** (`ArchiveButton`). Clicking it calls `PATCH /reports/emergency/:id/archive`, which sets `archived_at`. `useAdminData.setReportArchived` updates the local list, and the report moves to the **Archived** tab (`ArchiveToolbar`). **Restore** clears `archived_at`.
- **Automatically:** `archiveService` runs every 6 hours and archives Resolved and Dismissed reports older than the chosen period. A super admin changes the period in `ArchiveToolbar`, which calls `PUT /reports/archive-settings` and archives immediately.
- **What archiving does:** the API still returns archived reports, with `archived_at` set. `ReportsPage` only chooses **which list** shows them, so the dashboard counts and exports still include them.
- **Announcements:** archived from their Edit form (`PATCH /announcements/:id/archive`) or by `announcementArchiveService` (Off by default). The public list leaves them out; the admin list asks for `includeArchived=1` and splits Active / Archived.
- **Notifications:** ticked on the Notifications page and archived with `PUT /notifications/archive` (shared by all staff).
- **Accounts:** a Closed account's **Archive** button on the Users tab (`PATCH /users/:id/archive`).

### An admin posts an announcement
1. **`CreateAnnouncementView.jsx`**: the admin fills in the title, category, message and date, and adds an image or pastes a link. A pasted link calls `fetchLinkPreview()`, which calls `GET /announcements/link-preview`.
2. On save, it builds a `FormData` and calls `createAnnouncement()`, which sends `POST /announcements` as multipart data.
3. **Backend:**
   - `verifyAdmin`
   - multer saves the image to `uploads/`
   - `logActivity("Created announcement")`
   - `AnnouncementService.create`: inserts the row, creates the staff notification, and **emails every active resident** in the background
4. **Residents:** `useAnnouncements` polls `GET /announcements` every minute. The news appears in the **NewsOverlay** and the bell (announcements count as read or unread per browser, in `localStorage`).

### A resident comments and the barangay replies
1. **Resident, `AnnouncementCard.jsx`**: opening **Comment** loads `GET /announcements/:id/comments`. Posting calls `postAnnouncementComment(id, text)`, which sends `POST /announcements/:id/comments`.
2. **Admin, `AnnouncementComments.jsx`** (opened with **Comments** on an announcement card): the admin clicks **Reply** under the resident's comment, types the reply and clicks **Reply**. This calls `postAnnouncementComment(id, text, parentId)`.
3. **Backend, `createComment`**:
   - checks that `parentId` belongs to the same announcement (a reply to a reply attaches to the top-level comment)
   - inserts the row with `parent_id`
   - because the author is an admin, creates a personal `comment_reply` notification for the resident, with `reference_id` set to the announcement
   - when a resident comments or replies, creates a staff `announcement_comment` notification (with `comment_id`); Officials and Admins can answer it from **General → Notifications** (`ReplyBox`, which posts a reply with that `parentId`)
4. **Resident:** the bell shows "Barangay replied to your comment". Clicking it opens the News page at that announcement. The reply appears under the comment with an @mention and a "Barangay Admin" tag, with a "Hide replies" toggle.

### Generating a PDF or Excel report
1. **`GenerateReportButton`** or **`GenerateReportModal`**: the admin picks the status, date range and format.
2. `exportReport(type, format, filters)` calls `GET /export/pdf/emergency?status=Resolved&from=…&to=…&tzOffset=-480`.
3. **Backend:** `verifyAdmin` (and `verifySuperAdmin` for the system types), then `logActivity("Generated report")`, then `ExportService`:
   - `EXPORTERS.emergency.build(filters)` returns `{ summary, columns, rows }`
   - `PDFService` or `ExcelService` streams the file
4. The browser receives a blob, and `api.js` creates a temporary `<a download>` link to save it.

### Signing in to a closed or suspended account
1. **Backend, `signin`:** after the password check, an account that isn't Active gets `{ success: false, code: "ACCOUNT_CLOSED" | "ACCOUNT_SUSPENDED" | … }`. The attempt is logged as Failed.
2. **`Hero.jsx`:** closes the sign-in box and calls `showAccountStatusPopup(code, t, email)` (`components/shared/accountStatusPopup.js`). This shows the translated explanation with the support email from the site contacts. **`SignInModal.jsx`** on `/admin` does the same but keeps its box open.

### An Admin edits the site contacts
1. **`SiteContactsPage.jsx`** (Content → Page Contacts) loads `GET /site-content`, edits the lists locally in two groups (Call Button; Footer: officials, hotlines, socials), can **Preview** them (`EmergencyContactList` and `DonationFooter` with the draft), and saves with `PUT /site-content`.
2. The backend validates and stores the JSON in `system_settings`, and logs "Updated page contacts".
3. **Public pages:** `useSiteContent()` loads `GET /site-content` once per page load (showing the last cached copy, or the defaults, until then). The floating call button (`Hero.jsx`, `EmergencyReportSection.jsx`) reads `emergencyContacts`; `DonationFooter.jsx` reads `officials`, `footerHotlines` and `socials`.

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
| `i18n/translations.js` | The `en` and `tl` dictionaries, grouped by component, for the **landing page and resident app**. |
| `i18n/adminTranslations.js` + `i18n/adminText.js` | The **admin panel's** Tagalog, keyed by the English text: `tx("View details")` returns the Tagalog when the panel is in Tagalog, otherwise the English (untranslated text stays English). `AdminPage` calls `setAdminLanguage(language)` while rendering, so every admin component can use `tx()`. Generate Report is deliberately left in English. |

### 6.2 `Services/api.js`

This is the **only** place that calls the SafeConnect API. It groups:
- **Setup:** `API_ENDPOINTS`, token helpers (`getAuthToken`, `setAuthToken`, `clearAuthToken`), `apiFetch` (session-expiry detection), `resolveAssetUrl`.
- **Auth and profile:** `signinUser` (also sends device hints from `navigator.userAgentData`), `signupUser`, `fetchUserProfile`, `updateUsername`, `updateContact`, `updateEmail`, `changePassword`, `uploadProfilePhoto`.
- **Users (admin):** `fetchRegisteredUsers`, `updateUserStatus`, `updateUserRole`, `setUserArchived`.
- **Reports:** `fetch…`, `create…`, `update…`, `update…Status` and `delete…` for each of the three types. The fetch functions **map rows to camelCase** (for example `emergency_type` → `emergency`, `time` → `date`, `archived_at` → `archivedAt`).
- **Archive:** `archiveReport`, `restoreReport`, `fetchArchiveSettings`, `updateArchiveSettings`.
- **Announcements:** `fetchAnnouncements({ includeArchived })`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `fetchLinkPreview`, `archiveAnnouncement`, `fetchAnnouncementArchiveSettings`, `updateAnnouncementArchiveSettings`.
- **Logs:** `fetchSignInLogs`, `fetchAdminLogs`, `logoutAdmin`.
- **Notifications:** admin: `fetchNotifications({ archived })`, `markNotificationRead`, `markAllNotificationsRead`, `markNotificationsRead(ids)`, `archiveNotifications(ids, archived)`; resident: `fetchMyNotifications`, `markMyNotificationRead`, `markAllMyNotificationsRead`.
- **Other:** `fetchMyReports`, `exportReport` (blob download), and `updateStatus(type, id, status, reason)`, a generic helper that knows each type's URL and HTTP method (`reason` for a dismissal).

The only calls that bypass `api.js` are to **other** services (Nominatim, Open-Meteo), plus `Hero.jsx`'s small `apiPost()` helper for the code and reset endpoints.

### 6.3 Pages

| Page | What it does |
|---|---|
| `pages/LandingPage.jsx` | The public site: `Navbar`, `Hero` (sign-in and sign-up live here), `Services`, `About`, `Contact` and the footer. |
| `pages/ResidentPage.jsx` | Reads `sessionStorage.currentUser`, clears any Bootstrap modal backdrop left behind, and renders `ResidentNavbar`, `ResidentHero`, `EmergencyReportSection`, the footer and the **three report modals**. It keeps track of which modal is open. |
| `pages/AdminPage.jsx` | The admin panel's controller (it also passes the navigation `focus`, e.g. the report a notification opens). It combines `useAdminAuth` (session and role), `useAdminData` (all data and actions) and `useAdminNavigation` (current tab). It holds the **filter state for every tab**, loads everything once signed in, and **refreshes every 30 seconds** (except while an announcement is being edited). It hides System tabs from non-super admins and renders the current tab inside `AdminLayout`. It shows `SignInModal` when not signed in or when the session expires. |

### 6.4 Landing components (`components/landing/`)

| Component | What it does | Talks to backend? |
|---|---|---|
| `Navbar.jsx` | Public top navigation with smooth scrolling to sections, a mobile menu and the language toggle. | No |
| `Hero.jsx` | The landing hero and **all account dialogs**: sign-in, sign-up (form, then 6-digit code step with a 60-second resend timer), and forgot password (email → code → new password → done). Also has an emergency-hotline call button. After sign-in it stores the token and redirects by role. | Yes: `signinUser()` and the `/auth/*` code endpoints |
| `DemoVideoSection.jsx` | Between the carousel and "What you can do": the Video for Residents, or a "coming soon" placeholder. Hidden when an Admin turns it off. | Reads `useSiteMedia()` |
| `Services.jsx` | Cards describing what SafeConnect offers (translated). | No |
| `About.jsx` | About the project and barangay (translated). | No |
| `Contact.jsx` | Barangay contact details and hotlines (translated). | No |

### 6.5 Resident components (`components/resident/`)

| Component | What it does | API calls |
|---|---|---|
| `ResidentNavbar.jsx` | The resident's top bar and the hub of the resident app. It uses the navbar hooks to load **announcements, notifications, weather and the profile**, polls every minute, switches between desktop and mobile layouts, and opens **NewsOverlay**, **MyReportsPage** and **SettingsPage** as overlays. Clicking a notification marks it read and opens the related news article or My Reports. A `comment_reply` notification opens the announcement the reply is on. Logout clears the resident token and storage. | `clearAuthToken` (the hooks do the fetching) |
| `ResidentHero.jsx` | A welcome banner at the top of the resident page. | No |
| `EmergencyReportSection.jsx` | Cards for **Report Emergency**, **Request Assistance** and **Report Petty Crime** that open the matching modal, plus an emergency call button. | No |
| `ResidentEmergencyModal.jsx` | The emergency report form: type (sets the severity automatically), details, people affected, special needs, **required photo or video** (JPG up to 20 MB, video up to 50 MB, converted to base64), a **map pin inside Santa Fe**, and self or someone-else fields. It applies a 1-hour cooldown per account, runs in **edit mode** when opened from My Reports with `editingReport`, and shows the reference number on success. | `createEmergencyReport`, `updateEmergencyReport` |
| `ResidentAssistanceModal.jsx` | The assistance request form: type (Food and Water, Medical Aid or Transport Vehicle), situation, people needing help, special needs, the map pin and self or someone-else fields. Same cooldown and edit mode. | `createAssistanceRequest`, `updateAssistanceRequest` |
| `ResidentPettyCrimeModal.jsx` | The petty crime form: crime type (with an "Other" option), description, suspect information, the map pin and the victim fields. Same cooldown and edit mode. | `createPettyCrimeReport`, `updatePettyCrimeReport` |
| `MyReportsPage.jsx` | A full-screen list of **every report the resident has submitted**. It has an overview bar, tabs by type, search and filters (including Dismissed), a status progress stepper and a status message on each card ("Help is on the way…" while In Progress; the reason for a Dismissed report), reference copy-to-clipboard, **edit** (reopens the matching modal with the data filled in) and **delete** (with confirmation). | `fetchMyReports`, `delete…` for each type |
| `SettingsPage.jsx` | Profile settings: photo (crop, then Save), full name, username, contact (+63 format), email (requires the current password) and password, plus **Install the app** (`shared/installApp.js`: the browser's install prompt, or Add to Home Screen steps on iPhone). Successful changes update the navbar right away (`onProfileUpdate`). | `fetchUserProfile`, `uploadProfilePhoto`, `updateUsername`, `updateContact`, `updateEmail`, `changePassword` |

#### Navbar pieces (`components/resident/navbar/`)
| Component | What it does |
|---|---|
| `DesktopNavbar.jsx` | The wide-screen bar: links, news, the notification bell, weather, the language toggle and the user dropdown. |
| `MobileNavbar.jsx` / `MobileMenu.jsx` | The phone bar and its slide-out menu with the same features. |
| `NotificationPanel.jsx` | The notification dropdown list, with category colors and "mark all read", and "See all". |
| `NotificationsPage.jsx` / `SwipeToArchive.jsx` | The resident Notifications page: Inbox / Archived, All / Unread / Read, checkboxes and select all, archive / restore / delete, swipe to archive on phones, pages in the My Reports style (`resident/ResidentPagination.jsx`). Opening one goes to the exact report, reply or article. |
| `NewsOverlay.jsx` | A full-screen news feed built from `AnnouncementCard`s. It can scroll to a specific article. |
| `AnnouncementCard.jsx` | One announcement: its image, the linked article's preview image, or a placeholder showing the source site. Its action bar has **Like**, **Comment** and **Share**. Comments are shown as YouTube-style threads: replies (from the barangay) sit under the comment they answer, with an @mention, a smaller avatar, a "Barangay Admin" tag and a "N replies / Hide replies" toggle. Residents can delete their own comments. |
| `UserDropdown.jsx` | The avatar menu: My Reports, Settings, Logout. |
| `WeatherCard.jsx` | Shows the 7-day forecast from `useWeather`; each day can be opened for its hourly forecast. |
| `DemoVideoCard.jsx` | Right below the weather card in News: the Video for Residents, when one is set and "Show in the resident News tab" is on (off by default). Not an announcement (no comments or likes). |
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
| `hooks/useAdminData.js` | **The admin data store.** Holds every list (the three report types, users, sign-in logs, admin logs, announcements, notifications) and exposes: `loadAllData` (first load), `refreshAllData` (silent 30-second refresh), `handleRefresh(view)` (reload only the current tab), `updateStatus` (with a dismissal reason), `updateUserRole`, `setUserArchived`, `setReportArchived`, notification functions (`markOneRead`, `markAllRead`, `markManyRead`, `archiveNotifications`) and `handleFormSubmit`. System-tab data loads only for super admins. |
| `hooks/useAdminNavigation.js` | The current tab (`activeView`, kept in `sessionStorage.sc_admin_view` so a browser reload stays on it), mobile menu state, the announcement being edited, `focus` (`handleNavigation(view, { focusId })`: the report or notification to open on arrival) and navigation helpers. |
| `hooks/useIsMobile.js` | `true` below the phone breakpoint used in `admin.css`. |

#### Layout
| Component | What it does |
|---|---|
| `layout/AdminLayout.jsx` | The page shell: sidebar and header around the current tab. |
| `layout/AdminSidebar.jsx` | Navigation groups: General (Dashboard, Notifications); Reports (Emergency, Assistance, Petty Crime); Content (Announcements, plus **Page Contacts** and **Page Contents** for Admins only); **System** (Users, Resident Logs, Admin Logs), which only Admins see. On phones it becomes a drawer, opened by the ☰ button, with a Logout at the bottom. |
| `layout/AdminHeader.jsx` | Sticky at the top. On phones a ☰ menu button before the page title; the title; the refresh button (with the last update time); the **notification bell** (`AdminNotificationPanel`); and the account menu (profile picture, on phones too) with Account Settings, the demo video and Logout. |
| `layout/AdminStats.jsx` | The dashboard counters: the three report types (in the resident page's report colors), the other totals (outlined), Create Announcement and Total Reports. Sized by the card's width (container queries in `admin.css`); `compact` on phones shows only Create Announcement and Total Reports. |

#### Dashboard (`dashboard/`)
| Component | What it does |
|---|---|
| `Dashboard.jsx` | Lays out the dashboard. On phones it shows the summary and a toggle between Recent Reports and Analytics. All numbers are **worked out from the lists `useAdminData` already loaded**. |
| `DashboardSummary.jsx` | The greeting, the one-line intro and `AdminStats`. |
| `ReportsOverTimeChart.jsx` | A Recharts bar chart over the last 7, 15, 30 or 90 days, by category or overall. Days are counted in local time. It has its own Generate Report button (`reportsOverTime`). |
| `DashboardCharts.jsx` + `PieChartCard.jsx` | Status pie charts for each report type (`statusSummary` export). |
| `DashboardRecentReports.jsx` | The latest reports across all three types, sorted newest first. |
| `DashboardAlerts.jsx`, `DashboardQuickActions.jsx` | Kept for possible future use. They are imported but **not rendered**. |

#### Reports (`reports/`)
| Component | What it does |
|---|---|
| `ReportsPage.jsx` | Picks the Emergency, Assistance or Petty Crime tab, and applies the **Active/Archived split**, status filter, "filed for" filter and search. Renders `ArchiveToolbar` above the list. With `focusId` (from a notification) it shows only that report, opened, with a "Show all reports" bar. |
| `emergency/EmergencyPage.jsx` → `EmergencyReportsTable.jsx` → `EmergencyReportDetails.jsx` | Each report is a `ReportCard` (red accent; the status pill after the title's pills) with a `StatusSelect`, an `ArchiveButton`, and expandable details (`DismissalNote` for a dismissed one) including the photo or video and the map. |
| `assistance/…` | The same structure for assistance requests (with an "N people" pill). |
| `pettyCrime/…` | The same structure for petty crimes. |
| `shared/ArchiveToolbar.jsx` | The **Active (n) / Archived (n)** switch and the auto-archive period (super admins get a dropdown; other admins see it as text). Used by the report tabs, Announcements, Users and the logs. On phones the two tabs span the width and the setting sits below (`archive-toolbar*` in `admin.css`). |
| `shared/ArchiveButton.jsx` | **Archive** on Resolved and Dismissed reports and **Restore** on archived ones. |
| `shared/DismissalNote.jsx` | The reason, at the top of a dismissed report's details. |
| `shared/ReportFor.jsx` | The "For <name>" pill, the person-affected details block and the "Filed for" filter, used when a report was filed for someone else. |
| `shared/ReportImage.jsx` | Shows the attached photo or video. |
| `shared/ReportLocationMap.jsx` | A read-only `LocationPickerMap` of the pinned spot (hidden if there's no pin). |

#### Announcements (`announcements/`)
| Component | What it does |
|---|---|
| `AnnouncementsPage.jsx` | The tab wrapper. |
| `AnnouncementsTable.jsx` | Manages itself: fetches (archived included), searches, sorts and paginates a card list, with an `ArchiveToolbar` (Active / Archived, auto-archive period), and handles edit, delete and archive / restore with a `ResultPopup`. It opens the create modal right away when reached from the dashboard shortcut. Each card also has **Comments** (with a count) and **Share**. |
| `AnnouncementComments.jsx` | The comments panel under a card: residents' comments as YouTube-style threads, **Reply** (opens a reply box under the comment, with Cancel and Reply), a "N replies / Hide replies" toggle, **Delete** for moderation (removes replies too), and a box to comment as the barangay. Keeps the card's count in sync. |
| `AnnouncementShareButton.jsx` | The **Share** menu: the device's share sheet (where the browser supports it), **Share on Facebook**, or **Copy announcement** (title, message and link). Links to the news article for link announcements, otherwise to the public SafeConnect site. |
| `AnnouncementModal.jsx` | A popup around `CreateAnnouncementView` (Esc or clicking outside closes it). |
| `CreateAnnouncementView.jsx` | The create and edit form: image upload with preview and remove, a **pasted link with automatic preview**, and multipart submission; in edit mode an **Archive** / **Restore** button. Form contents are kept if the session expires. |
| `constants.js` | Announcement categories. |

#### Users, Logs, Modals
| Component | What it does |
|---|---|
| `users/UsersPage.jsx` | An `ArchiveToolbar` (Active / Archived accounts), then filters users by search and status and splits them into Residents and Admins & Officials. |
| `users/RegisteredUsersTable.jsx` | Two tables, **Residents** then **Admins & Officials**, under one shared search / status filter / Generate Report row (the second `ListView` uses `showFilters={false}`). Inline `UserRoleSelect` and `UserStatusSelect`; every change is confirmed in `UserChangeConfirmModal`. Your own account and the main barangay account ("Main account" badge) are locked. Closed accounts get **Archive** (archived ones **Restore**). |
| `logs/LogsPage.jsx` | Switches between Resident Logs and Admin Logs, and filters sign-ins. |
| `logs/SignInLogsTable.jsx` | Residents only: user, time, **Activity** (what they did until their next sign-in; the first three, then "Show N more"), **Device & IP address** (device, then IP, then location) and status. An `ArchiveToolbar` switches between Active and Archived sign-ins and sets the auto-archive period. It filters and exports whichever list is showing. |
| `logs/AdminLogsTable.jsx` | Admin & Official account cards (role badge, **online / last seen**, latest action), plus the searchable activity list with an `ArchiveToolbar` for Recent / Archived activity and its auto-archive period. |
| `logs/AdminLogsTable.jsx` (Details) | The accounts table also shows each Admin's / Official's full name and phone number (a `tel:` link). |
| `logs/logArchive.js` | The auto-archive period choices for the logs (Off, 30 days, 90 days, 6 months, 1 year). |
| `settings/SiteContentsPage.jsx` | Content → Page Contents (Admins only): the two carousels (upload, describe, reorder, remove with a confirmation) and the Video for Residents (landing page and/or News tab switches) and admin demo video (upload with progress or YouTube link, title, caption, show/hide switches, live preview). Titles up to 40 characters; **Preview** shows everything before saving. |
| `settings/AccountSettingsPage.jsx` | Account Settings for the signed-in Admin or Official, opened from the account menu: photo, username, contact number, email (locked for the main account) and password. |
| `AdminModals/AdminDemoPopup.jsx` | The admin demo video popup. Shown once after a fresh sign-in (the sign-in screens call `markAdminJustSignedIn()`) unless the person ticked "Don't show this after signing in"; also opened by "Watch demo video" in the account menu. |
| `settings/SiteContactsPage.jsx` | Content → Page Contacts, in two groups. **Call Button:** the emergency contacts (name, description, number, icon, preset or custom color, order, and people to choose from); 911 is locked. **Footer:** the barangay officials (position, first, middle, last name, number, order), the Emergency Hotline list and the socials. Numbers use `PhoneNumberInput` (Mobile / Landline, fixed +63, digits only). Text up to 40 characters; removing anything asks first (`confirmPopup`). Sticky Save / **Preview** / Discard bar. |
| `settings/PhoneNumberInput.jsx` | Mobile (10 digits) / Landline (9 digits) selector, a fixed "+63" and a digits-only box; returns `{ number: "+63…", numberType }`. |
| `notifications/AdminNotificationPanel.jsx` | The bell's dropdown, in the residents' panel style: Unread / Read tabs, Mark all as read, the 8 most recent, and "See all notifications". On phones a card under the header. |
| `notifications/NotificationsPage.jsx` | General → Notifications, like a mailbox: Inbox / Archived, All / Unread / Read, a checkbox per row and select all, **Archive** / **Restore** and **Mark as read**, 20 per page. Opening one shows all of it with "See report", or a `ReplyBox` for a resident's comment. Opened from the bell with `focus`. |
| `notifications/notificationTypes.js` | Icon, color and destination for each `notification_type`; `notificationTarget(item)` gives `{ view, focusId }`. |
| `AdminModals/SignInModal.jsx` | The admin sign-in box, also shown when the session expires. |
| `AdminModals/FormModal.jsx` | A generic "add record" form, built with `shared/formUtils.js`. It is still wired into `AdminPage` but **no button opens it** at the moment. |

#### Shared admin building blocks (`shared/`)
| Component | What it does |
|---|---|
| `ListView.jsx` | The standard list page: search, status filter, extra filters, sort, an "Add" button, a **Generate Report** button, and a table or card layout with **pagination**. It resets to page 1 when filters change, but not on a background refresh. Optional `sectionTitle`, `showFilters` and `exportFilters` props. |
| `Table.jsx`, `Section.jsx` | Table shell (headings translated with `tx`; on phones each row becomes a card, every cell labelled with its column name through `data-label`) and card wrapper. |
| `Pagination.jsx` | Page numbers with gaps ("…"), "Showing x–y of z", and a rows-per-page picker. |
| `ReportCard.jsx` | A collapsible report row: accent color, title, tag pills, then the status pill; actions and View / Hide details on the right; details below. |
| `StatusSelect.jsx` | A **forward-only** status control: a "Move to …" button in the next status's color (blue In Progress, green Resolved) and a red **Dismiss** for open reports. `statusBadge(status)` gives the pill shown beside the title. |
| `StatusConfirmModal.jsx` | Confirms a status change and shows the reply the resident will receive. For Dismiss it asks for the reason. |
| `StatusBadge.jsx` | A colored pill for any status (grey for unknown values). |
| `GenerateReportButton.jsx` | A PDF/Excel dropdown, or opens `GenerateReportModal` when `withOptions` is set. |
| `GenerateReportModal.jsx` | Report tabs: status (Dismissed included), period (preset or custom; custom dates from 2026-09-01 to today) and format. System tabs (`SYSTEM_REPORTS`: users, signinLogs, adminLogs): role, status (not for admin logs) and a manual From / To range. Then `exportReport()`, with the tab's own filters (e.g. `archived`) passed through `baseFilters`. |
| `ResultPopup.jsx` | Success or error popup used instead of `alert()`. |
| `DetailField.jsx` | A label and value pair in detail views. |
| `chartUtils.js` | Status colors and grouping for the pie charts. |
| `formUtils.js` | Builds report submissions from `FormModal` data. |
| `timeUtils.js` | `timeAgo()` ("5m ago"). |

### 6.7 Shared components (`components/shared/`)

| Component | What it does |
|---|---|
| `PrivacyPolicyModal.jsx` | The Privacy Policy (RA 10173), opened from the footer. |
| `DonationFooter.jsx` | The site footer (translated), used on the landing and resident pages, in three columns: the logo beside the name and description; Contact Us with the barangay officials; the Emergency Hotline (`footerHotlines`, its own list) and socials. Then the "Created by Group Tres" credit. Everything comes from `useSiteContent()` (edited under Content → Page Contacts → Footer); the `content` prop shows unsaved changes in the Preview. |
| `EmergencyContactList.jsx` | The contacts inside the floating call button (a contact with `choices` asks who to call). `formatMobile()` formats mobile and landline numbers. |
| `useSiteContent.js` | Loads the site contacts once per page load and shares them with every component; caches the last copy in `localStorage` (`sf_siteContent`) and has the defaults built in. `contactDescription(contact, t)` shows the translated default description until an Admin changes it; `officialName(o)` joins an official's position and name. `useSiteMedia()` does the same for the carousel photos and demo videos (`sf_siteMedia`); `mediaSrc()` turns an uploaded path into a full URL. |
| `DemoVideoPlayer.jsx` | Plays a video (uploaded file or YouTube embed) in a 16:9 frame with its title and caption, or shows a placeholder when none is set. Uploaded videos have no download button or "Save video" menu. |
| `installApp.js` | Listens for the browser's install prompt from page load; `useInstallApp()` for Settings → Install the app. |
| `roles.js` | `ROLE_LABELS` / `roleLabel()` (Resident, Official, Admin) and `MAIN_ACCOUNT_EMAIL`. |
| `accountStatusPopup.js` | `showAccountStatusPopup(code, t, email)`: the popup for a closed, suspended or inactive account at sign-in. |
| `LanguageGate.jsx` | A full-screen **English / Tagalog** picker, shown until a language is chosen. |
| `LanguageToggle.jsx` | A small EN/TL switch for the navbars and menus. |
| `location/LocationPickerMap.jsx` | A Leaflet map of Barangay Santa Fe with its boundary. Tap or drag to pin; Map/Satellite switch (OpenStreetMap / Esri imagery); `readOnly` mode for admin details. |
| `location/useLocationPin.js` | Shared pin logic for the three report forms: GPS ("Use my current location"), the inside-Santa-Fe check, and **reverse geocoding** with Nominatim (only the newest pin's result is used). |
| `location/santaFeArea.js` | The barangay **boundary polygon** (from OpenStreetMap, adjusted to match Google Maps), a point-in-polygon test, and a 25 m tolerance near the boundary, because GPS is only accurate to 10–30 m. |

### 6.8 Styles (`src/styles/`)

| File | Covers |
|---|---|
| `App.css` / `src/App.css` | Global and landing styles (including `.leaflet-container { isolation: isolate }`, which keeps maps under the sticky admin header and its menus) |
| `resident.css` | The resident app |
| `emergencyreport.css`, `residentemergencymodal.css`, `evacuation.css` | Report section and report modals |
| `admin.css` | The admin panel: buttons (`button-primary`, `button-soft`, `button-danger-soft`, `button-status-*`), the dashboard counters (`dash-stat*`, container queries), the bell panel on phones (`admin-notif-wrap`), and the phone layouts (`lv-*` list filters, `report-card-*`, `dash-summary-*`, `archive-toolbar*`) |

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
| `sc_admin_view` | sessionStorage | `useAdminNavigation` | The open admin tab, so a browser reload stays on it |

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
