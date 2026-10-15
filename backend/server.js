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

// ── CORS: allow the React dev server plus any deployed frontends ──
// ALLOWED_ORIGINS is a comma-separated list, e.g. the Azure Static Web App
// URL: https://<name>.azurestaticapps.net
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
}));

// Reports carry their photo/video as base64, which is ~4/3 the file size:
// the forms allow 50MB videos, so the body can reach ~67MB.
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Creates admin_activity_logs on existing databases (no manual migration needed).
AdminActivity.ensureTable().catch((err) =>
  console.error("Could not create admin_activity_logs table:", err.message)
);

// Adds the IP / device / location columns to signin_logs if missing.
Log.ensureColumns().catch((err) =>
  console.error("Could not add signin_logs columns:", err.message)
);

// Creates the News Like/Comment tables on existing databases (no manual migration needed).
AnnouncementLike.ensureTable().catch((err) =>
  console.error("Could not create announcement_likes table:", err.message)
);
AnnouncementComment.ensureTable().catch((err) =>
  console.error("Could not create announcement_comments table:", err.message)
);

// Adds the report archive columns/setting, then auto-archives old resolved
// reports now and every 6 hours.
require("./services/archiveService").startScheduler();

// Archives sign-in / admin activity log entries older than each log's
// period (default 90 days) now and every 6 hours.
require("./services/logArchiveService").startScheduler();

// Lets the editable site contacts (Content > Site Contacts) fit in system_settings.
require("./services/siteContentService").ensureSchema().catch((err) =>
  console.error("Could not prepare site contacts storage:", err.message)
);

// The barangay's main Admin account always exists and stays an Active Admin.
require("./services/mainAccount").ensureMainAccount().catch((err) =>
  console.error("Could not check the main barangay account:", err.message)
);
