const Report = require("../models/Report");
const ReportService = require("../services/reportService");
const Notification = require("../models/Notification");
const { validateStatusTransition } = require("../utils/statusWorkflow");

/* =========================================================
                    Create Report
============================================================*/

exports.createReport = async (req, res) => {
    try {
        const result = await ReportService.create(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to create report."
        });
    }
};

/* =========================================================
                    Get Reports
============================================================*/

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.json(reports);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve reports."
        });
    }
};

/* =========================================================
                    Get Report by ID
============================================================*/

exports.getReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

/* =========================================================
                    Update Report (resident edit)
============================================================*/

exports.updateReport = async (req, res) => {
    try {
        const result = await ReportService.update(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update report."
        });
    }
};

/* =========================================================
                    Delete Report
============================================================*/

exports.deleteReport = async (req, res) => {
    try {
        const affected = await Report.delete(req.params.id);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

/* =========================================================
                    Get Reports for one user
============================================================*/

exports.getReportsByUser = async (req, res) => {
    try {
        const reports = await Report.findByReporter(req.params.userId);
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};

/* =========================================================
                    Update Report Status
============================================================*/

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

        await Report.updateStatus(
            req.params.id,
            req.body.status
        );

        if (report.reporter_id && replyMessage) {
            await Notification.create({
                userId: report.reporter_id,
                title: `Update on your emergency report`,
                message: replyMessage,
                notificationType: "emergency_status",
                referenceId: report.id
            });
        }

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

/* =========================================================
                    Statistics
============================================================*/

exports.getStatistics = async (req, res) => {
    try {
        const stats = await Report.getStatistics();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false
        });
    }
};