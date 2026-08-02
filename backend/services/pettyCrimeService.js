const PettyCrime = require("../models/PettyCrime");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");

class PettyCrimeService {
    static async create(data) {
        const reference = await generateReference(PettyCrime.getLatestReference);

        const reportId = await PettyCrime.create({
            reportReference: reference,
            reporterId: data.userId || null,
            crimeType: data.crimeType,
            reporterName: data.fullname,
            contactNumber: data.contact,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            suspectInfo: data.suspectInfo
        });

        await NotificationService.create({
            title: "New Petty Crime Report",
            message: `${data.crimeType} reported at ${data.location}`,
            notificationType: "petty_crime",
            referenceId: reportId
        });

        return {
            success: true,
            id: reportId,
            reportReference: reference
        };
    }

    static async update(id, data) {
        const affected = await PettyCrime.update(id, {
            crimeType: data.crimeType,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            suspectInfo: data.suspectInfo
        });

        return { success: affected > 0 };
    }
}

module.exports = PettyCrimeService;
