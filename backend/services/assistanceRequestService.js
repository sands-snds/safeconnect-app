const AssistanceRequest = require("../models/AssistanceRequest");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");


// Number of people needing help: a whole number from 1 to 500, or null
// (left out) so the column keeps its default or its current value.
const MAX_PEOPLE = 500;
const peopleCount = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= MAX_PEOPLE ? n : null;
};

const PROOF_REQUIRED_MESSAGE = "Please attach a photo or video of your situation. It is required so the barangay can verify your request.";

class AssistanceRequestService {
    static async create(data) {
        if (!data.photoUrl) {
            return { success: false, status: 400, message: PROOF_REQUIRED_MESSAGE };
        }

        const reference = await generateReference(AssistanceRequest.getLatestReference);

        const requestId = await AssistanceRequest.create({
            reportReference: reference,
            reporterId: data.userId || null,
            assistanceType: data.type,
            fullName: data.fullname,
            contactNumber: data.contact,
            email: data.email,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            urgency: data.urgency,
            peopleAffected: peopleCount(data.people),
            situation: data.situation,
            specialNeeds: data.special,
            victimOfEmergency: data.victimOfEmergency,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType,
            reportFor: data.reportFor,
            victimName: data.victimName,
            victimContact: data.victimContact,
            victimRelationship: data.victimRelationship,
            victimDetails: data.victimDetails
        });

        await NotificationService.create({
            title: "New Assistance Request",
            message: `${data.type} requested at ${data.location}`,
            notificationType: "assistance",
            referenceId: requestId
        });

        return {
            success: true,
            id: requestId,
            reportReference: reference
        };
    }

    static async update(id, data) {
        if (!data.photoUrl && !(await AssistanceRequest.hasMedia(id))) {
            return { success: false, status: 400, message: PROOF_REQUIRED_MESSAGE };
        }

        const affected = await AssistanceRequest.update(id, {
            assistanceType: data.type,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            urgency: data.urgency,
            peopleAffected: peopleCount(data.people),
            situation: data.situation,
            specialNeeds: data.special,
            victimOfEmergency: data.victimOfEmergency,
            photoUrl: data.photoUrl,
            mediaType: data.mediaType
        });

        return { success: affected > 0 };
    }
}

module.exports = AssistanceRequestService;
