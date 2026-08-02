const PettyCrime = require("../models/PettyCrime");
const PettyCrimeService = require("../services/pettyCrimeService");

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
        const affected = await PettyCrime.updateStatus(req.params.id, req.body.status);
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
