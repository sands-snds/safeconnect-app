const AssistanceRequest = require("../models/AssistanceRequest");
const AssistanceRequestService = require("../services/assistanceRequestService");
const Notification = require("../models/Notification");
const { validateStatusTransition } = require("../utils/statusWorkflow");

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
        const request = await AssistanceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        let replyMessage;
        try {
            replyMessage = validateStatusTransition(request.status, req.body.status);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        const affected = await AssistanceRequest.updateStatus(req.params.id, req.body.status);

        if (request.reporter_id && replyMessage) {
            await Notification.create({
                userId: request.reporter_id,
                title: `Update on your assistance request`,
                message: replyMessage,
                notificationType: "assistance_status",
                referenceId: request.id
            });
        }

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
