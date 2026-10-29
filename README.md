# SafeConnect

***A Web-Based Community Disaster Response System for Barangay Santa Fe, Dasmariñas, Cavite***

SafeConnect is a web app that helps a barangay prepare for and respond to emergencies. Residents use it to report emergencies, request assistance, report petty crimes and read barangay announcements. Barangay staff use an admin panel to follow up each report, publish announcements, manage accounts and review activity logs.

> **How does it work inside?** This README covers what the app does and how to run it. For how every component works, and how the backend and frontend connect, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Table of Contents

1. [Features](#1-features)
2. [Technology](#2-technology)
3. [How It Fits Together](#3-how-it-fits-together)
4. [Getting Started (Local Setup)](#4-getting-started-local-setup)
5. [Environment Variables](#5-environment-variables)
6. [Deployment (Azure)](#6-deployment-azure)
7. [Folder Structure](#7-folder-structure)
8. [User Roles](#8-user-roles)
9. [Data Retention](#9-data-retention)
10. [Known Issues](#10-known-issues)

---

## 1. Features

### For residents
| Feature | What it does |
|---|---|
| **Sign up with email verification** | A 6-digit code is emailed to the resident. The account is created only after the code is entered. |
| **Sign in / forgot password** | Signing in sends an email alert. Forgotten passwords are reset with an emailed code. |
| **Emergency report** | Report a fire, flood, medical emergency or similar, with a required photo or video and a map pin. Can be filed for yourself or for someone else. |
| **Assistance request** | Ask for food, water, medical supplies, shelter and so on, with an urgency level. |
| **Petty crime report** | Report theft, vandalism and similar incidents, with optional suspect details. |
| **Location pin** | A map of Barangay Santa Fe. Residents tap the map or use their GPS location. Pins outside the barangay are rejected, and the address fills in automatically. |
| **My Reports** | See every report you have submitted and its status (Received → In Progress → Resolved), and edit or delete your reports. |
| **Notifications** | A bell showing new announcements, plus personal updates when an admin changes the status of one of your reports or replies to your comment. |
| **News / announcements** | The barangay's announcements, including previews of linked news articles. Residents can like, comment on and share each one. The barangay's replies appear under the comment they answer, YouTube-style, tagged "Barangay Admin". |
| **Weather** | A forecast card for Santa Fe, from Open-Meteo. |
| **Profile settings** | Change your photo, username, contact number, email or password. |
| **English / Tagalog** | Visitors pick a language on their first visit and can switch at any time. |
| **Spam protection** | Each report type has a 1-hour cooldown per account. |

### For admins (barangay staff)
| Feature | What it does |
|---|---|
| **Dashboard** | Totals, a "reports over time" chart, status pie charts and the latest reports. |
| **Report management** | Emergency, Assistance and Petty Crime tabs with search, filters and pagination. Each card shows the full details, the photo and the map pin. |
| **Status workflow** | A report can only move forward (Received → In Progress → Resolved). The resident gets an automatic update at each step. |
| **Dismiss a report** | An open report that is a repeat, a prank or a known false accusation can be **Dismissed** with a reason, instead of suspending the account. The reason is sent to the resident and shown in My Reports. Dismissed reports can be archived like resolved ones. |
| **Archiving** | Resolved reports can be archived by hand, or automatically after 6 months or 1 year. Archived reports can be restored. |
| **Announcements** | Create, edit and delete announcements, with an image or a pasted news link (a preview is generated). Every active resident is emailed. |
| **Announcement comments** | Read residents' comments on each announcement, comment as the barangay, **reply** to a resident (shown as a thread under their comment; the resident is notified), and delete comments for moderation. |
| **Share** | Share an announcement on Facebook, through the device's share menu, or by copying its text. |
| **Generate Report** | Download PDF or Excel reports. Report tabs filter by status and period; System tabs filter by role, status and a From/To date range. |
| **Notifications** | A bell that alerts Admins and Officials to new reports and announcements. |
| **Users** *(Admin)* | Residents and Admins & Officials in two tables under one search and status filter. Change an account's role or status. The barangay's main account is locked. |
| **Sign-in Logs** *(Admin)* | Every sign-in attempt, with device, IP address and approximate location in one column. Entries older than 90 days (adjustable) move to an **Archived** tab. |
| **Admin Logs** *(Admin)* | Which Admins and Officials are online, and a record of every action (logins, status changes, exports and more). Activity older than 90 days (adjustable) moves to an **Archived** tab. |
| **Page Contacts** *(Admin)* | Edit the floating call button's emergency numbers and the footer's barangay officials, hotlines and socials. |
| **Page Contents** *(Admin)* | Change the landing page and resident page carousel photos, and set the two demo videos (upload an MP4/WebM up to 100 MB, or paste a YouTube link) with a title and caption. The **system demo** shows on the landing page (below the carousel) and in the resident News page (below the weather card); each place can be hidden. The **admin demo** pops up after signing in to the admin panel. |
| **Account Settings** | From the account menu (top right), Admins and Officials can change their photo, username, contact number, email and password, and re-watch the admin demo video. |
| **Account status popups** | Signing in to a Suspended or Closed account closes the sign-in box and explains, in English or Tagalog, what happened and who to contact. |

---

## 2. Technology

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App), React Router 7, Bootstrap 5 + Bootstrap Icons, Recharts (charts), Leaflet / React-Leaflet (maps), SweetAlert2 |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 (via `mysql2`) |
| Authentication | JSON Web Tokens (`jsonwebtoken`, valid for 7 days) + `bcrypt` password hashing |
| Email | `nodemailer` over SMTP |
| File uploads | `multer` (announcement images, profile photos) |
| Exports | `pdfkit` (PDF), `exceljs` (Excel) |
| Security | `helmet` (HTTP headers), `cors` (allowed origins) |
| External services | OpenStreetMap tiles + Nominatim (maps, addresses), Esri World Imagery (satellite view), Open-Meteo (weather), ipapi.co (sign-in location) |
| Hosting | Azure Static Web Apps (frontend), Azure App Service (backend), Azure Database for MySQL |

---

## 3. How It Fits Together

```
 Browser (React SPA)                     Node.js / Express API                MySQL
┌───────────────────────┐   HTTPS/JSON  ┌──────────────────────────┐  SQL   ┌──────────────┐
│ pages + components    │ ────────────► │ routes → middleware →    │ ─────► │ safeconnect  │
│        │              │  Bearer JWT   │ controllers → services → │        │   database   │
│ src/Services/api.js   │ ◄──────────── │ models                   │ ◄───── │              │
└───────────────────────┘               └──────────────────────────┘        └──────────────┘
                                               │  SMTP (emails)
                                               │  ipapi.co (sign-in location)
```

- The React app **never talks to the database directly**. Every request goes through [src/Services/api.js](src/Services/api.js), which calls the Express API.
- The API checks the JWT and the account's role on each protected request, then reads and writes MySQL.
- There are three pages: `/` (public landing page), `/resident` (resident app) and `/admin` (admin panel).

The full walkthrough is in [ARCHITECTURE.md](ARCHITECTURE.md). It covers every route, middleware, service, model and component, plus step-by-step flows such as "a resident submits a report".

---

## 4. Getting Started (Local Setup)

### Prerequisites
- **Node.js 18+** and npm
- **MySQL 8** (the team uses a standalone MySQL server managed with **MySQL Workbench**)
- An **SMTP account** for sign-up codes and emails (for example, a Gmail app password)

### Step 1: Install dependencies
```bash
# from the project root (the React app)
npm install

# the backend
cd backend
npm install
```

### Step 2: Create the database
In MySQL Workbench, open `database/safeconnect_db.sql` and run it (**File → Open SQL Script**, then **Execute**). You can also run it from a terminal:
```bash
mysql -u root -p < database/safeconnect_db.sql
```
This creates the `safeconnect` database and its tables. **Warning:** the script starts with `DROP DATABASE IF EXISTS safeconnect`, so running it again erases existing data.

Some tables and columns are also created automatically when the backend starts (see [ARCHITECTURE.md → Automatic schema updates](ARCHITECTURE.md#automatic-schema-updates)). Existing databases therefore pick up new columns without a manual migration.

### Step 3: Configure the backend
Copy `backend/.env.example` to `backend/.env` and fill in the values. See [Environment Variables](#5-environment-variables) for the list, including the `SMTP_*` settings. Never commit `backend/.env`.

### Step 4: Start the backend
```bash
cd backend
npm run dev      # restarts automatically on changes (nodemon)
# or
npm start        # plain node server.js
```
The API runs at `http://localhost:5000`. Open `http://localhost:5000/api/health` to check the database connection.

### Step 5: Start the frontend
```bash
# from the project root
npm start
```
This opens `http://localhost:3000`. By default the frontend calls `http://localhost:5000/api`.

### Step 6: Sign in as the barangay's main Admin
The backend always keeps one built-in **Admin** account: **safeconnect.brgy.santafe@gmail.com**. It is created on the first server start if it doesn't exist, and repaired on every start if its role or status was changed. Its role, status and email can't be changed from the admin panel, so the barangay can't be locked out after handover.

The account starts with a random password nobody knows. To set it:
1. On the landing page, click **Sign In → Forgot password?** and enter safeconnect.brgy.santafe@gmail.com.
2. Enter the 6-digit code sent to that Gmail inbox, then choose a password (this needs SMTP working).
3. Sign in. Admin and Official accounts are sent to `/admin` automatically.

From **System → Users**, the main Admin can make other accounts Officials or Admins. New sign-ups are always Residents.

> The admin row inserted by `safeconnect_db.sql` stores its password as plain text. The backend compares passwords with bcrypt, so **that account cannot sign in**. Use the main account above instead.

### Available scripts
| Where | Command | What it does |
|---|---|---|
| root | `npm start` | React dev server on port 3000 |
| root | `npm run build` | Production build into `build/` |
| root | `npm test` | Runs the React tests |
| backend | `npm run dev` | API with automatic restart (nodemon) |
| backend | `npm start` | API with plain Node |

---

## 5. Environment Variables

### Backend: `backend/.env`
| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Port the API listens on |
| `DB_HOST`, `DB_PORT` | `localhost`, `3306` | MySQL server |
| `DB_USER`, `DB_PASSWORD` | `root`, … | MySQL login |
| `DB_NAME` | `safeconnect` | Database name |
| `DB_SSL` | `false` | Set to `true` for Azure Database for MySQL, which requires SSL |
| `JWT_SECRET` | a long random string | Signs sign-in tokens. Changing it signs everyone out. |
| `ASSET_BASE` | `http://localhost:5000` | Public URL of the backend, used to build full photo URLs |
| `ALLOWED_ORIGINS` | `https://<name>.azurestaticapps.net` | Extra frontend URLs allowed to call the API (comma-separated). `localhost:3000` is always allowed. |
| `SMTP_HOST`, `SMTP_PORT` | `smtp.gmail.com`, `587` | Email server |
| `SMTP_SECURE` | `false` | `true` for port 465 |
| `SMTP_USER`, `SMTP_PASS` | … | Email login. `SMTP_USER` is also the "From" address. |

> `backend/.env.example` doesn't list the `SMTP_*` variables yet. Add them by hand.

### Frontend: `.env.local` in the project root (optional)
| Variable | Default | Purpose |
|---|---|---|
| `REACT_APP_API_BASE` | `http://localhost:5000/api` | Where the API is |
| `REACT_APP_ASSET_BASE` | `http://localhost:5000` | Where uploaded images are served from |

These values are **baked in at build time**, so set them before running `npm run build`.

---

## 6. Deployment (Azure)

| Part | Azure service | URL |
|---|---|---|
| Frontend | Static Web App | https://polite-plant-04bf1e000.3.azurestaticapps.net (same build; the official address is the Vercel one below) |
| Frontend | Vercel project `safeconnect-santafe` | https://safeconnect-santafe.vercel.app (official address; deploys from `pwa-setup`) |
| Backend | App Service (Node 22, Linux) | https://safeconnect-api-fhtsa.azurewebsites.net |
| Database | Azure Database for MySQL Flexible Server | private: only Azure services can connect |

- **Frontend:** deployed automatically by [.github/workflows/deploy-frontend.yml](.github/workflows/deploy-frontend.yml) on every push to the `pwa-setup` branch. It needs the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`. [public/staticwebapp.config.json](public/staticwebapp.config.json) sends every route to `index.html` so React Router works on refresh.
- **Frontend on Vercel:** the `safeconnect-santafe` project (Create React App preset, root `./`) builds `pwa-setup` on every push. Its environment variables are `REACT_APP_API_BASE` and `REACT_APP_ASSET_BASE`, the same values as the GitHub workflow. [vercel.json](vercel.json) sends every route to `index.html` and keeps `/admin` and `/resident` out of search results. Vercel treats build warnings as errors, so check with `CI=true npm run build` before pushing. The backend's `ALLOWED_ORIGINS` lists both frontend URLs.
- **Backend:** deployed by hand, as a zip of the `backend/` folder without `node_modules` or `.env` files, using `az webapp deploy`. Azure runs `npm install` during deployment. Its environment variables are set in the App Service configuration, not in a `.env` file.
- **Search engines:** [public/index.html](public/index.html) has the title, description, link-preview (Open Graph) tags and site name (JSON-LD) that search results show. [public/robots.txt](public/robots.txt) and [public/sitemap.xml](public/sitemap.xml) point crawlers at the landing page, and `staticwebapp.config.json` sends `X-Robots-Tag: noindex` on `/admin` and `/resident` so the sign-in pages stay out of results. The `<32 hex characters>.txt` file in `public/` is the [IndexNow](https://www.indexnow.org/) key that lets us notify Bing of updates; it is meant to be public. All of these contain the site address, so update them if it changes.
- **Uploads:** uploaded images live in `backend/uploads/` on the App Service. A zip deploy only replaces files that came from earlier deploys, so uploaded files survive. Back them up before any big change anyway.

---

## 7. Folder Structure

```
safeconnect-app/
├── README.md                  # this file
├── ARCHITECTURE.md            # how every component works and connects
├── database/
│   └── safeconnect_db.sql     # database schema + seed data
├── backend/                   # Express API
│   ├── server.js              # entry point: middleware, routes, startup jobs
│   ├── config/                # db.js (MySQL pool), reportStyle.js (PDF/Excel look)
│   ├── routes/                # URL → middleware → controller wiring
│   ├── middleware/            # auth/role checks, activity logging, uploads
│   ├── controllers/           # read the request, call services/models, send the response
│   ├── services/              # business logic: emails, exports, archiving, notifications
│   ├── models/                # SQL queries, one class per table
│   ├── utils/                 # JWT, roles, status workflow, reference numbers, sign-in context
│   ├── assets/                # logos embedded in PDF/Excel exports
│   └── uploads/               # uploaded images (not committed)
├── public/                    # index.html, manifest.json, icons, images
└── src/                       # React app
    ├── App.js                 # routes: / , /resident , /admin
    ├── Services/api.js        # the ONLY file that calls the backend
    ├── i18n/                  # English/Tagalog translations + language context
    ├── pages/                 # LandingPage, ResidentPage, AdminPage
    ├── components/
    │   ├── landing/           # public site: Navbar, Hero (sign-in/up), Services, About, Contact
    │   ├── resident/          # report modals, My Reports, Settings, navbar
    │   │   └── navbar/        # desktop/mobile navbar, news, notifications, weather (+ hooks/)
    │   ├── admin/
    │   │   ├── dashboard/     # summary, charts, recent reports
    │   │   ├── reports/       # emergency / assistance / pettyCrime tabs + shared pieces
    │   │   ├── announcements/ # list + create/edit modal
    │   │   ├── users/         # Users tab
    │   │   ├── logs/          # Sign-in Logs + Admin Logs tabs
    │   │   ├── layout/        # sidebar, header (notifications), stat cards
    │   │   ├── hooks/         # useAdminData, useAdminAuth, useAdminNavigation, useIsMobile
    │   │   ├── shared/        # ListView, ReportCard, StatusSelect, Pagination, export UI…
    │   │   └── AdminModals/   # SignInModal, FormModal
    │   └── shared/            # footer, language picker, location map (used by several pages)
    └── styles/                # CSS files
```

---

## 8. User Roles

| Shown as | Stored value | Where they land | What they can do |
|---|---|---|---|
| **Resident** | `resident` | `/resident` | Submit reports, and view, edit or delete their own reports; manage their profile |
| **Official** | `admin` | `/admin` | Everything in the admin panel **except** the System tabs: reports, statuses, archiving, announcements, exports |
| **Admin** | `super_admin` | `/admin` | Everything, including **System → Users, Sign-in Logs and Admin Logs**, **Content → Page Contacts**, and changing auto-archive periods |

Only the names shown on screen, in exports and in messages changed. The values stored in the database are the same as before, so existing accounts and sign-ins keep working. In code, always show `ROLE_LABELS[role]` (`backend/utils/roles.js`, `src/components/shared/roles.js`), never the stored value.

**Account statuses:** **Active** (can sign in), **Suspended** (temporarily blocked; told to contact the administrator) and **Closed** (permanently blocked; told the account can't be used again). **Pending** is no longer offered, because accounts work as soon as the email is verified. Older Pending accounts can still be changed to another status.

The backend checks the role **against the database on every admin request**, not only against the token. A demotion or suspension therefore takes effect immediately.

---

## 9. Data Retention

| Data | Rule |
|---|---|
| Resolved reports | Archived automatically once they have been resolved for **1 year** (default). An Admin can change this to 6 months or Off. Archived reports stay in the database, still count on the dashboard and in exports, and can be restored. |
| Sign-in logs | Entries older than **90 days** (default; an Admin can choose 30 days, 90 days, 6 months, 1 year or Off) move to the **Archived** tab. Nothing is deleted. |
| Admin activity logs | Same as sign-in logs, with its own setting (default **90 days**). The Recent tab shows the latest 500 actions; the Archived tab up to 2,000. |
| Sign-up / reset codes | Held in server memory for 10 minutes. A server restart clears them. |

---

## 10. Known Issues

- **`database/safeconnect_db.sql` is missing some columns the code uses:** `report_for`, `victim_name`, `victim_contact`, `victim_relationship` and `victim_details` on the three report tables. A database created only from this file will fail when a report is submitted. `victim_details` is also missing from the current local database.
- **The seed admin account cannot sign in** (its password is not hashed). See [Step 6](#step-6-create-the-first-super-admin).
- **`backend/.env.example` doesn't list the `SMTP_*` variables.**
- **`backend/.env` is committed to git** even though `.gitignore` lists it. It holds real passwords, and each teammate's local database password overwrites the others' when they pull. Stop tracking it with `git rm --cached backend/.env`, and change the passwords that are already in the history.
- **Report photos and videos are stored as base64 text** in the report tables (`photo_url`, `LONGTEXT`). This works, but makes those rows large, and the admin report lists download every report's media on each refresh.

## Logos

The logo files are in `public/images/logos/`. To change one, replace the file there with a new PNG, keeping the same name, then commit and push:

- `Safe Connect Logo 2.png`: the logo on the pages (navbars, admin sidebar, Sign In / Sign Up). It sits on maroon and dark backgrounds, so a white or light logo works best.
- `Safe Connect Logo 3.png`: the footer logo. Until this file exists, the footer shows `Safe Connect Logo 2.png`.
- `Safe Connect Logo.png`: the browser-tab icon.

After replacing `Safe Connect Logo.png`, also run `powershell -ExecutionPolicy Bypass -File scripts\update-app-icons.ps1` to rebuild the installed-app, iPhone and link-preview icons and the PDF report logo (the PDF logo needs the backend redeployed).
