const Report = require("../models/Report");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");

// Emergency Reports service. Field names map 1:1 to what
// ResidentEmergencyModal.jsx sends via createEmergencyReport().
class ReportService {
    /* ==========================================
                    CREATE REPORT
    ========================================== */
    static async create(data) {
        const reference = await generateReference(Report.getLatestReference);

        const report = {
            reportReference: reference,
            reporterId: data.userId || null,
            emergencyType: data.emergencyType,
            severity: data.severity,
            reporterName: data.name,
            contactNumber: data.contact,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            details: data.details,
            peopleAffected: data.people,
            specialNeeds: data.special,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType
        };

        const reportId = await Report.create(report);

        await NotificationService.create({
            title: "New Emergency Report",
            message: `${data.emergencyType} reported at ${data.location}`,
            notificationType: "emergency",
            referenceId: reportId
        });

        return {
            success: true,
            id: reportId,
            reportReference: reference
        };
    }

    /* ==========================================
                    UPDATE REPORT
    ========================================== */
    static async update(id, data) {
        const affected = await Report.update(id, {
            emergencyType: data.emergencyType,
            severity: data.severity,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            details: data.details,
            peopleAffected: data.people,
            specialNeeds: data.special,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType
        });

        return { success: affected > 0 };
    }
}

module.exports = ReportService;
