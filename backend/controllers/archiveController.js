const ArchiveService = require("../services/archiveService");

exports.getSettings = async (req, res) => {
    try {
        const months = await ArchiveService.getAutoArchiveMonths();
        res.json({ success: true, months });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load archive settings." });
    }
};

// Body: { months: 0 | 6 | 12 } (0 = auto-archive off).
exports.updateSettings = async (req, res) => {
    const months = Number(req.body.months);
    if (!ArchiveService.ALLOWED_MONTHS.includes(months)) {
        return res.status(400).json({ success: false, message: "Choose Off, 6 months, or 1 year." });
    }

    try {
        await ArchiveService.setAutoArchiveMonths(months);
        // Apply the new period right away instead of waiting for the next run.
        const archived = await ArchiveService.runAutoArchive();
        res.json({ success: true, months, archived });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update archive settings." });
    }
};

const setArchived = (archived) => async (req, res) => {
    try {
        const result = await ArchiveService.setArchived(req.params.type, req.params.id, archived);
        if (!result.success) {
            return res.status(result.status || 400).json({ success: false, message: result.message });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update report." });
    }
};

exports.archiveReport = setArchived(true);
exports.restoreReport = setArchived(false);
