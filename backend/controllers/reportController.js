const Report = require("../models/Report");
const { sendIfMediaTooLarge } = require("../utils/mediaErrors");
const ReportService = require("../services/reportService");
const Notification = require("../models/Notification");
const live = require("../services/liveUpdates");
const { validateStatusTransition, validateDismissalReason, dismissalMessage, DISMISSED } = require("../utils/statusWorkflow");



// A service result's `status` (e.g. 400 for a bad people count) is the HTTP
// status, not part of the body.
const sendResult = (res, result, successStatus = 200) => {
    const { status, ...body } = result;
    res.status(result.success === false && status ? status : successStatus).json(body);
};

exports.createReport = async (req, res) => {
    try {
        const result = await ReportService.create(req.body);
        sendResult(res, result, 201);
    } catch (err) {
        console.error(err);
        if (sendIfMediaTooLarge(res, err)) return;
        res.status(500).json({
            success: false,
            message: "Failed to create report."
        });
    }
};



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



exports.updateReport = async (req, res) => {
    try {
        const result = await ReportService.update(req.params.id, req.body);
        sendResult(res, result);
    } catch (err) {
        console.error(err);
        if (sendIfMediaTooLarge(res, err)) return;
        res.status(500).json({
            success: false,
            message: "Failed to update report."
        });
    }
};



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



exports.updateStatus = async (req, res) => {
    try {
        const report = await Report.findStatusById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        let replyMessage;
        let dismissalReason = null;
        try {
            replyMessage = validateStatusTransition(report.status, req.body.status);
            if (req.body.status === DISMISSED) {
                dismissalReason = validateDismissalReason(req.body.reason);
                replyMessage = dismissalMessage(dismissalReason);
            }
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        await Report.updateStatus(
            req.params.id,
            req.body.status,
            dismissalReason
        );
        
        if (report.reporter_id) live.notifyUser(report.reporter_id, "reports");
        // Other staff (the Incident Map, report lists) see the change at once.
        live.notifyAdmins("admin-notifications");

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