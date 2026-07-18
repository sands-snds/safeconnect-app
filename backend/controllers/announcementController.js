const Announcement = require("../models/Announcement");
const AnnouncementService = require("../services/announcementService");

exports.createAnnouncement = async (req, res) => {
    try {
        const result = await AnnouncementService.create(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Unable to create announcement."
        });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll();
        res.json({
            success: true,
            count: announcements.length,
            data: announcements
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        await Announcement.update(
            req.params.id,
            req.body
        );

        res.json({
            success: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.delete(
            req.params.id
        );
        res.json({
            success: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};