const Report = require("../models/Report");
const AssistanceRequest = require("../models/AssistanceRequest");
const PettyCrime = require("../models/PettyCrime");
const User = require("../models/User");
const Log = require("../models/Log");
const AdminActivity = require("../models/AdminActivity");

const PDFService = require("./pdfService");
const ExcelService = require("./excelService");

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
                    { label: "Admins", value: roleCounts.admin || 0 }
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
