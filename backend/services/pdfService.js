const fs = require("fs");
const PDFDocument = require("pdfkit");
const STYLE = require("../config/reportStyle");

const CELL_PAD = 4;

// attachment; filename="..." (plus filename* for any non-ASCII letters).
const attachment = (name) =>
    `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(name)}`;

// Generic, branded table-report PDF generator used by every export type
// (reports, users, sign-in logs, admin logs). Category-specific field
// mapping lives in exportService.js; colors, header text and logos live in
// config/reportStyle.js. This file only lays out a header, an optional
// summary block and a column/row table.
class PDFService {

    // options:
    //   reportTitle    - e.g. "Emergency Incident Report"
    //   filename       - the download's name without ".pdf"
    //                    (exportService.fileName); filenamePrefix is the old form
    //   subtitle       - optional line under the title (e.g. applied filters)
    //   summary        - optional array of { label, value }
    //   columns        - array of { label, weight? } -- weight is the column's
    //                    relative width (default 1), e.g. 2.5 for Location
    //   rows           - array of arrays of cell values, same order as columns
    //   sections       - instead of columns / rows: several tables, each
    //                    { title, chart?, columns, rows, totalRow? }. chart is
    //                    { type: "bar", labels, series: [{ label, color, values }] }
    //                    or { type: "pie", slices: [{ label, value, color }] };
    //                    totalRow makes the last row bold (a Total row).
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
                    filename,
                    filenamePrefix,
                    subtitle,
                    summary = [],
                    columns,
                    rows,
                    sections
                } = options;
                const parts = sections || [{ columns, rows }];
                const widest = Math.max(...parts.map((p) => p.columns.length));

                const doc = new PDFDocument({
                    size: "A4",
                    margin: 40,
                    layout: widest > 5 ? "landscape" : "portrait",
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
                            attachment(`${filename || `${filenamePrefix}_${Date.now()}`}.pdf`)
                        );
                        res.end(Buffer.concat(chunks));
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                this.drawHeader(doc, reportTitle, subtitle);
                if (summary.length) this.drawSummary(doc, summary);
                parts.forEach((part, i) => {
                    if (part.title) this.drawSectionTitle(doc, part.title, i > 0);
                    if (part.chart) this.drawChart(doc, part.chart);
                    this.drawTable(doc, part.columns, part.rows, { totalRow: part.totalRow });
                });
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

    // A section heading; starts a new page when little room is left.
    static drawSectionTitle(doc, title, notFirst) {
        const left = doc.page.margins.left;
        const bottomLimit = doc.page.height - doc.page.margins.bottom - 20;
        if (notFirst && doc.y > bottomLimit - 260) doc.addPage();
        doc.moveDown(0.5);
        doc.font(STYLE.fonts.bold)
            .fontSize(STYLE.fonts.size.body + 2)
            .fillColor(STYLE.colors.brand)
            .text(title, left, doc.y);
        doc.moveDown(0.4);
    }

    // Simple vector charts (no images): a stacked bar chart or a pie chart
    // with a legend. Moves doc.y below the chart.
    static drawChart(doc, chart) {
        const left = doc.page.margins.left;
        const width = doc.page.width - left - doc.page.margins.right;
        const height = 190;
        const bottomLimit = doc.page.height - doc.page.margins.bottom - 20;
        if (doc.y + height + 30 > bottomLimit) doc.addPage();
        const top = doc.y;
        const fontSize = STYLE.fonts.size.table;

        if (chart.type === "bar") {
            const totals = chart.labels.map((_, i) => chart.series.reduce((sum, s) => sum + (s.values[i] || 0), 0));
            const max = Math.max(1, ...totals);
            const axisX = left + 28;
            const plotW = width - 28;
            const plotH = height - 40;
            const baseY = top + plotH;

            // Y axis: 0, half and max, with light grid lines.
            doc.font(STYLE.fonts.regular).fontSize(fontSize).fillColor(STYLE.colors.mutedText);
            [0, 0.5, 1].forEach((f) => {
                const y = baseY - plotH * f;
                doc.moveTo(axisX, y).lineTo(axisX + plotW, y).lineWidth(0.4).strokeColor(STYLE.colors.gridLine).stroke();
                doc.text(String(Math.round(max * f)), left, y - 4, { width: 24, align: "right" });
            });

            const slot = plotW / Math.max(chart.labels.length, 1);
            const barW = Math.max(1.5, Math.min(26, slot * 0.7));
            const every = Math.ceil(chart.labels.length / 12); // about 12 labels at most
            chart.labels.forEach((label, i) => {
                const x = axisX + slot * i + (slot - barW) / 2;
                let y = baseY;
                chart.series.forEach((s) => {
                    const h = (plotH * (s.values[i] || 0)) / max;
                    if (h > 0) doc.rect(x, y - h, barW, h).fill(s.color);
                    y -= h;
                });
                if (i % every === 0) {
                    doc.fillColor(STYLE.colors.mutedText).font(STYLE.fonts.regular).fontSize(fontSize - 1)
                        .text(label.replace(/, \d{4}$/, ""), axisX + slot * i - 20 + slot / 2, baseY + 4, { width: 40, align: "center", lineBreak: false });
                }
            });

            // Legend
            let lx = axisX;
            const ly = baseY + 20;
            chart.series.forEach((s) => {
                doc.rect(lx, ly, 9, 9).fill(s.color);
                doc.fillColor(STYLE.colors.text).fontSize(fontSize).text(s.label, lx + 13, ly, { lineBreak: false });
                lx += 13 + doc.widthOfString(s.label) + 18;
            });
            doc.x = left;
            doc.y = top + height + 4;
            return;
        }

        // Pie
        const total = chart.slices.reduce((sum, s) => sum + (s.value || 0), 0);
        const r = 75;
        const cx = left + r + 10;
        const cy = top + r + 5;
        if (!total) {
            doc.circle(cx, cy, r).lineWidth(1).strokeColor(STYLE.colors.gridLine).stroke();
            doc.font(STYLE.fonts.regular).fontSize(fontSize).fillColor(STYLE.colors.mutedText)
                .text("No reports", cx - r, cy - 4, { width: r * 2, align: "center" });
        } else {
            let angle = -Math.PI / 2;
            chart.slices.forEach((s) => {
                if (!s.value) return;
                const sweep = (Math.PI * 2 * s.value) / total;
                // Polygon approximation of the arc (pdfkit has no arc-to).
                doc.moveTo(cx, cy);
                const steps = Math.max(2, Math.ceil(sweep / 0.05));
                for (let k = 0; k <= steps; k++) {
                    const a = angle + (sweep * k) / steps;
                    doc.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                }
                doc.closePath().fill(s.color);
                angle += sweep;
            });
        }

        // Legend with counts and shares.
        let ly = top + 20;
        const lx = cx + r + 30;
        chart.slices.forEach((s) => {
            const pct = total ? Math.round((s.value / total) * 100) : 0;
            doc.rect(lx, ly, 10, 10).fill(s.color);
            doc.font(STYLE.fonts.regular).fontSize(fontSize + 1).fillColor(STYLE.colors.text)
                .text(`${s.label}: ${s.value} (${pct}%)`, lx + 16, ly, { lineBreak: false });
            ly += 18;
        });
        doc.font(STYLE.fonts.bold).fontSize(fontSize + 1).fillColor(STYLE.colors.text)
            .text(`Total: ${total}`, lx + 16, ly + 4, { lineBreak: false });
        doc.x = left;
        doc.y = top + r * 2 + 20;
    }

    static drawTable(doc, columns, rows, { totalRow = false } = {}) {
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

            const isTotal = totalRow && rowIndex === rows.length - 1;
            drawRow(cells, y, h, {
                font: isTotal ? STYLE.fonts.bold : STYLE.fonts.regular,
                fill: isTotal ? STYLE.colors.rowStripe : rowIndex % 2 === 1 ? STYLE.colors.rowStripe : null,
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
