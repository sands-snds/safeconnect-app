const db = require("../config/db");

class Dashboard {
    static async getStatistics() {
        const [[users]] = await db.query(`
            SELECT COUNT(*) AS totalUsers
            FROM registered_users
        `);

        const [[reports]] = await db.query(`
            SELECT
                COUNT(*) AS totalReports,
                SUM(status='Pending') AS pendingReports,
                SUM(status='Dispatched') AS dispatchedReports,
                SUM(status='In Progress') AS inProgressReports,
                SUM(status='Resolved') AS resolvedReports,
                SUM(status='Cancelled') AS cancelledReports
            FROM emergency_reports
        `);

        const [[announcements]] = await db.query(`
            SELECT COUNT(*) AS totalAnnouncements
            FROM announcements
        `);

        return {
            totalUsers: users.totalUsers,
            totalReports: reports.totalReports,
            pendingReports: reports.pendingReports,
            dispatchedReports: reports.dispatchedReports,
            inProgressReports: reports.inProgressReports,
            resolvedReports: reports.resolvedReports,
            cancelledReports: reports.cancelledReports,
            totalAnnouncements: announcements.totalAnnouncements
        };
    }
}

module.exports = Dashboard;