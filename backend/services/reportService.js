const { checkMedia, mediaColumns, mediaRejected } = require("../utils/mediaCheck");
const ReportMedia = require("../models/ReportMedia");
const { textProblems } = require("../utils/textCheck");
const Report = require("../models/Report");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");



// Number of people affected: a whole number from 1 to 500 (older reports
// saved a range such as "1-10", which is left as it is).
const MAX_PEOPLE = 500;
const peopleCount = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= MAX_PEOPLE ? n : null;
};
const PEOPLE_MESSAGE = `Please enter how many people are affected (1 to ${MAX_PEOPLE}).`;

class ReportService {
    static async create(data) {
        // Spam, gibberish or offensive text in any field (utils/textCheck.js).
        const badText = textProblems("emergency", data);
        if (badText) return badText;
        // Optional (the quick report leaves it to "Add details"), but a
        // number that is given must be 1 to 500.
        const given = data.people !== undefined && data.people !== null && data.people !== "";
        const people = given ? peopleCount(data.people) : null;
        if (given && people === null) {
            return { success: false, status: 400, message: PEOPLE_MESSAGE };
        }

        // The photo or video must be fresh and unedited (utils/mediaCheck.js).
        const media = data.photoUrl ? await checkMedia(data.photoUrl, data.mediaType, new Date(), { fromCamera: data.mediaSource === "camera" }) : null;
        if (media && !media.ok) return mediaRejected(media);

        const reference = await generateReference(Report.getLatestReference, "emergency");

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
            details: data.details || "",
            peopleAffected: people,
            specialNeeds: data.special,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType,
            reportFor: data.reportFor,
            victimName: data.victimName,
            victimContact: data.victimContact,
            victimRelationship: data.victimRelationship,
            victimDetails: data.victimDetails
        };

        const reportId = await Report.create(report);

        if (media) await ReportMedia.save("emergency_reports", reportId, mediaColumns(media));

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

    
    static async update(id, data) {
        // Spam, gibberish or offensive text in any field (utils/textCheck.js).
        const badText = textProblems("emergency", data);
        if (badText) return badText;
        if (data.people !== undefined && peopleCount(data.people) === null) {
            return { success: false, status: 400, message: PEOPLE_MESSAGE };
        }
        const media = data.photoUrl ? await checkMedia(data.photoUrl, data.mediaType, new Date(), { fromCamera: data.mediaSource === "camera" }) : null;
        if (media && !media.ok) return mediaRejected(media);
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

        if (media && affected > 0) await ReportMedia.save("emergency_reports", id, mediaColumns(media));
        return { success: affected > 0 };
    }
}

module.exports = ReportService;
