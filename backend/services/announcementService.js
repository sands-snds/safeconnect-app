const Announcement = require("../models/Announcement");

class AnnouncementService {
    static async create(data) {
        const id = await Announcement.create(data);
        return {
            success: true,
            id
        };

        await NotificationService.create({
            title: "New Announcement",
            message: data.title,
            notificationType: "Announcement",
            referenceId: announcementId
        });
    }
}

module.exports = AnnouncementService;