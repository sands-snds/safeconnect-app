const ExportService = require("../services/exportService");

exports.exportReportsPDF = async (req, res) => {
    try {
        await ExportService.exportReportsPDF(
            res,
            req.query
        );
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Unable to export PDF."
        });
    }
};

exports.exportReportsExcel = async (req, res) => {
    try {
        await ExportService.exportReportsExcel(
            res,
            req.query
        );
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Unable to export Excel."
        });
    }
};