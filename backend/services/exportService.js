const Report = require("../models/Report");
const AssistanceRequest = require("../models/AssistanceRequest");
const PettyCrime = require("../models/PettyCrime");
const User = require("../models/User");
const Log = require("../models/Log");
const AdminActivity = require("../models/AdminActivity");

const db = require("../config/db");

const PDFService = require("./pdfService");
const ExcelService = require("./excelService");

// The three report categories, as used by the dashboard charts. `dateColumn`
// is each table's submission time. Queries below select only the columns
// they need -- the tables also hold base64 photos/videos.
const REPORT_TABLES = [
    { key: "emergency", label: "Emergency", table: "emergency_reports", dateColumn: "time" },
    { key: "assistance", label: "Assistance", table: "assistance_requests", dateColumn: "timestamp" },
    { key: "pettyCrime", label: "Petty Crime", table: "petty_crimes", dateColumn: "timestamp" }
];

const RANGE_DAYS = [7, 15, 30, 90];

// YYYY-MM-DD of `date` in the admin's timezone. tzOffset is the browser's
// getTimezoneOffset() (minutes, e.g. -480 for the Philippines); the server
// runs in UTC, so without it evening reports land on the next day.
const localDayKey = (date, tzOffset) =>
    new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);

const dayKeyLabel = (key) =>
    new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
        timeZone: "UTC", month: "short", day: "numeric", year: "numeric"
    });

// Every report type now shares the same forward-only status workflow
// (see backend/utils/statusWorkflow.js): Received -> In Progress -> Resolved.
const REPORT_STATUSES = ["Received", "In Progress", "Resolved"];

const countByStatus = (rows) => {
    const counts = {};
    REPORT_STATUSES.forEach((s) => { counts[s] = 0; });
    rows.forEach((r) => {
        if (counts[r.status] === undefined) counts[r.status] = 0;
        counts[r.status]++;
    });
    return counts;
};

const summaryFromCounts = (total, counts, label = "Reports") => [
    { label: `Total ${label}`, value: total },
    ...REPORT_STATUSES.map((s) => ({ label: s, value: counts[s] || 0 }))
];

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "");

