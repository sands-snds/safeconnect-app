const AssistanceRequest = require("../models/AssistanceRequest");
const NotificationService = require("./notificationService");
const { generateReference } = require("../utils/reference");

class AssistanceRequestService {
    static async create(data) {
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
            situation: data.situation,
            specialNeeds: data.special
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
        const affected = await AssistanceRequest.update(id, {
            assistanceType: data.type,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            urgency: data.urgency,
            situation: data.situation,
            specialNeeds: data.special
        });

        return { success: affected > 0 };
    }
}

module.exports = AssistanceRequestService;
