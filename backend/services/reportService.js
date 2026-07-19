const Report = require("../models/Report");
const NotificationService = require("./notificationService");

class ReportService {
    /* ==========================================
                    CREATE REPORT
    ========================================== */
    static async create(data) {
        const reference = await this.generateReference();
        const report = {
            report_reference: reference,
            report_type: data.reportType,
            reporter_id: data.reporterId,
            category: data.category,
            title: data.title,
            details: data.details,
            location: data.location,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            photo_url: data.photoUrl || null,
            status: "Pending"
        };

        const reportId = await Report.create(report);
        await NotificationService.create({
            title: `New ${data.reportType} Report`,
            message: `${data.category} reported at ${data.location}`,
            notificationType: data.reportType,
            referenceId: reportId
        });

        return {
            success: true,
            id: reportId,
            reportReference: reference
        };
    }

    /* ==========================================
                GENERATE REFERENCE NUMBER
    ========================================== */

    static async generateReference() {
        const year = new Date().getFullYear();
        const latest = await Report.getLatestReference();
        let nextNumber = 1;
        if (latest && latest.report_reference) {
            const parts = latest.report_reference.split("-");
            if (parts.length === 3) {
                nextNumber = parseInt(parts[2], 10) + 1;
            }
        }
        return `SC-${year}-${String(nextNumber).padStart(6, "0")}`;
    }
}

module.exports = ReportService;