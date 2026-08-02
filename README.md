# SafeConnect

***A Web-Based Community Disaster Response System***

**SafeConnect** is an online platform designed to strengthen community preparedness and response during disasters and emergencies. It lets residents report emergencies, request assistance, report petty crimes, and stay informed through announcements — while giving barangay/community administrators a dashboard to manage and respond to everything coming in.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Installation](#2-installation)
3. [Folder Structure](#3-folder-structure)
4. [Application Features](#4-application-features)
5. [Component Documentation](#5-component-documentation)
6. [Backend Documentation](#6-backend-documentation)
7. [Database Documentation](#7-database-documentation)
8. [API Reference](#8-api-reference)

---

## 1. Project Overview

### Purpose
SafeConnect gives a community two connected surfaces:
- **Residents** can sign up, sign in, submit emergency reports, request assistance, report petty crimes, browse announcements, and manage their own submitted reports and profile.
- **Admins** get a dashboard to view live statistics, manage every report type, publish announcements, manage registered users, and review sign-in/admin activity logs.

### Technology Used

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App), React Router 7, Bootstrap 5, Recharts, Leaflet/React-Leaflet (maps), SweetAlert2 |
| Backend | Node.js, Express 5 |
| Database | MySQL (via `mysql2`) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` password hashing |
| File uploads | `multer` (announcement images, profile photos) |
| Exports | `exceljs`, `pdfkit` (admin data export) |
| Security | `helmet`, `cors` |

### Architecture
This is a two-tier app: a React SPA (port 3000 in dev) talking to an Express REST API (port 5000 in dev) backed by MySQL. There is **no PHP** anywhere in the current codebase — an earlier PHP + XAMPP + phpMyAdmin version was migrated to this Node/Express/MySQL stack. The frontend never talks to the database directly; all data access goes through `src/Services/api.js`, which calls the Express routes documented below.

Authentication is JWT-based: signing in returns a token (`backend/utils/jwt.js`), which the frontend stores (`localStorage`, key `authToken`) and attaches as `Authorization: Bearer <token>` to every protected request (see `authHeaders()` in `src/Services/api.js`). The backend enforces access with `verifyToken` / `verifyAdmin` / `verifySelfOrAdmin` middleware (`backend/middleware/authMiddleware.js`).

---

## 2. Installation

### Prerequisites
- Node.js 18+ and npm
- A running MySQL server (5.7+/8+)

### 1. Install dependencies
```bash
# from the project root — installs the React app
npm install

# backend
cd backend
npm install
```

### 2. Set up the database
```bash
mysql -u root -p < database/safeconnect_db.sql
```
This creates the `safeconnect` database and all tables (see [Database Documentation](#7-database-documentation)).

### 3. Configure environment variables
Copy `backend/.env.example` to `backend/.env` and fill in your own values:
```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=safeconnect
DB_PORT=3306

JWT_SECRET=a_long_random_string
```
`backend/.env` is gitignored — never commit real credentials.

### 4. Run the backend
```bash
cd backend
npm run dev      # nodemon, auto-restart
# or
npm start        # node server.js
```
The API listens on `http://localhost:5000` by default; static uploads are served from `http://localhost:5000/uploads`.

### 5. Run the frontend
```bash
# from the project root
npm start
```
Opens `http://localhost:3000`. The frontend reads the API base URL from `REACT_APP_API_BASE` (defaults to `http://localhost:5000/api` if unset) — set it in a `.env` file at the project root if your backend runs elsewhere.

---

## 3. Folder Structure

```
safeconnect-app/
├── database/
│   └── safeconnect_db.sql        # Full DB schema (source of truth)
├── backend/
│   ├── server.js                 # Express app entry point, route mounting
│   ├── config/db.js              # MySQL connection pool
│   ├── controllers/              # Request handlers, one per resource
│   ├── models/                   # Direct SQL queries, one class per table (roughly)
│   ├── routes/                   # Express routers, one per resource
│   ├── services/                 # Business logic sitting between controllers and models
│   │                                (reference-number generation, notifications, link previews)
│   ├── middleware/                # authMiddleware.js (JWT/role checks), uploadMiddleware.js (multer)
│   ├── utils/                     # jwt.js (token signing), reference.js (report reference numbers)
│   └── uploads/                   # Uploaded announcement images & profile photos (gitignored)
├── public/                        # Static assets (images, favicon, manifest)
└── src/
    ├── Services/api.js            # The ONLY place that talks to the backend
    ├── pages/                     # Top-level routed pages: LandingPage, ResidentPage, AdminPage
    ├── components/
    │   ├── landing/                # Public marketing site (Hero, About, Services, Contact, Navbar)
    │   ├── resident/                # Resident-facing UI (report modals, navbar, settings, my reports)
    │   │   └── navbar/               # Navbar sub-features: announcements, notifications, weather
    │   ├── admin/                   # Admin dashboard
    │   │   ├── dashboard/              # Dashboard summary/charts/alerts/quick actions
    │   │   ├── reports/                 # Emergency / Assistance / Petty Crime report management
    │   │   ├── announcements/           # Announcement CRUD + link-preview UI
    │   │   ├── users/                   # Registered users management
    │   │   ├── logs/                    # Sign-in logs & admin logs
    │   │   ├── layout/                  # AdminLayout, sidebar, header, stat cards
    │   │   ├── hooks/                   # useAdminData, useAdminAuth, useAdminNavigation
    │   │   ├── shared/                  # Reusable table/list/status components
    │   │   └── AdminModals/             # Sign-in modal, generic add-record form modal
    │   └── shared/                   # Cross-cutting components (footer)
    └── styles/                     # Global and page-specific CSS
```

---

## 4. Application Features

| Feature | Frontend Component(s) | Backend Route(s) | Database Table(s) |
|---|---|---|---|
| Sign up / Sign in (JWT) | `landing/Hero.jsx`, `admin/AdminModals/SignInModal.jsx` | `POST /api/auth/signup`, `POST /api/auth/signin` | `registered_users`, `signin_logs`, `admin_logs` |
| Emergency reporting | `resident/ResidentEmergencyModal.jsx` | `/api/emergency-reports` | `emergency_reports` |
| Assistance requests | `resident/ResidentAssistanceModal.jsx` | `/api/assistance-requests` | `assistance_requests` |
| Petty crime reporting | `resident/ResidentPettyCrimeModal.jsx` | `/api/petty-crimes` | `petty_crimes` |
| My Reports (view/edit/delete own) | `resident/MyReportsPage.jsx` | `GET /api/reports/user/:userId` + per-type routes | all three report tables |
| Announcements (public feed) | `resident/navbar/AnnouncementCard.jsx`, `NewsOverlay.jsx` | `GET /api/announcements` | `announcements` |
| Announcements (admin CRUD + link preview) | `admin/announcements/*` | `/api/announcements/*` | `announcements` |
| Notifications bell (resident) | `resident/navbar/NotificationPanel.jsx`, `useNotifications.js` | derived from announcements client-side | `announcements` |
| Weather widget | `resident/navbar/WeatherCard.jsx` | external (Open-Meteo) | — |
| Profile settings (photo/username/password) | `resident/SettingsPage.jsx` | `/api/users/:id/photo`, `/username`, `/password` | `registered_users` |
| Admin dashboard (stats, charts, alerts, recent reports) | `admin/dashboard/*` | `GET /api/dashboard`, plus statistics endpoints per report type | all report tables, `registered_users`, `announcements` |
| Registered users management | `admin/users/*` | `GET /api/users`, `PUT`/`PATCH /api/users/:id` | `registered_users` |
| Sign-in logs | `admin/logs/SignInLogsTable.jsx` | `GET /api/logs/signin` | `signin_logs` |
| Admin logs | `admin/logs/AdminLogsTable.jsx` | `GET /api/logs/admin` | `admin_logs` |
| Data export (Excel/PDF) | admin dashboard export actions | `/api/export/*` | varies |
| System settings | *(backend scaffolding present; not yet wired to a frontend page)* | `/api/settings` | *(see `SystemSetting` model)* |
| Role-based access | `authMiddleware.js` (`verifyToken`, `verifyAdmin`, `verifySelfOrAdmin`) | applied across all protected routes | `registered_users.role` |

---

## 5. Component Documentation

> Grouped by area. Each entry lists purpose, key props/state, and which `Services/api.js` functions it calls.

### Landing (public site) — `src/components/landing/`
| Component | Purpose | Notes |
|---|---|---|
| `Hero.jsx` | Landing hero + sign-in/sign-up modals | Calls `signinUser`/`signupUser`, stores JWT via `setAuthToken`, redirects to `/resident` or `/admin` based on role |
| `Navbar.jsx` | Public site navigation | Static |
| `About.jsx`, `Services.jsx`, `Contact.jsx` | Marketing/info sections | Static, no API calls |

### Resident — `src/components/resident/`
| Component | Purpose | Key props / state | API calls |
|---|---|---|---|
| `ResidentHero.jsx` | Resident landing hero, entry points to report flows | `onReportEmergency`, `onRequestHelp` callbacks | none (presentational) |
| `EmergencyReportSection.jsx` | Report-type picker section | `onReportClick` callback | none |
| `ResidentEmergencyModal.jsx` | Submit/edit an emergency report; GPS + reverse geocoding + photo/video capture | `show`, `type`, `editingReport`, `onUpdated` | `createEmergencyReport`, `updateEmergencyReport` |
| `ResidentAssistanceModal.jsx` | Submit/edit an assistance request | `show`, `type`, `editingReport` | `createAssistanceRequest`, `updateAssistanceRequest` |
| `ResidentPettyCrimeModal.jsx` | Submit/edit a petty crime report | `show`, `editingReport` | `createPettyCrimeReport`, `updatePettyCrimeReport` |
| `MyReportsPage.jsx` | Full-screen overlay listing all of the current user's reports across all 3 types, with edit/delete | `isOpen`, `userId` | `fetchMyReports`, `deleteEmergencyReport`, `deleteAssistanceRequest`, `deletePettyCrimeReport` |
| `SettingsPage.jsx` | Profile photo, username, password management | `user`, `onProfileUpdate` | `fetchUserProfile`, `uploadProfilePhoto`, `updateUsername`, `changePassword` |
| `ResidentNavbar.jsx` | Top navigation: announcements, notifications, weather, profile dropdown, logout | composes navbar/* hooks | clears JWT on logout |

#### `src/components/resident/navbar/`
| Component/Hook | Purpose |
|---|---|
| `DesktopNavbar.jsx` / `MobileNavbar.jsx` / `MobileMenu.jsx` | Responsive navbar layouts |
| `AnnouncementCard.jsx`, `NewsOverlay.jsx` | Announcement feed display |
| `NotificationPanel.jsx` | Notification list UI |
| `UserDropdown.jsx` | Avatar/profile menu |
| `WeatherCard.jsx` | Current weather (Open-Meteo API) |
| `useAnnouncements.js` | Fetches/caches announcements | calls `fetchAnnouncements` |
| `useNotifications.js` | Derives notification items from announcements |
| `useResidentProfile.js` | Reads/writes the signed-in user from `sessionStorage` |
| `useWeather.js` | Fetches weather by geolocation (Open-Meteo, external) |
| `useClickOutside.js` | Generic outside-click-to-close hook |

### Admin — `src/components/admin/`
| Component | Purpose | API calls |
|---|---|---|
| `dashboard/Dashboard.jsx` | Composes the dashboard: summary cards, stats, alerts, charts, quick actions, recent reports | uses data already loaded by `useAdminData` |
| `dashboard/DashboardSummary.jsx`, `DashboardCharts.jsx`, `PieChartCard.jsx` | Stat summaries and charts | — |
| `dashboard/DashboardAlerts.jsx` | Pending-item alert banners per report type | — |
| `dashboard/DashboardQuickActions.jsx` | Shortcut buttons to navigate to report/announcement pages | — |
| `dashboard/DashboardRecentReports.jsx` | Combined recent-activity table across report types | — |
| `reports/emergency/`, `reports/assistance/`, `reports/pettyCrime/` | Page + table + detail-view + status-select per report type | `fetchXReports` (via `useAdminData`), status updates via `updateStatus` |
| `announcements/AnnouncementsPage.jsx` | Switches between the list view and the create/edit view | — |
| `announcements/AnnouncementsTable.jsx` | Self-contained: fetches, filters, sorts, paginates, deletes announcements | `fetchAnnouncements`, `deleteAnnouncement` |
| `announcements/CreateAnnouncementView.jsx` | Create/edit form incl. image upload and "paste a link" preview | `createAnnouncement`, `updateAnnouncement`, `fetchLinkPreview` |
| `users/UsersPage.jsx`, `RegisteredUsersTable.jsx`, `UserStatusSelect.jsx` | List + status management for registered users | status update via `updateStatus` |
| `logs/LogsPage.jsx`, `SignInLogsTable.jsx`, `AdminLogsTable.jsx` | Read-only log viewers | data passed down from `useAdminData` |
| `layout/AdminLayout.jsx`, `AdminSidebar.jsx`, `AdminHeader.jsx`, `AdminStats.jsx` | Shell layout, navigation, top-line stat cards | — |
| `AdminModals/SignInModal.jsx` | Admin sign-in gate | `signinUser`, stores JWT |
| `AdminModals/FormModal.jsx` | Generic "Add New Report/Announcement" form (field sets defined per `type`) | used with `formUtils.js` builders |
| `hooks/useAdminData.js` | Central data-fetching/mutation hook: loads all lists, exposes `updateStatus`, `handleFormSubmit` | calls nearly every `fetchX`/`createX`/`updateStatus` function |
| `hooks/useAdminAuth.js` | Admin auth/session state, logout (clears JWT) | — |
| `hooks/useAdminNavigation.js` | Active-view/sidebar navigation state | — |
| `shared/formUtils.js` | Builds report-submission payloads from the generic `FormModal` fields | — |
| `shared/chartUtils.js` | Color helpers for severity/status | — |

---

## 6. Backend Documentation

All controllers live in `backend/controllers/`, models in `backend/models/`, routes in `backend/routes/`, mounted in `backend/server.js`.

| Route file | Mounted at | Controller | Model(s) | Middleware |
|---|---|---|---|---|
| `authRoutes.js` | `/api/auth` | `authController.js` | `User.js` | none (public) |
| `userRoutes.js` | `/api/users` | `userController.js` | `User.js` | `verifyToken` + `verifyAdmin` (list/status) or `verifySelfOrAdmin` (own profile) |
| `emergencyReportRoutes.js` | `/api/emergency-reports` | `reportController.js` | `Report.js` | `verifyToken` (+`verifyAdmin` for list/status) |
| `assistanceRequestRoutes.js` | `/api/assistance-requests` | `assistanceRequestController.js` | `AssistanceRequest.js` | same pattern |
| `pettyCrimeRoutes.js` | `/api/petty-crimes` | `pettyCrimeController.js` | `PettyCrime.js` | same pattern |
| `reportRoutes.js` | `/api/reports` | `myReportsController.js` | `Report.js`, `AssistanceRequest.js`, `PettyCrime.js` | `verifyToken` — cross-table "my reports" aggregator only |
| `announcementRoutes.js` | `/api/announcements` | `announcementController.js` | `Announcement.js` | GET is public; create/update/delete/link-preview require `verifyAdmin` |
| `logRoutes.js` | `/api/logs` | `logController.js` | `Log.js` | `verifyToken` + `verifyAdmin` |
| `dashboardRoutes.js` | `/api/dashboard` | `dashboardController.js` | `Dashboard.js` | `verifyToken` + `verifyAdmin` |
| `exportRoutes.js` | `/api/export` | `exportController.js` | (reads from report/user models) | `verifyToken` + `verifyAdmin` |
| `systemSettingRoutes.js` | `/api/settings` | `systemSettingController.js` | `SystemSetting.js` | `verifyToken` + `verifyAdmin` |
| `notificationRoutes.js` | `/api/notifications` | `notificationController.js` | `Notification.js` | `verifyToken` (currently no frontend caller — see note below) |

**Services** (`backend/services/`) hold logic that doesn't belong directly in a controller or model: `reportService.js`, `assistanceRequestService.js`, `pettyCrimeService.js` (build DB records + trigger notifications), `announcementService.js` (create/update + Open Graph link-preview scraping), `notificationService.js`, `excelService.js`/`exportService.js`/`pdfService.js` (data export), `systemSettingService.js`.

**Utils** (`backend/utils/`): `jwt.js` (sign JWTs with `{id, role}` payload, 7-day expiry), `reference.js` (shared `SC-<year>-<sequence>` report reference number generator used by all three report types).

> **Known gap:** `notifications` table and `/api/notifications` route exist and work, but nothing in the current frontend calls them — the resident notification bell is currently derived client-side from the announcements feed instead (`useNotifications.js`). Wiring up a real admin/resident notification-center UI against `/api/notifications` is a natural next step, not something broken.

---

## 7. Database Documentation

Schema source of truth: `database/safeconnect_db.sql`. Database name: `safeconnect`.

### `registered_users`
| Column | Type | Notes |
|---|---|---|
| id | INT, PK, AI | |
| full_name | VARCHAR(255) | |
| username | VARCHAR(100) | UNIQUE |
| contact_number | VARCHAR(20) | |
| email_address | VARCHAR(255) | UNIQUE |
| password | VARCHAR(255) | bcrypt hash |
| role | VARCHAR(20) | `resident` (default) or `admin` |
| photo_url | TEXT | relative path, e.g. `/uploads/x.jpg` |
| status | VARCHAR(50) | `Active` / `Inactive` / `Suspended` |
| created_at | TIMESTAMP | |

### `emergency_reports`
| Column | Notes |
|---|---|
| id, report_reference | PK, generated `SC-YYYY-NNNNNN` reference |
| reporter_id | FK → `registered_users.id` (nullable, `ON DELETE SET NULL`) |
| time | submission timestamp |
| emergency_type, severity | e.g. Fire / Flood / Medical, Low–Critical |
| reporter_name, contact_number | denormalized for fast display without a join |
| location, latitude, longitude | |
| incident_details, number_of_people_affected, special_needs | |
| photo_url, media_type | base64 data URL or uploaded file reference; image or video |
| status | Received / Dispatched / In Progress / Resolved / Cancelled |
| assigned_to, assigned_at | FK → `registered_users.id`, optional responder assignment |

### `assistance_requests`
| Column | Notes |
|---|---|
| id, report_reference, reporter_id | as above |
| timestamp | |
| request_assistance_type | Food & Water / Medical Supplies / Shelter / etc. |
| full_name, contact_number, email_address | |
| current_location, latitude, longitude | |
| number_of_people_needing_help, urgency_level | |
| describe_your_situation, special_needs | |
| status | Pending / In Progress / Resolved / Cancelled |

### `petty_crimes`
| Column | Notes |
|---|---|
| id, report_reference, reporter_id | as above |
| timestamp | |
| crime_type, reporter_name, contact_number | |
| location, latitude, longitude | |
| description, suspect_info | |
| status | Received / In Progress / Resolved / Cancelled |

### `announcements`
| Column | Notes |
|---|---|
| id, title, category, message, date_posted | |
| image_path | uploaded image, relative path |
| source_url, source_title, source_image, source_site | populated by the "paste a link" preview feature |
| created_by | FK → `registered_users.id` |
| created_at | |

### `notifications`
| Column | Notes |
|---|---|
| id, title, message, notification_type, reference_id, is_read, created_at | Generic notification log; currently populated on report/announcement creation but not yet surfaced in the UI (see backend docs note above) |

### `signin_logs`
Every sign-in attempt (success or failure), for every role: `id, full_name, email_address, status, timestamp`.

### `admin_logs`
Successful admin sign-ins specifically: `id, email_address, login_time`.

### Relationships
- `registered_users.id` ← `emergency_reports.reporter_id` / `.assigned_to`, `assistance_requests.reporter_id`, `petty_crimes.reporter_id`, `announcements.created_by` (all nullable, `ON DELETE SET NULL` — deleting a user doesn't delete their historical reports).

---

## 8. API Reference

All endpoints are prefixed with `/api`. 🔒 = requires `Authorization: Bearer <token>`. 🔒👑 = requires an admin token.

### Auth
| Endpoint | Purpose | Used by |
|---|---|---|
| `POST /auth/signup` | Create a resident account | `Hero.jsx` |
| `POST /auth/signin` | Sign in; returns `{ success, token, isAdmin, user }` | `Hero.jsx`, admin `SignInModal.jsx` |

### Emergency Reports (`/emergency-reports`)
| Endpoint | Purpose |
|---|---|
| `POST /` 🔒 | Submit a new emergency report |
| `GET /` 🔒👑 | List all emergency reports |
| `GET /statistics` 🔒👑 | Aggregate counts by status |
| `GET /:id` 🔒 | Get one report |
| `PUT /:id` 🔒 | Edit a report (resident editing their own, or admin) |
| `PUT /:id/status`, `PATCH /:id/status` 🔒👑 | Update status |
| `DELETE /:id` 🔒 | Delete a report |

### Assistance Requests (`/assistance-requests`) and Petty Crimes (`/petty-crimes`)
Same route shape as Emergency Reports above, on their respective base paths.

### My Reports (`/reports`)
| Endpoint | Purpose |
|---|---|
| `GET /user/:userId` 🔒 | Combined list of the user's reports across all three types, newest first |

### Announcements (`/announcements`)
| Endpoint | Purpose |
|---|---|
| `GET /` | Public — list all announcements |
| `GET /link-preview?url=` 🔒👑 | Fetch Open Graph title/image/site for a pasted link |
| `POST /` 🔒👑 | Create (multipart form: `title, category, message, date, source_url?, image?`) |
| `PUT /:id` 🔒👑 | Update (same fields, plus `remove_image`) |
| `DELETE /:id` 🔒👑 | Delete |

### Users (`/users`)
| Endpoint | Purpose |
|---|---|
| `GET /` 🔒👑 | List all registered users |
| `PUT /:id`, `PATCH /:id/status` 🔒👑 | Update a user's status |
| `GET /:id` 🔒 (self or admin) | Get one profile |
| `POST /:id/photo` 🔒 (self or admin) | Upload profile photo (multipart, field `photo`) |
| `PATCH /:id/username` 🔒 (self or admin) | Change username |
| `PATCH /:id/password` 🔒 (self or admin) | Change password (`{currentPassword, newPassword}`) |

### Logs (`/logs`)
| Endpoint | Purpose |
|---|---|
| `GET /signin` 🔒👑 | All sign-in attempts |
| `GET /admin` 🔒👑 | All admin sign-ins |

### Dashboard, Export, Settings, Notifications
| Endpoint | Purpose |
|---|---|
| `GET /dashboard` 🔒👑 | Combined dashboard stats |
| `/export/*` 🔒👑 | Excel/PDF data export |
| `/settings/*` 🔒👑 | System settings (backend scaffolding; no frontend page yet) |
| `/notifications/*` 🔒 | Notification log (backend ready; no frontend caller yet) |
