const SiteContent = require("../services/siteContentService");

// Public: the landing page, resident page and footer read this.
exports.getContent = async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        res.json({
            success: true,
            content,
            // Choices for the editor (System > Site Contacts).
            options: { icons: SiteContent.CONTACT_ICONS, colors: SiteContent.CONTACT_COLORS }
        });
    } catch (err) {
        console.error(err);
        // Fall back to the defaults so the public site still shows numbers.
        res.json({ success: true, content: SiteContent.DEFAULT_CONTENT, fallback: true });
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
