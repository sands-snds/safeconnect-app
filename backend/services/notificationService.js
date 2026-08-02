const Notification = require("../models/Notification");

class NotificationService {
    static async create({
        title,
        message,
        notificationType,
        referenceId = null
    }) {
        return Notification.create({
            title,
            message,
            notificationType,
            referenceId
        });
    }
}

module.exports = NotificationService;