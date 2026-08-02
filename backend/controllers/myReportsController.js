// Aggregates a resident's reports across all three report types, for
// MyReportsPage.jsx (fetchMyReports() in Services/api.js calls
// GET /api/reports/user/:userId).
const Report = require("../models/Report");
const AssistanceRequest = require("../models/AssistanceRequest");
const PettyCrime = require("../models/PettyCrime");

exports.getMyReports = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [emergency, assistance, pettyCrime] = await Promise.all([
            Report.findByReporter(userId),
            AssistanceRequest.findByReporter(userId),
            PettyCrime.findByReporter(userId)
        ]);

        const combined = [
            ...emergency.map(r => ({ ...r, reportType: "emergency" })),
            ...assistance.map(r => ({ ...r, reportType: "assistance" })),
            ...pettyCrime.map(r => ({ ...r, reportType: "petty_crime" }))
        ].sort((a, b) => {
            const dateA = new Date(a.time || a.timestamp);
            const dateB = new Date(b.time || b.timestamp);
            return dateB - dateA;
        });

        res.json(combined);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your reports." });
    }
};
