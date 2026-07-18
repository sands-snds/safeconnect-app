const Report = require("../models/Report");

class ReportService {
    static generateReference() {
        const year = new Date().getFullYear();
        const random = Math.floor(
            100000 + Math.random() * 900000
        );
        return `SC-${year}-${random}`;
    }

    static async create(data) {
        const reference = await this.generateReference();
        const report = {
            reference,
            reporterId: data.reporterId,
            emergencyType: data.emergencyType,
            location: data.location,
            details: data.details,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            photoUrl: data.photoUrl || null
        };

        const id = await Report.create(report);
        return {
            success: true,
            id,
            reportReference: reference
        };

        await NotificationService.create({
            title: "New Emergency Report",
            message: `${data.emergencyType} reported at ${data.location}`,
            notificationType: "Emergency",
            referenceId: reportId
        });
    }

    static async generateReference() {
        const year = new Date().getFullYear();
        const latest = await Report.getLatestReference();

        let nextNumber = 1;
        if (latest) {
            const parts = latest.report_reference.split("-");
            nextNumber = parseInt(parts[2]) + 1;
        }
        return `SC-${year}-${String(nextNumber).padStart(6, "0")}`;
    }
    
}

module.exports = ReportService;