const PettyCrime = require("../models/PettyCrime");
const PettyCrimeService = require("../services/pettyCrimeService");
const Notification = require("../models/Notification");
const { validateStatusTransition } = require("../utils/statusWorkflow");

exports.createReport = async (req, res) => {
    try {
        const result = await PettyCrimeService.create(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to submit petty crime report." });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await PettyCrime.findAll();
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to retrieve petty crime reports." });
    }
};

exports.getReport = async (req, res) => {
    try {
        const report = await PettyCrime.findById(req.params.id);
        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const result = await PettyCrimeService.update(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update petty crime report." });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const report = await PettyCrime.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        let replyMessage;
        try {
            replyMessage = validateStatusTransition(report.status, req.body.status);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        const affected = await PettyCrime.updateStatus(req.params.id, req.body.status);

        if (report.reporter_id && replyMessage) {
            await Notification.create({
                userId: report.reporter_id,
                title: `Update on your petty crime report`,
                message: replyMessage,
                notificationType: "petty_crime_status",
                referenceId: report.id
            });
        }

        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const affected = await PettyCrime.delete(req.params.id);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getStatistics = async (req, res) => {
    try {
        const stats = await PettyCrime.getStatistics();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getReportsByUser = async (req, res) => {
    try {
        const reports = await PettyCrime.findByReporter(req.params.userId);
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};
