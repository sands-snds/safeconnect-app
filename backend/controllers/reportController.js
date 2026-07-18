const Report = require("../models/Report");
const ReportService = require("../services/reportService");

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
                    Update Report Status
============================================================*/

exports.updateStatus = async (req, res) => {
    try {
        await Report.updateStatus(
            req.params.id,
            req.body.status
        );
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