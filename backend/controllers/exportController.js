const ExportService = require("../services/exportService");

const isValidType = (type) => ExportService.validTypes.includes(type);

// Printed on the report: "Generated: <date and time>  By: <name>".
const generatedBy = (req) => (req.admin && (req.admin.full_name || req.admin.username || req.admin.email_address)) || "";

exports.exportPDF = async (req, res) => {
    const { type } = req.params;

    if (!isValidType(type)) {
        return res.status(400).json({
            success: false,
            message: `Unknown report type "${type}". Valid types: ${ExportService.validTypes.join(", ")}`
        });
    }

    try {
        await ExportService.exportPDF(type, req.query, res, generatedBy(req));
    } catch (err) {
        console.error(err);
        
        
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
        await ExportService.exportExcel(type, req.query, res, generatedBy(req));
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Unable to export Excel." });
        }
    }
};