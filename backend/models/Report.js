const Report = require("../models/Report");
const ReportService = require("../services/reportService");
const Notification = require("../models/Notification");
const { validateStatusTransition } = require("../utils/statusWorkflow");

exports.createReport = async (req, res) => {
    try {
        const imagePaths = req.files?.length
            ? req.files.map(f => `/uploads/${f.filename}`)
            : [];

        const {
            reporterId,
            reporterName,
            reporterContact,
            reportFor,
            victimName,
            victimContact,
            victimRelationship,
            category,
            description,
            location,
        } = req.body;

        const result = await ReportService.create({
            reporterId:         reporterId     || null,
            reporterName:       reporterName   || null,
            reporterContact:    reporterContact || null,
            reportFor:          reportFor      || "self",
            victimName:         reportFor === "others" ? (victimName    || null) : null,
            victimContact:      reportFor === "others" ? (victimContact || null) : null,
            victimRelationship: reportFor === "others" ? (victimRelationship || null) : null,
            category,
            description,
            location,
            imagePaths,
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to submit emergency report." });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to retrieve reports." });
    }
};

exports.getReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const result = await ReportService.update(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update report." });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        let replyMessage;
        try {
            replyMessage = validateStatusTransition(report.status, req.body.status);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        const affected = await Report.updateStatus(req.params.id, req.body.status);

        if (report.reporter_id && replyMessage) {
            await Notification.create({
                userId: report.reporter_id,
                title: "Update on your emergency report",
                message: replyMessage,
                notificationType: "emergency_status",
                referenceId: report.id,
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
        const affected = await Report.delete(req.params.id);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getStatistics = async (req, res) => {
    try {
        const stats = await Report.getStatistics();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getReportsByUser = async (req, res) => {
    try {
        const reports = await Report.findByReporter(req.params.userId);
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};