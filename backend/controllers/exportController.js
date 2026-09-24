const ExportService = require("../services/exportService");

const isValidType = (type) => ExportService.validTypes.includes(type);

exports.exportPDF = async (req, res) => {
    const { type } = req.params;

    if (!isValidType(type)) {
        return res.status(400).json({
            success: false,
            message: `Unknown report type "${type}". Valid types: ${ExportService.validTypes.join(", ")}`
        });
    }

    try {
        await ExportService.exportPDF(type, req.query, res);
    } catch (err) {
        console.error(err);
        // Headers may already be sent if the failure happened mid-stream;
        // guard against a double response.
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Unable to export PDF." });
        }
    }
};

exports.exportExcel = async (req, res) => {
    const { type } = req.params;

    if (!isValidType(type)) {
        return res.status(400).json({
            success: false,
            message: `Unknown report type "${type}". Valid types: ${ExportService.validTypes.join(", ")}`
        });
    }

    try {
        await ExportService.exportExcel(type, req.query, res);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Unable to export Excel." });
        }
    }
};