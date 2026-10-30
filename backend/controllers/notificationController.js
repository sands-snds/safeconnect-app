const Notification = require("../models/Notification");

// ?archived=1: the Notifications page's Archived tab.
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({ archived: req.query.archived === "1" });
        const unread = await Notification.unreadCount();

        res.json({
            success: true,
            unread,
            count: notifications.length,
            data: notifications
        });
    }

    catch(err){
        console.error(err);
        res.status(500).json({
            success:false
        });
    }
};

exports.markAsRead = async (req,res)=>{
    await Notification.markAsRead(req.params.id);
    res.json({
        success:true
    });
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// Notifications page: archive / restore, or mark read, several at once.
// Body: { ids: [1, 2, 3] } (and archived: true | false for /archive).
const idsFrom = (req) => (Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger).slice(0, 500) : []);

exports.archiveNotifications = async (req, res) => {
    try {
        const affected = await Notification.setArchived(idsFrom(req), req.body?.archived !== false);
        res.json({ success: true, affected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Couldn't update the notifications." });
    }
};

exports.markManyAsRead = async (req, res) => {
    try {
        const affected = await Notification.markManyAsRead(idsFrom(req));
        res.json({ success: true, affected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Couldn't update the notifications." });
    }
};

/* =========================================================
        Resident-facing: a user's own notifications
============================================================*/

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findByUser(req.user.id);
        const unread = await Notification.unreadCountForUser(req.user.id);

        res.json({
            success: true,
            unread,
            count: notifications.length,
            data: notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

// Only marks it if the notification belongs to the signed-in user.
exports.markMineAsRead = async (req, res) => {
    try {
        const affected = await Notification.markAsReadForUser(req.params.id, req.user.id);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.markAllMineAsRead = async (req, res) => {
    try {
        await Notification.markAllAsReadForUser(req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};