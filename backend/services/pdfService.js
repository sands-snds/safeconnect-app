const PDFDocument = require("pdfkit");

// Generic, branded table-report PDF generator used by every export type
// (emergency reports, assistance requests, petty crimes, users, sign-in
// logs, admin logs). Category-specific field mapping lives in
// exportService.js -- this file only knows how to lay out a title, an
// optional summary block, and a column/row table.
class PDFService {

    // options:
    //   reportTitle   - e.g. "Emergency Incident Report"
    //   filenamePrefix- e.g. "Emergency_Report"
    //   summary       - optional array of { label, value }
    //   columns       - array of { label, width, x } describing the table header
    //   rows          - array of arrays of cell strings, same length/order as columns
    //
    // Builds the whole PDF into memory first and only writes to `res` once
    // it's fully assembled. This is deliberate: pdfkit streams bytes to
    // `res` as content is added, which flushes response headers immediately.
    // If something later in the row loop throws, headers are already sent
    // and Express can't send a clean JSON error anymore -- the browser gets
    // a truncated/garbled response instead of a readable error. Buffering
    // first means a thrown error here surfaces as a normal caught exception
    // that the controller can turn into a proper 500 JSON response.
    static generateTableReport(options, res) {
        return new Promise((resolve, reject) => {
            try {
                const {
                    reportTitle,
                    filenamePrefix,
                    summary = [],
                    columns,
                    rows
                } = options;

                const doc = new PDFDocument({
                    size: "A4",
                    margin: 50,
                    layout: columns.length > 5 ? "landscape" : "portrait"
                });

                const chunks = [];
                doc.on("data", (chunk) => chunks.push(chunk));
                doc.on("error", reject);
                doc.on("end", () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        res.setHeader("Content-Type", "application/pdf");
                        res.setHeader(
                            "Content-Disposition",
                            `attachment; filename=${filenamePrefix}_${Date.now()}.pdf`
                        );
                        res.end(buffer);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
                const tableLeft = doc.page.margins.left;
                const tableRight = doc.page.width - doc.page.margins.right;

                this.drawHeader(doc, reportTitle);

                if (summary.length) {
                    doc.font("Helvetica-Bold").fontSize(14).text("Summary");
                    doc.moveDown(0.5);
                    doc.font("Helvetica").fontSize(11);
                    summary.forEach(({ label, value }) => {
                        doc.text(`${label}: ${value}`);
                    });
                    doc.moveDown(1.5);
                }

                // Column x positions, evenly distributed across the usable width
                // unless an explicit width/x was given.
                let x = tableLeft;
                const resolvedColumns = columns.map((col) => {
                    const width = col.width || pageWidth / columns.length;
                    const resolved = { ...col, x, width };
                    x += width;
                    return resolved;
                });

                const drawTableHeader = () => {
                    const headerY = doc.y;
                    doc.font("Helvetica-Bold").fontSize(9);
                    resolvedColumns.forEach((col) => {
                        doc.text(col.label, col.x, headerY, { width: col.width - 6 });
                    });
                    doc.moveDown();
                    doc.moveTo(tableLeft, doc.y).lineTo(tableRight, doc.y).stroke();
                    doc.font("Helvetica").fontSize(9);
                };

                drawTableHeader();

                rows.forEach((row, rowIndex) => {
                    if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
                        this.addFooter(doc);
                        doc.addPage();
                        drawTableHeader();
                    }

                    const rowY = doc.y + 4;
                    resolvedColumns.forEach((col, i) => {
                        // Defensive: coerce anything (Date objects, numbers,
                        // null, a stray object) down to a safe string rather
                        // than letting pdfkit choke on an unexpected type.
                        let cell = row[i];
                        if (cell instanceof Date) cell = cell.toLocaleString();
                        else if (cell === null || cell === undefined) cell = "";
                        else cell = String(cell);

                        try {
                            doc.text(cell, col.x, rowY, { width: col.width - 6 });
                        } catch (cellErr) {
                            throw new Error(
                                `Failed rendering row ${rowIndex}, column "${col.label}" (value: ${JSON.stringify(row[i])}): ${cellErr.message}`
                            );
                        }
                    });
                    doc.moveDown();
                    doc
                        .strokeColor("#dddddd")
                        .moveTo(tableLeft, doc.y)
                        .lineTo(tableRight, doc.y)
                        .stroke()
                        .strokeColor("#000000");
                });

                this.addFooter(doc);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static drawHeader(doc, reportTitle) {
        doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("SAFECONNECT", { align: "center" });

        doc
            .fontSize(12)
            .font("Helvetica")
            .text("Community Disaster and Emergency Response System", { align: "center" });

        doc.text("Barangay Santa Fe, Dasmarinas, Cavite", { align: "center" });

        doc.moveDown();
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown();

        doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text(reportTitle, { align: "center" });

        doc.moveDown();
        doc.font("Helvetica").fontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();
    }

    static addFooter(doc) {
        // The footer sits inside the bottom margin. pdfkit starts a new page
        // for any text written past the margin, which used to push the
        // footer onto an extra blank page -- so lift the margin while drawing.
        const margin = doc.page.margins.bottom;
        const bottom = doc.page.height - margin + 10;
        doc.page.margins.bottom = 0;
        doc.fontSize(8);
        doc.text("Generated by SafeConnect", doc.page.margins.left, bottom);
        doc.text("Barangay Santa Fe, Dasmarinas, Cavite", { align: "center" });
        doc.text("This document was generated electronically.", { align: "right" });
        doc.page.margins.bottom = margin;
    }
}

module.exports = PDFService;