const SiteContent = require("../services/siteContentService");
const SiteMedia = require("../services/siteMediaService");

// Public: the landing page, resident page, footer and admin panel read this.
// content = contact details (Content > Page Contacts)
// media   = carousel photos and demo videos (Content > Page Contents)
exports.getContent = async (req, res) => {
    const options = { icons: SiteContent.CONTACT_ICONS, colors: SiteContent.CONTACT_COLORS };
    try {
        const [content, media] = await Promise.all([SiteContent.getContent(), SiteMedia.getMedia()]);
        // options: choices for the Page Contacts editor.
        res.json({ success: true, content, media, options });
    } catch (err) {
        console.error(err);
        // Fall back to the defaults so the public site still shows numbers.
        res.json({ success: true, content: SiteContent.DEFAULT_CONTENT, media: SiteMedia.DEFAULT_MEDIA, options, fallback: true });
    }
};

// Admin (super_admin) only. Body: { emergencyContacts, officials, socials }.
exports.updateContent = async (req, res) => {
    const { content, error } = SiteContent.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await SiteContent.saveContent(content);
        res.json({ success: true, content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Couldn't save the contact details." });
    }
};

// Admin (super_admin) only. Body: { carousel, systemDemo, adminDemo }.
exports.updateMedia = async (req, res) => {
    const { media, error } = SiteMedia.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        await SiteMedia.saveMedia(media);
        res.json({ success: true, media });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Couldn't save the page contents." });
    }
};

// Admin (super_admin) only. Multipart field "file" (an image or a video,
// checked by the route's multer). Returns the stored path to put in media.
exports.uploadMedia = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file was uploaded." });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}`, type: req.file.mimetype });
};
