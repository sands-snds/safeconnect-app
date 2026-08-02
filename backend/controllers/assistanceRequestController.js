const AssistanceRequest = require("../models/AssistanceRequest");
const AssistanceRequestService = require("../services/assistanceRequestService");

exports.createRequest = async (req, res) => {
    try {
        const result = await AssistanceRequestService.create(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to submit assistance request." });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await AssistanceRequest.findAll();
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to retrieve assistance requests." });
    }
};

exports.getRequest = async (req, res) => {
    try {
        const request = await AssistanceRequest.findById(req.params.id);
        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const result = await AssistanceRequestService.update(req.params.id, req.body);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update assistance request." });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const affected = await AssistanceRequest.updateStatus(req.params.id, req.body.status);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const affected = await AssistanceRequest.delete(req.params.id);
        res.json({ success: affected > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getStatistics = async (req, res) => {
    try {
        const stats = await AssistanceRequest.getStatistics();
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};

exports.getRequestsByUser = async (req, res) => {
    try {
        const requests = await AssistanceRequest.findByReporter(req.params.userId);
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
};
