const fs = require("fs");
const PDFDocument = require("pdfkit");
const STYLE = require("../config/reportStyle");

const CELL_PAD = 4;

// Generic, branded table-report PDF generator used by every export type
// (reports, users, sign-in logs, admin logs). Category-specific field
// mapping lives in exportService.js; colors, header text and logos live in
// config/reportStyle.js. This file only lays out a header, an optional
// summary block and a column/row table.
class PDFService {

    // options:
    //   reportTitle    - e.g. "Emergency Incident Report"
    //   filenamePrefix - e.g. "Emergency_Report"
    //   subtitle       - optional line under the title (e.g. applied filters)
    //   summary        - optional array of { label, value }
    //   columns        - array of { label, weight? } -- weight is the column's
    //                    relative width (default 1), e.g. 2.5 for Location
    //   rows           - array of arrays of cell values, same order as columns
    //
    // Builds the whole PDF into memory first and only writes to `res` once
    // it's fully assembled. pdfkit would otherwise stream bytes (and flush
    // response headers) as content is added, so an error part-way through
    // would reach the browser as a truncated file instead of a clean 500.
    static generateTableReport(options, res) {
        return new Promise((resolve, reject) => {
            try {
                const {
                    reportTitle,
                    filenamePrefix,
                    subtitle,
                    summary = [],
                    columns,
                    rows
                } = options;

                const doc = new PDFDocument({
                    size: "A4",
                    margin: 40,
                    layout: columns.length > 5 ? "landscape" : "portrait",
                    // Keep every page so footers ("Page 2 of 5") can be
                    // added once the total is known.
                    bufferPages: true
                });

                const chunks = [];
                doc.on("data", (chunk) => chunks.push(chunk));
                doc.on("error", reject);
                doc.on("end", () => {
                    try {
                        res.setHeader("Content-Type", "application/pdf");
                        res.setHeader(
                            "Content-Disposition",
                            `attachment; filename=${filenamePrefix}_${Date.now()}.pdf`
                        );
                        res.end(Buffer.concat(chunks));
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                this.drawHeader(doc, reportTitle, subtitle);
                if (summary.length) this.drawSummary(doc, summary);
                this.drawTable(doc, columns, rows);
                this.drawFooters(doc);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static drawLogo(doc, logo, x, y, size) {
        if (logo.file && fs.existsSync(logo.file)) {
            doc.image(logo.file, x, y, { fit: [size, size], align: "center", valign: "center" });
            return;
        }
        // Placeholder until a real logo file is added to backend/assets.
        const r = size / 2;
        doc.save()
            .circle(x + r, y + r, r - 1)
            .dash(3, { space: 2 })
            .lineWidth(1)
            .strokeColor(STYLE.colors.mutedText)
            .stroke()
            .restore();
        doc.font(STYLE.fonts.regular)
            .fontSize(7)
            .fillColor(STYLE.colors.mutedText)
            .text(logo.placeholder, x + 4, y + r - 8, { width: size - 8, align: "center" });
    }

    static drawHeader(doc, reportTitle, subtitle) {
        const { left, right } = doc.page.margins;
        const pageRight = doc.page.width - right;
        const top = doc.page.margins.top;
        const size = STYLE.logos.size;

        this.drawLogo(doc, STYLE.logos.left, left, top, size);
        this.drawLogo(doc, STYLE.logos.right, pageRight - size, top, size);

        // Title block centered between the two logos.
        const textX = left + size + 10;
        const textWidth = pageRight - size - 10 - textX;

        doc.font(STYLE.fonts.bold)
            .fontSize(STYLE.fonts.size.title)
            .fillColor(STYLE.colors.brand)
            .text(STYLE.header.title, textX, top + 4, { width: textWidth, align: "center" });

        doc.font(STYLE.fonts.regular)
            .fontSize(STYLE.fonts.size.subtitle)
            .fillColor(STYLE.colors.text);
        STYLE.header.lines.forEach((line) => {
            doc.text(line, textX, doc.y, { width: textWidth, align: "center" });
        });

        // Rule under the header, below whichever is taller: logos or text.
        const ruleY = Math.max(doc.y, top + size) + 8;
        doc.moveTo(left, ruleY).lineTo(pageRight, ruleY)
            .lineWidth(1.5).strokeColor(STYLE.colors.brand).stroke();

        doc.font(STYLE.fonts.bold)
            .fontSize(STYLE.fonts.size.reportTitle)
            .fillColor(STYLE.colors.text)
            .text(reportTitle, left, ruleY + 12, { width: pageRight - left, align: "center" });

        doc.font(STYLE.fonts.regular)
            .fontSize(STYLE.fonts.size.subtitle)
            .fillColor(STYLE.colors.mutedText);
        if (subtitle) {
            doc.text(subtitle, left, doc.y + 2, { width: pageRight - left, align: "center" });
        }
        doc.text(`Generated: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`,
            left, doc.y + 2, { width: pageRight - left, align: "center" });

        doc.moveDown(1);
    }

    static drawSummary(doc, summary) {
        const left = doc.page.margins.left;
        doc.font(STYLE.fonts.bold)
            .fontSize(STYLE.fonts.size.body + 1)
            .fillColor(STYLE.colors.brand)
            .text("Summary", left, doc.y);
        doc.moveDown(0.3);

        doc.fontSize(STYLE.fonts.size.body).fillColor(STYLE.colors.text);
        summary.forEach(({ label, value }) => {
            doc.font(STYLE.fonts.bold).text(`${label}: `, left, doc.y, { continued: true })
                .font(STYLE.fonts.regular).text(String(value ?? ""));
        });
        doc.moveDown(1);
    }

    static drawTable(doc, columns, rows) {
        const left = doc.page.margins.left;
        const tableWidth = doc.page.width - left - doc.page.margins.right;
        const bottomLimit = doc.page.height - doc.page.margins.bottom - 20; // room for footer
        const fontSize = STYLE.fonts.size.table;

        // Column widths in proportion to their weight.
        const totalWeight = columns.reduce((sum, c) => sum + (c.weight || 1), 0);
        let x = left;
        const cols = columns.map((c) => {
            const width = (tableWidth * (c.weight || 1)) / totalWeight;
            const col = { ...c, x, width };
            x += width;
            return col;
        });

        const cellText = (value) => {
            if (value instanceof Date) return value.toLocaleString();
            if (value === null || value === undefined) return "";
            return String(value);
        };

        // Height of a row = its tallest wrapped cell. This is what keeps
        // long locations from spilling into the next row.
        const rowHeight = (cells, font) => {
            doc.font(font).fontSize(fontSize);
            const tallest = Math.max(...cells.map((text, i) =>
                doc.heightOfString(text, { width: cols[i].width - CELL_PAD * 2 })
            ));
            return tallest + CELL_PAD * 2;
        };

        const drawRow = (cells, y, height, { font, fill, color }) => {
            if (fill) doc.rect(left, y, tableWidth, height).fill(fill);
            doc.font(font).fontSize(fontSize).fillColor(color);
            cells.forEach((text, i) => {
                doc.text(text, cols[i].x + CELL_PAD, y + CELL_PAD, {
                    width: cols[i].width - CELL_PAD * 2
                });
            });
            doc.moveTo(left, y + height).lineTo(left + tableWidth, y + height)
                .lineWidth(0.5).strokeColor(STYLE.colors.gridLine).stroke();
        };

        const headerCells = cols.map((c) => c.label);
        const drawHeaderRow = (y) => {
            const h = rowHeight(headerCells, STYLE.fonts.bold);
            drawRow(headerCells, y, h, {
                font: STYLE.fonts.bold,
                fill: STYLE.colors.brand,
                color: STYLE.colors.tableHeaderText
            });
            return y + h;
        };

        let y = drawHeaderRow(doc.y);

        if (!rows.length) {
            doc.font(STYLE.fonts.regular).fontSize(STYLE.fonts.size.body)
                .fillColor(STYLE.colors.mutedText)
                .text("No records match the selected options.", left, y + 12, {
                    width: tableWidth, align: "center"
                });
            return;
        }

        rows.forEach((row, rowIndex) => {
            const cells = cols.map((_, i) => cellText(row[i]));
            const h = rowHeight(cells, STYLE.fonts.regular);

            // Start a new page (repeating the header row) if this row won't fit.
            if (y + h > bottomLimit) {
                doc.addPage();
                y = drawHeaderRow(doc.page.margins.top);
            }

            drawRow(cells, y, h, {
                font: STYLE.fonts.regular,
                fill: rowIndex % 2 === 1 ? STYLE.colors.rowStripe : null,
                color: STYLE.colors.text
            });
            y += h;
        });

        doc.x = left;
        doc.y = y + 10;
    }

    static drawFooters(doc) {
        const { start, count } = doc.bufferedPageRange();
        for (let i = start; i < start + count; i++) {
            doc.switchToPage(i);

            // The footer sits inside the bottom margin; lift the margin while
            // writing so pdfkit doesn't push it onto a new page.
            const margin = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;

            const y = doc.page.height - margin + 10;
            const left = doc.page.margins.left;
            const width = doc.page.width - left - doc.page.margins.right;

            doc.moveTo(left, y - 6).lineTo(left + width, y - 6)
                .lineWidth(0.5).strokeColor(STYLE.colors.gridLine).stroke();

            doc.font(STYLE.fonts.regular)
                .fontSize(STYLE.fonts.size.footer)
                .fillColor(STYLE.colors.mutedText);
            doc.text(STYLE.footer.left, left, y, { width, align: "left", lineBreak: false });
            doc.text(`Page ${i - start + 1} of ${count}`, left, y, { width, align: "center", lineBreak: false });
            doc.text(STYLE.footer.right, left, y, { width, align: "right", lineBreak: false });

            doc.page.margins.bottom = margin;
        }
    }
}

module.exports = PDFService;
