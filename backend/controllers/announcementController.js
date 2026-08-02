const Announcement = require("../models/Announcement");
const AnnouncementService = require("../services/announcementService");

exports.createAnnouncement = async (req, res) => {
    try {
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const result = await AnnouncementService.create(
            { ...req.body, createdBy: req.user ? req.user.id : null },
            imagePath
        );
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Unable to create announcement."
        });
    }
};

// Public listing — returns the raw array, matching fetchAnnouncements()
// in Services/api.js which calls data.map(...) directly on the response.
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll();
        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const removeImage = req.body.remove_image === "1";
        const result = await AnnouncementService.update(
            req.params.id,
            req.body,
            imagePath,
            removeImage
        );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const affected = await Announcement.delete(req.params.id);
        res.json({
            success: affected > 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

exports.getLinkPreview = async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({ message: "A url query parameter is required." });
        }
        const preview = await AnnouncementService.fetchLinkPreview(url);
        res.json(preview);
    } catch (err) {
        res.status(422).json({ message: err.message || "Could not read that link." });
    }
};
