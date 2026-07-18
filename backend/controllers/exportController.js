const ExportService = require("../services/exportService");

exports.exportReportsPDF = async (req, res) => {
    try {
        await ExportService.exportReportsPDF(req, res);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success:false,
            message:"Unable to export PDF."
        });
    }
};