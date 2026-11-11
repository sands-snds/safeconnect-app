const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const AdminActivity = require("./models/AdminActivity");
const Log = require("./models/Log");
const AnnouncementLike = require("./models/AnnouncementLike");
const AnnouncementComment = require("./models/AnnouncementComment");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const logRoutes = require("./routes/logRoutes");
const reportRoutes = require("./routes/reportRoutes");
const emergencyReportRoutes = require("./routes/emergencyReportRoutes");
const assistanceRequestRoutes = require("./routes/assistanceRequestRoutes");
const pettyCrimeRoutes = require("./routes/pettyCrimeRoutes");
const exportRoutes = require("./routes/exportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const systemSettingRoutes = require("./routes/systemSettingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const helmet = require("helmet");
const path = require("path");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,

  exposedHeaders: ["Content-Disposition"],
}));

app.use(express.json({ limit: '75mb' }));
app.use(express.urlencoded({ limit: '75mb', extended: true }));

// ── Helmet: keep security headers but allow cross-origin image loads ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// ── API routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/emergency-reports", emergencyReportRoutes);
app.use("/api/assistance-requests", assistanceRequestRoutes);
app.use("/api/petty-crimes", pettyCrimeRoutes);
app.use("/api/export", require("./routes/exportRoutes"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings", systemSettingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/site-content", require("./routes/siteContentRoutes"));
app.use("/api/me", require("./routes/userStateRoutes"));

// ── Static uploads: explicitly set cross-origin header ──
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("SafeConnect API is running!");
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS time");
    res.json({ status: "Connected!", databaseTime: rows[0].time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Database connection failed", error: err.message });
  }
});

// A request body over the 75 MB limit (a huge photo or video) is refused
// before any route runs; answer in JSON so the forms can say why.
const { isMediaTooLarge, MEDIA_TOO_LARGE } = require("./utils/mediaErrors");
app.use((err, req, res, next) => {
  if (isMediaTooLarge(err)) return res.status(413).json(MEDIA_TOO_LARGE);
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

AdminActivity.ensureTable().catch((err) =>
  console.error("Could not create admin_activity_logs table:", err.message)
);

Log.ensureColumns().catch((err) =>
  console.error("Could not add signin_logs columns:", err.message)
);

const RememberedLogin = require("./models/RememberedLogin");
RememberedLogin.ensureTable()
    .then(() => RememberedLogin.deleteExpired())
    .catch((err) => console.error("Could not create remembered_logins table:", err.message));
setInterval(() => {
    RememberedLogin.deleteExpired().catch((err) => console.error("Saved-login cleanup failed:", err.message));
}, 24 * 60 * 60 * 1000).unref();

AnnouncementLike.ensureTable().catch((err) =>
  console.error("Could not create announcement_likes table:", err.message)
);
AnnouncementComment.ensureTable().catch((err) =>
  console.error("Could not create announcement_comments table:", err.message)
);

require("./services/archiveService").startScheduler();

require("./services/announcementArchiveService").startScheduler();

require("./services/logArchiveService").startScheduler();

require("./services/siteContentService").ensureSchema()
  .then(() => require("./services/siteMediaService").hideNewsVideoOnce())
  .then(() => require("./services/siteContentService").addFireBureauOnce())
  .catch((err) => console.error("Could not prepare site contacts storage:", err.message));

require("./services/userStateService").ensureSchema().catch((err) =>
  console.error("Could not prepare synced account settings storage:", err.message)
);

require("./models/Notification").ensureColumns().catch((err) =>
  console.error("Could not add notification columns:", err.message)
);

require("./models/ResidentActivity").ensureTable().catch((err) =>
  console.error("Could not create resident_activity_logs:", err.message)
);

// Old "SC-" report IDs → EM- / AR- / PC- (utils/reference.js), once both
// activity log tables exist.
Promise.all([AdminActivity.ensureTable(), require("./models/ResidentActivity").ensureTable()])
  .then(() => require("./utils/reference").renameOldReferences())
  .catch((err) => console.error("Could not rename old report IDs:", err.message));

// Resident ID verification: the columns first, then the table that points at registered_users.
require("./models/User").ensureVerificationColumns()
  .then(() => require("./models/ResidentIdDocument").ensureTable())
  .catch((err) => console.error("Account verification schema setup failed:", err.message));
require("./models/User").ensureArchiveColumn().catch((err) =>
  console.error("Could not add registered_users.archived_at:", err.message)
);

require("./services/mainAccount").ensureMainAccount().catch((err) =>
  console.error("Could not check the main barangay account:", err.message)
);