// Each entry describes how to build one exportable dataset: a human title,
// a PDF-friendly filename prefix, and a build(filters) function returning
// { summary, columns, rows } consumed by PDFService/ExcelService.
const EXPORTERS = {

    // Dashboard "Reports Over Time" chart: one row per day in the range.
    // filters: days (7/15/30/90), tzOffset (see localDayKey)
    reportsOverTime: {
        reportTitle: "Reports Over Time",
        filenamePrefix: "Reports_Over_Time",
        async build(filters = {}) {
            const days = RANGE_DAYS.includes(Number(filters.days)) ? Number(filters.days) : 30;
            const tzOffset = Number.isFinite(Number(filters.tzOffset)) ? Number(filters.tzOffset) : 0;

            // Oldest first, including days with no reports.
            const todayKey = localDayKey(new Date(), tzOffset);
            const buckets = [];
            const byKey = {};
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(`${todayKey}T00:00:00Z`);
                d.setUTCDate(d.getUTCDate() - i);
                const key = d.toISOString().slice(0, 10);
                const bucket = { key, emergency: 0, assistance: 0, pettyCrime: 0 };
                buckets.push(bucket);
                byKey[key] = bucket;
            }

            // A day of margin either side of the range covers any timezone.
            const since = new Date(`${buckets[0].key}T00:00:00Z`);
            since.setUTCDate(since.getUTCDate() - 1);

            for (const { key, table, dateColumn } of REPORT_TABLES) {
                const [rows] = await db.query(
                    `SELECT ${dateColumn} AS reported_at FROM ${table} WHERE ${dateColumn} >= ?`,
                    [since]
                );
                rows.forEach(({ reported_at }) => {
                    if (!reported_at) return;
                    const bucket = byKey[localDayKey(new Date(reported_at), tzOffset)];
                    if (bucket) bucket[key]++;
                });
            }

            const totals = { emergency: 0, assistance: 0, pettyCrime: 0 };
            buckets.forEach((b) => REPORT_TABLES.forEach(({ key }) => { totals[key] += b[key]; }));
            const grandTotal = totals.emergency + totals.assistance + totals.pettyCrime;

            return {
                summary: [
                    { label: "Period", value: `Last ${days} days (${dayKeyLabel(buckets[0].key)} - ${dayKeyLabel(todayKey)})` },
                    { label: "Total Reports", value: grandTotal },
                    ...REPORT_TABLES.map(({ key, label }) => ({ label, value: totals[key] }))
                ],
                columns: [
                    { label: "Date", key: "date" },
                    ...REPORT_TABLES.map(({ key, label }) => ({ label, key })),
                    { label: "Total", key: "total" }
                ],
                rows: buckets.map((b) => [
                    dayKeyLabel(b.key),
                    b.emergency,
                    b.assistance,
                    b.pettyCrime,
                    b.emergency + b.assistance + b.pettyCrime
                ])
            };
        }
    },

    // Dashboard pie charts: how many reports of each category are in each status.
    statusSummary: {
        reportTitle: "Reports by Status",
        filenamePrefix: "Reports_By_Status",
        async build() {
            const rows = [];
            const statusTotals = {};
            let grandTotal = 0;

            for (const { label, table } of REPORT_TABLES) {
                const [counts] = await db.query(
                    `SELECT status, COUNT(*) AS n FROM ${table} GROUP BY status`
                );
                const byStatus = {};
                counts.forEach(({ status, n }) => { byStatus[status] = Number(n); });
                const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

                REPORT_STATUSES.forEach((s) => {
                    statusTotals[s] = (statusTotals[s] || 0) + (byStatus[s] || 0);
                });
                grandTotal += total;

                rows.push([label, ...REPORT_STATUSES.map((s) => byStatus[s] || 0), total]);
            }

            return {
                summary: summaryFromCounts(grandTotal, statusTotals),
                columns: [
                    { label: "Category", key: "category" },
                    ...REPORT_STATUSES.map((s) => ({ label: s, key: s })),
                    { label: "Total", key: "total" }
                ],
                rows
            };
        }
    },

    emergency: {
        reportTitle: "Emergency Incident Report",
        filenamePrefix: "Emergency_Reports",
        async build(filters) {
            const reports = await Report.findAll(filters);
            const counts = countByStatus(reports);
            return {
                summary: summaryFromCounts(reports.length, counts),
                columns: [
                    { label: "Reference", key: "reference" },
                    { label: "Type", key: "type" },
                    { label: "Severity", key: "severity" },
                    { label: "Reporter", key: "reporter" },
                    { label: "Location", key: "location" },
                    { label: "Status", key: "status" },
                    { label: "Date", key: "date" }
                ],
                rows: reports.map((r) => [
                    r.report_reference,
                    r.emergency_type,
                    r.severity,
                    r.reporter_name,
                    r.location,
                    r.status,
                    fmtDate(r.time)
                ])
            };
        }
    },

    assistance: {
        reportTitle: "Assistance Requests Report",
        filenamePrefix: "Assistance_Requests",
        async build(filters) {
            const requests = await AssistanceRequest.findAll(filters);
            const counts = countByStatus(requests);
            return {
                summary: summaryFromCounts(requests.length, counts, "Requests"),
                columns: [
                    { label: "Reference", key: "reference" },
                    { label: "Type", key: "type" },
                    { label: "Requester", key: "requester" },
                    { label: "People", key: "people" },
                    { label: "Location", key: "location" },
                    { label: "Urgency", key: "urgency" },
                    { label: "Status", key: "status" },
                    { label: "Date", key: "date" }
                ],
                rows: requests.map((r) => [
                    r.report_reference,
                    r.request_assistance_type,
                    r.full_name,
                    r.number_of_people_needing_help,
                    r.current_location,
                    r.urgency_level,
                    r.status,
                    fmtDate(r.timestamp)
                ])
            };
        }
    },

    pettyCrime: {
        reportTitle: "Petty Crime Reports Report",
        filenamePrefix: "Petty_Crime_Reports",
        async build(filters) {
            const reports = await PettyCrime.findAll(filters);
            const counts = countByStatus(reports);
            return {
                summary: summaryFromCounts(reports.length, counts),
                columns: [
                    { label: "Reference", key: "reference" },
                    { label: "Crime Type", key: "type" },
                    { label: "Reporter", key: "reporter" },
                    { label: "Location", key: "location" },
                    { label: "Status", key: "status" },
                    { label: "Date", key: "date" }
                ],
                rows: reports.map((r) => [
                    r.report_reference,
                    r.crime_type,
                    r.reporter_name,
                    r.location,
                    r.status,
                    fmtDate(r.timestamp)
                ])
            };
        }
    },

    users: {
        reportTitle: "Registered Users Report",
        filenamePrefix: "Registered_Users",
        async build() {
            const users = await User.getAll();

            const roleCounts = users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {});

            return {
                summary: [
                    { label: "Total Users", value: users.length },
                    { label: "Residents", value: roleCounts.resident || 0 },
                    { label: "Admins", value: roleCounts.admin || 0 },
                    { label: "Super Admins", value: roleCounts.super_admin || 0 }
                ],
                columns: [
                    { label: "Name", key: "name" },
                    { label: "Username", key: "username" },
                    { label: "Email", key: "email" },
                    { label: "Contact", key: "contact" },
                    { label: "Role", key: "role" },
                    { label: "Status", key: "status" },
                    { label: "Date Registered", key: "date" }
                ],
                rows: users.map((u) => [
                    u.full_name,
                    u.username,
                    u.email_address,
                    u.contact_number,
                    u.role,
                    u.status,
                    fmtDate(u.created_at)
                ])
            };
        }
    },

    signinLogs: {
        reportTitle: "Sign-In Logs Report",
        filenamePrefix: "SignIn_Logs",
        async build() {
            const logs = await Log.getSigninLogs();
            const success = logs.filter((l) => l.status === "Success").length;

            return {
                summary: [
                    { label: "Total Attempts", value: logs.length },
                    { label: "Successful", value: success },
                    { label: "Failed", value: logs.length - success }
                ],
                columns: [
                    { label: "Name", key: "name" },
                    { label: "Email", key: "email" },
                    { label: "Status", key: "status" },
                    { label: "Timestamp", key: "date" }
                ],
                rows: logs.map((l) => [
                    l.full_name,
                    l.email_address,
                    l.status,
                    fmtDate(l.timestamp)
                ])
            };
        }
    },

    adminLogs: {
        reportTitle: "Admin Activity Report",
        filenamePrefix: "Admin_Activity",
        async build(filters = {}) {
            let logs = await AdminActivity.getRecent(5000);

            if (filters.admin) {
                logs = logs.filter((l) => l.admin_email === filters.admin);
            }
            if (filters.search) {
                const q = String(filters.search).toLowerCase();
                logs = logs.filter((l) =>
                    [l.admin_email, l.admin_username, l.action, l.details]
                        .some((v) => String(v || "").toLowerCase().includes(q))
                );
            }

            const admins = new Set(logs.map((l) => l.admin_email)).size;

            return {
                summary: [
                    { label: "Total Actions", value: logs.length },
                    { label: "Admins", value: admins }
                ],
                columns: [
                    { label: "Admin", key: "admin" },
                    { label: "Email", key: "email" },
                    { label: "Action", key: "action" },
                    { label: "Details", key: "details" },
                    { label: "Time", key: "date" }
                ],
                rows: logs.map((l) => [
                    l.admin_username || "",
                    l.admin_email,
                    l.action,
                    l.details || "",
                    fmtDate(l.created_at)
                ])
            };
        }
    }
};

class ExportService {

    static get validTypes() {
        return Object.keys(EXPORTERS);
    }

    static async exportPDF(type, filters, res) {
        const exporter = EXPORTERS[type];
        if (!exporter) throw new Error(`Unknown export type: ${type}`);

        const { summary, columns, rows } = await exporter.build(filters);

        PDFService.generateTableReport(
            {
                reportTitle: exporter.reportTitle,
                filenamePrefix: exporter.filenamePrefix,
                summary,
                columns,
                rows
            },
            res
        );
    }

    static async exportExcel(type, filters, res) {
        const exporter = EXPORTERS[type];
        if (!exporter) throw new Error(`Unknown export type: ${type}`);

        const { summary, columns, rows } = await exporter.build(filters);

        await ExcelService.generateTableReport(
            {
                reportTitle: exporter.reportTitle,
                filenamePrefix: exporter.filenamePrefix,
                summary,
                columns,
                rows
            },
            res
        );
    }
}

module.exports = ExportService;
