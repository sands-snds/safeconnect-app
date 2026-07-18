const Report = require("../models/Report");
const PDFService = require("./pdfService");
const ExcelService = require("./excelService");

class ExportService {

    static async exportReportsPDF(res, filters = {}) {

        const reports = await Report.findAll(filters);

        const statistics = await Report.getStatistics();

        await PDFService.generateEmergencyReport(
            reports,
            statistics,
            res
        );

    }

    static async exportReportsExcel(res, filters = {}) {

        const reports = await Report.findAll(filters);

        const statistics = await Report.getStatistics();

        return ExcelService.generateEmergencyReport(
            reports,
            statistics,
            res
        );

    }

}

module.exports = ExportService;