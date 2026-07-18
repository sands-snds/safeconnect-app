const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const logRoutes = require("./routes/logRoutes");
const reportRoutes = require("./routes/reportRoutes");
const exportRoutes = require("./routes/exportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const systemSettingRoutes = require("./routes/systemSettingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const helmet = require("helmet");


const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings",systemSettingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(helmet());

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.get("/", (req, res) => {
    res.send("SafeConnect API is running!");
});

app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT NOW() AS time");
        res.json({
            status: "Connected!",
            databaseTime: rows[0].time
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "Database connection failed",
            error: err.message
        });

    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});