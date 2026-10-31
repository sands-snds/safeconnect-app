const SiteContent = require("../services/siteContentService");
const SiteMedia = require("../services/siteMediaService");

exports.getContent = async (req, res) => {
    const options = { icons: SiteContent.CONTACT_ICONS, colors: SiteContent.CONTACT_COLORS };
    try {
        const [content, media] = await Promise.all([SiteContent.getContent(), SiteMedia.getMedia()]);
        // options: choices for the Page Contacts editor.
        res.json({ success: true, content, media, options });
    } catch (err) {
        console.error(err);

        res.json({ success: true, content: SiteContent.DEFAULT_CONTENT, media: SiteMedia.DEFAULT_MEDIA, options, fallback: true });
    }
};

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

exports.uploadMedia = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file was uploaded." });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}`, type: req.file.mimetype });
};
