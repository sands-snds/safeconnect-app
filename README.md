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
| **Notifications** | A bell showing new announcements, plus personal updates when an admin changes the status of one of your reports. |
| **News / announcements** | The barangay's announcements, including previews of linked news articles. |
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
| **Archiving** | Resolved reports can be archived by hand, or automatically after 6 months or 1 year. Archived reports can be restored. |
| **Announcements** | Create, edit and delete announcements, with an image or a pasted news link (a preview is generated). Every active resident is emailed. |
| **Generate Report** | Download PDF or Excel reports, filtered by status and date range. |
| **Notifications** | A bell that alerts admins to new reports and announcements. |
| **Users** *(super admin)* | List all accounts and change their role or status. |
| **Sign-in Logs** *(super admin)* | Every sign-in attempt from the last 90 days, with IP address, device and approximate location. |
| **Admin Logs** *(super admin)* | Which admins are online, and a record of every admin action (logins, status changes, exports and more). |

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

### Step 6: Create the first super admin
New accounts are always **residents**. To make the first super admin:
1. Sign up normally on the landing page (this needs SMTP for the verification code).
2. In MySQL Workbench, promote the account:
   ```sql
   UPDATE registered_users SET role = 'super_admin' WHERE email_address = 'you@example.com';
   ```
3. Sign in again. Admin accounts are sent to `/admin` automatically.

After that, the super admin can promote other users from **System → Users**.

> The admin row inserted by `safeconnect_db.sql` stores its password as plain text. The backend compares passwords with bcrypt, so **that account cannot sign in**. Use the steps above instead.

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
| Frontend | Static Web App | https://polite-plant-04bf1e000.3.azurestaticapps.net |
| Backend | App Service (Node 22, Linux) | https://safeconnect-api-fhtsa.azurewebsites.net |
| Database | Azure Database for MySQL Flexible Server | private: only Azure services can connect |

- **Frontend:** deployed automatically by [.github/workflows/deploy-frontend.yml](.github/workflows/deploy-frontend.yml) on every push to the `pwa-setup` branch. It needs the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`. [public/staticwebapp.config.json](public/staticwebapp.config.json) sends every route to `index.html` so React Router works on refresh.
- **Backend:** deployed by hand, as a zip of the `backend/` folder without `node_modules` or `.env` files, using `az webapp deploy`. Azure runs `npm install` during deployment. Its environment variables are set in the App Service configuration, not in a `.env` file.
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

| Role | Where they land | What they can do |
|---|---|---|
| `resident` | `/resident` | Submit reports, and view, edit or delete their own reports; manage their profile |
| `admin` | `/admin` | Everything in the admin panel **except** the System tabs: reports, statuses, archiving, announcements, exports |
| `super_admin` | `/admin` | Everything, including **System → Users, Sign-in Logs and Admin Logs**, and changing the auto-archive period |

The backend checks the role **against the database on every admin request**, not only against the token. A demotion or suspension therefore takes effect immediately.

---

## 9. Data Retention

| Data | Rule |
|---|---|
| Resolved reports | Archived automatically once they have been resolved for **1 year** (default). A super admin can change this to 6 months or Off. Archived reports stay in the database, still count on the dashboard and in exports, and can be restored. |
| Sign-in logs | Only the **last 90 days** are shown and exported. Older rows stay in the database but are hidden. |
| Admin activity logs | The Admin Logs tab shows the latest 500 actions. |
| Sign-up / reset codes | Held in server memory for 10 minutes. A server restart clears them. |

---

## 10. Known Issues

- **`database/safeconnect_db.sql` is missing some columns the code uses:** `report_for`, `victim_name`, `victim_contact`, `victim_relationship` and `victim_details` on the three report tables. A database created only from this file will fail when a report is submitted. `victim_details` is also missing from the current local database.
- **The seed admin account cannot sign in** (its password is not hashed). See [Step 6](#step-6-create-the-first-super-admin).
- **`backend/.env.example` doesn't list the `SMTP_*` variables.**
- **Report photos and videos are stored as base64 text** in the report tables (`photo_url`, `LONGTEXT`). This works, but makes those rows large, and the admin report lists download every report's media on each refresh.
