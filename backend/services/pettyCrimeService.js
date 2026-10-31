const PettyCrime = require("../models/PettyCrime");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");



const PHOTO_OPTIONAL_CRIME_TYPES = ["Theft", "Suspicious Activity", "Harassment"];
const ANONYMOUS_NAME = "Anonymous";

const isPhotoRequired = (crimeType) => !PHOTO_OPTIONAL_CRIME_TYPES.includes(crimeType);

const PHOTO_REQUIRED_MESSAGE = "Please attach a photo or video. It is required for this crime type.";

class PettyCrimeService {
    static async create(data) {
        if (isPhotoRequired(data.crimeType) && !data.photoUrl) {
            return { success: false, status: 400, message: PHOTO_REQUIRED_MESSAGE };
        }

        const isAnonymous = data.isAnonymous === true || data.isAnonymous === "true";
        const reference = await generateReference(PettyCrime.getLatestReference);

        
        
        
        
        const reportId = await PettyCrime.create({
            reportReference: reference,
            reporterId: data.userId || null,
            crimeType: data.crimeType,
            reporterName: isAnonymous ? ANONYMOUS_NAME : data.fullname,
            contactNumber: isAnonymous ? null : data.contact,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            suspectInfo: data.suspectInfo,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType,
            isAnonymous,
            reportFor: data.reportFor,
            victimName: data.victimName,
            victimContact: data.victimContact,
            victimRelationship: data.victimRelationship,
            victimDetails: data.victimDetails
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
        if (isPhotoRequired(data.crimeType) && !data.photoUrl && !(await PettyCrime.hasMedia(id))) {
            return { success: false, status: 400, message: PHOTO_REQUIRED_MESSAGE };
        }

        const affected = await PettyCrime.update(id, {
            crimeType: data.crimeType,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            suspectInfo: data.suspectInfo,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType
        });

        return { success: affected > 0 };
    }
}

module.exports = PettyCrimeService;
