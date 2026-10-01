const Announcement = require("../models/Announcement");
const AnnouncementService = require("../services/announcementService");
const AnnouncementLike = require("../models/AnnouncementLike");
const AnnouncementComment = require("../models/AnnouncementComment");
const User = require("../models/User");
const { isAdminRole } = require("../utils/roles");

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
// Each row is enriched with its like/comment counts (and, when the caller
// is signed in via attachUserIfPresent, whether they've liked it) so the
// News page doesn't need a request per card just to show those numbers.
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll();
        const [likeCounts, commentCounts, likedIds] = await Promise.all([
            AnnouncementLike.countsForAll(),
            AnnouncementComment.countsForAll(),
            AnnouncementLike.likedAnnouncementIdsFor(req.user?.id)
        ]);
        const likedSet = new Set(likedIds);

        const enriched = announcements.map((a) => ({
            ...a,
            likeCount: likeCounts[a.id] || 0,
            commentCount: commentCounts[a.id] || 0,
            likedByMe: likedSet.has(a.id)
        }));

        res.json(enriched);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

// ── Likes & comments (shared across residents) ─────────────────────────────

exports.toggleLike = async (req, res) => {
    try {
        const liked = await AnnouncementLike.toggle(req.params.id, req.user.id);
        const count = await AnnouncementLike.countFor(req.params.id);
        res.json({ success: true, liked, count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to update like." });
    }
};

exports.getComments = async (req, res) => {
    try {
        const rows = await AnnouncementComment.findByAnnouncement(req.params.id);
        const comments = rows.map((c) => ({
            id: c.id,
            text: c.comment_text,
            author: c.full_name || c.username || "Resident",
            userId: c.user_id,
            date: c.created_at
        }));
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to load comments." });
    }
};

exports.createComment = async (req, res) => {
    try {
        const text = (req.body.text || "").trim();
        if (!text) {
            return res.status(400).json({ success: false, message: "Comment cannot be empty." });
        }
        if (text.length > 1000) {
            return res.status(400).json({ success: false, message: "Comment is too long." });
        }

        const id = await AnnouncementComment.create(req.params.id, req.user.id, text);
        const author = await User.findById(req.user.id);

        res.status(201).json({
            success: true,
            comment: {
                id,
                text,
                author: author?.full_name || author?.username || "Resident",
                userId: req.user.id,
                date: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to post comment." });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const comment = await AnnouncementComment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found." });
        }

        const isOwner = String(comment.user_id) === String(req.user.id);
        if (!isOwner) {
            const requester = await User.findById(req.user.id);
            if (!requester || !isAdminRole(requester.role)) {
                return res.status(403).json({ success: false, message: "You can only delete your own comments." });
            }
        }

        await AnnouncementComment.delete(req.params.commentId);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to delete comment." });
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
            return res.status(400).json({ success: false, message: "A url query parameter is required." });
        }
        const preview = await AnnouncementService.fetchLinkPreview(url);
        // CreateAnnouncementView checks result.success -- without it every
        // preview was treated as a failure and discarded.
        res.json({ success: true, ...preview });
    } catch (err) {
        res.status(422).json({ success: false, message: err.message || "Could not read that link." });
    }
};
