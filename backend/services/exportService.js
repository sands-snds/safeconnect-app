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

// Analytical report chart colors: the report types' colors (resident page)
// and the status colors (admin status badges).
const ANALYTICS_COLORS = { emergency: "#dc2626", assistance: "#ea580c", pettyCrime: "#7c3aed" };
const STATUS_PIE_COLORS = { Received: "#f59e0b", "In Progress": "#3b82f6", Resolved: "#16a34a", Dismissed: "#9ca3af" };

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
// (see backend/utils/statusWorkflow.js): Received -> In Progress -> Resolved,
// or Dismissed.
const REPORT_STATUSES = ["Received", "In Progress", "Resolved", "Dismissed"];

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

// Philippine time: the Azure server runs in UTC, which put every exported
// time 8 hours behind.
const REPORT_TIMEZONE = "Asia/Manila";
const fmtDate = (value) =>
    (value ? new Date(value).toLocaleString("en-PH", { timeZone: REPORT_TIMEZONE }) : "");

const { ALL_ROLES, roleLabel } = require("../utils/roles");

const USER_STATUSES = ["Active", "Pending", "Suspended", "Closed"];
const SIGNIN_STATUSES = ["Success", "Failed"];

const isDayKey = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

// Options from the report tabs' Generate Report form:
//   status   - one of REPORT_STATUSES, or empty for all
//   from, to - YYYY-MM-DD (inclusive), in the admin's timezone
//   tzOffset - the browser's getTimezoneOffset(), see localDayKey
// Returns model filters ({ status, from, to } with Date bounds) plus a
// human-readable description for the report's subtitle.
const dateRange = (filters = {}) => {
    const tzOffset = Number.isFinite(Number(filters.tzOffset)) ? Number(filters.tzOffset) : -480;
    const localMidnight = (key) => new Date(new Date(`${key}T00:00:00Z`).getTime() + tzOffset * 60000);

    const from = isDayKey(filters.from) ? localMidnight(filters.from) : null;
    let to = null;
    if (isDayKey(filters.to)) {
        to = localMidnight(filters.to);
        to.setUTCDate(to.getUTCDate() + 1); // include the whole "to" day
    }

    const period = filters.from && filters.to && isDayKey(filters.from) && isDayKey(filters.to)
        ? `${dayKeyLabel(filters.from)} - ${dayKeyLabel(filters.to)}`
        : isDayKey(filters.from) ? `From ${dayKeyLabel(filters.from)}`
        : isDayKey(filters.to) ? `Until ${dayKeyLabel(filters.to)}`
        : "All dates";

    return { from, to, period };
};

const reportOptions = (filters = {}) => {
    const status = REPORT_STATUSES.includes(filters.status) ? filters.status : null;
    const { from, to, period } = dateRange(filters);
    return {
        modelFilters: { status, from, to },
        subtitle: `Status: ${status || "All"}  |  Period: ${period}`
    };
};

// Options from the System tabs' Generate Report form (Users, Sign-in Logs,
// Admin Logs): role, status (checked against `statuses`), from / to and
// archived (the tab the report was generated from).
const systemOptions = (filters = {}, statuses, { allowUnknownRole = false } = {}) => {
    const role = ALL_ROLES.includes(filters.role) || (allowUnknownRole && filters.role === "unknown")
        ? filters.role
        : null;
    const status = statuses.includes(filters.status) ? filters.status : null;
    const archived = filters.archived === "1" || filters.archived === "true";
    const { from, to, period } = dateRange(filters);

    const parts = [`Role: ${role ? (role === "unknown" ? "No account" : roleLabel(role)) : "All"}`];
    if (statuses.length) parts.push(`Status: ${status || "All"}`);
    parts.push(`Period: ${period}`);
    if (archived) parts.push("Archived entries");

    return { role, status, from, to, archived, subtitle: parts.join("  |  ") };
};

// Each entry describes how to build one exportable dataset: a human title,
// a PDF-friendly filename prefix, and a build(filters) function returning
// { summary, columns, rows } consumed by PDFService/ExcelService.
const EXPORTERS = {

    // Dashboard "Reports Over Time" chart: one row per day in the range.
    // filters: days (7/15/30/90), tzOffset (see localDayKey)
    reportsOverTime: {
        reportTitle: "Reports Over Time",
        filenamePrefix: "Reports_Over_Time",
        fileTitle: "SafeConnect-SantaFe Analytical Report",
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
        fileTitle: "SafeConnect-SantaFe Analytical Report",
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

    // Dashboard Generate Report: the bar graph (reports per day, or per
    // month for long periods) and / or the pie chart (reports by status),
    // each with its table and a Total row. filters: from / to (empty = all
    // time), tzOffset, bar / pie ("0" leaves that part out), status (pie only).
    analytics: {
        reportTitle: "Analytical Report",
        filenamePrefix: "Analytical_Report",
        fileTitle: "SafeConnect-SantaFe Analytical Report",
        async build(filters = {}) {
            const tzOffset = Number.isFinite(Number(filters.tzOffset)) ? Number(filters.tzOffset) : -480;
            const includeBar = filters.bar !== "0";
            const includePie = filters.pie !== "0";
            const status = REPORT_STATUSES.includes(filters.status) ? filters.status : null;
            const { from, to, period } = dateRange(filters);

            // Every report's category, status and local day in the period.
            const reports = [];
            for (const { key, table, dateColumn } of REPORT_TABLES) {
                let sql = `SELECT ${dateColumn} AS reported_at, status FROM ${table} WHERE 1=1`;
                const values = [];
                if (from) { sql += ` AND ${dateColumn} >= ?`; values.push(from); }
                if (to) { sql += ` AND ${dateColumn} < ?`; values.push(to); }
                const [rows] = await db.query(sql, values);
                rows.forEach((r) => r.reported_at && reports.push({
                    key, status: r.status, day: localDayKey(new Date(r.reported_at), tzOffset)
                }));
            }

            const sections = [];
            const summary = [{ label: "Period", value: period === "All dates" ? "All time" : period }];

            if (includeBar) {
                // Days from the start of the period (or the first report) to its end (or today).
                const todayKey = localDayKey(new Date(), tzOffset);
                const firstKey = isDayKey(filters.from) ? filters.from
                    : (reports.map((r) => r.day).sort()[0] || todayKey);
                const lastKey = isDayKey(filters.to) ? filters.to : todayKey;
                const days = [];
                for (let d = new Date(`${firstKey}T00:00:00Z`); d.toISOString().slice(0, 10) <= lastKey; d.setUTCDate(d.getUTCDate() + 1)) {
                    days.push(d.toISOString().slice(0, 10));
                }
                // More than ~3 months of days would be unreadable: group by month.
                const byMonth = days.length > 92;
                const bucketOf = (day) => (byMonth ? day.slice(0, 7) : day);
                const bucketKeys = [...new Set(days.map(bucketOf))];
                const buckets = Object.fromEntries(bucketKeys.map((k) => [k, { emergency: 0, assistance: 0, pettyCrime: 0 }]));
                reports.forEach((r) => { const b = buckets[bucketOf(r.day)]; if (b) b[r.key]++; });
                const label = (k) => (byMonth
                    ? new Date(`${k}-01T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", year: "numeric" })
                    : dayKeyLabel(k));

                const totals = { emergency: 0, assistance: 0, pettyCrime: 0 };
                const rows = bucketKeys.map((k) => {
                    const b = buckets[k];
                    REPORT_TABLES.forEach(({ key }) => { totals[key] += b[key]; });
                    return [label(k), b.emergency, b.assistance, b.pettyCrime, b.emergency + b.assistance + b.pettyCrime];
                });
                const grand = totals.emergency + totals.assistance + totals.pettyCrime;
                rows.push(["Total", totals.emergency, totals.assistance, totals.pettyCrime, grand]);
                summary.push({ label: "Total Reports", value: grand });

                sections.push({
                    title: `Reports Over Time (${byMonth ? "per month" : "per day"})`,
                    chart: {
                        type: "bar",
                        labels: bucketKeys.map(label),
                        series: REPORT_TABLES.map(({ key, label: name }) => ({
                            label: name, color: ANALYTICS_COLORS[key], values: bucketKeys.map((k) => buckets[k][key])
                        }))
                    },
                    columns: [
                        { label: byMonth ? "Month" : "Date", key: "date" },
                        ...REPORT_TABLES.map(({ key, label: name }) => ({ label: name, key })),
                        { label: "Total", key: "total" }
                    ],
                    rows,
                    totalRow: true
                });
            }

            if (includePie) {
                const statuses = status ? [status] : REPORT_STATUSES;
                const counted = status ? reports.filter((r) => r.status === status) : reports;
                const statusTotals = Object.fromEntries(statuses.map((s) => [s, 0]));
                const rows = REPORT_TABLES.map(({ key, label: name }) => {
                    const mine = counted.filter((r) => r.key === key);
                    const byStatus = statuses.map((s) => mine.filter((r) => r.status === s).length);
                    statuses.forEach((s, i) => { statusTotals[s] += byStatus[i]; });
                    return [name, ...byStatus, byStatus.reduce((a, b) => a + b, 0)];
                });
                const grand = Object.values(statusTotals).reduce((a, b) => a + b, 0);
                rows.push(["Total", ...statuses.map((s) => statusTotals[s]), grand]);
                if (!includeBar) summary.push({ label: "Total Reports", value: grand });
                if (status) summary.push({ label: "Reports included (pie chart)", value: status });

                sections.push({
                    title: status ? `${status} Reports by Category` : "Reports by Status",
                    // All statuses: the share of each status. One status: the share of each category.
                    chart: {
                        type: "pie",
                        slices: status
                            ? REPORT_TABLES.map(({ key, label: name }, i) => ({ label: name, value: rows[i][rows[i].length - 1], color: ANALYTICS_COLORS[key] }))
                            : REPORT_STATUSES.map((s) => ({ label: s, value: statusTotals[s], color: STATUS_PIE_COLORS[s] }))
                    },
                    columns: [
                        { label: "Category", key: "category" },
                        ...statuses.map((s) => ({ label: s, key: s })),
                        { label: "Total", key: "total" }
                    ],
                    rows,
                    totalRow: true
                });
            }

            return {
                subtitle: `Period: ${period === "All dates" ? "All time" : period}`,
                period,
                summary,
                sections
            };
        }
    },

    emergency: {
        reportTitle: "Emergency Incident Report",
        filenamePrefix: "Emergency_Reports",
        fileTitle: "SafeConnect-SantaFe Emergency Reports",
        async build(filters) {
            const { modelFilters, subtitle } = reportOptions(filters);
            const reports = await Report.findAll(modelFilters);
            const counts = countByStatus(reports);
            return {
                subtitle,
                summary: summaryFromCounts(reports.length, counts),
                columns: [
                    { label: "Reference", key: "reference", weight: 1.2 },
                    { label: "Type", key: "type", weight: 1.2 },
                    { label: "Severity", key: "severity", weight: 0.8 },
                    { label: "Reporter", key: "reporter", weight: 1.2 },
                    { label: "Location", key: "location", weight: 2.6 },
                    { label: "Status", key: "status", weight: 0.9 },
                    { label: "Date", key: "date", weight: 1.3 }
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
        fileTitle: "SafeConnect-SantaFe Assistance Requests",
        async build(filters) {
            const { modelFilters, subtitle } = reportOptions(filters);
            const requests = await AssistanceRequest.findAll(modelFilters);
            const counts = countByStatus(requests);
            return {
                subtitle,
                summary: summaryFromCounts(requests.length, counts, "Requests"),
                columns: [
                    { label: "Reference", key: "reference", weight: 1.2 },
                    { label: "Type", key: "type", weight: 1.2 },
                    { label: "Requester", key: "requester", weight: 1.2 },
                    { label: "People", key: "people", weight: 0.6 },
                    { label: "Location", key: "location", weight: 2.4 },
                    { label: "Urgency", key: "urgency", weight: 0.8 },
                    { label: "Status", key: "status", weight: 0.9 },
                    { label: "Date", key: "date", weight: 1.3 }
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
        fileTitle: "SafeConnect-SantaFe Petty Crime Reports",
        async build(filters) {
            const { modelFilters, subtitle } = reportOptions(filters);
            const reports = await PettyCrime.findAll(modelFilters);
            const counts = countByStatus(reports);
            return {
                subtitle,
                summary: summaryFromCounts(reports.length, counts),
                columns: [
                    { label: "Reference", key: "reference", weight: 1.2 },
                    { label: "Crime Type", key: "type", weight: 1.2 },
                    { label: "Reporter", key: "reporter", weight: 1.2 },
                    { label: "Location", key: "location", weight: 2.6 },
                    { label: "Status", key: "status", weight: 0.9 },
                    { label: "Date", key: "date", weight: 1.3 }
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

    // System > Users. filters: role, status, from / to (date registered).
    users: {
        reportTitle: "Registered Users Report",
        filenamePrefix: "Registered_Users",
        fileTitle: "SafeConnect-SantaFe Registered Users",
        async build(filters = {}) {
            const { role, status, from, to, subtitle } = systemOptions(filters, USER_STATUSES);
            let users = await User.getAll();
            if (role) users = users.filter((u) => u.role === role);
            if (status) users = users.filter((u) => u.status === status);
            if (from) users = users.filter((u) => new Date(u.created_at) >= from);
            if (to) users = users.filter((u) => new Date(u.created_at) < to);

            const roleCounts = users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {});

            return {
                subtitle,
                summary: [
                    { label: "Total Users", value: users.length },
                    { label: "Residents", value: roleCounts.resident || 0 },
                    { label: "Officials", value: roleCounts.admin || 0 },
                    { label: "Admins", value: roleCounts.super_admin || 0 }
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
                    roleLabel(u.role),
                    u.status,
                    fmtDate(u.created_at)
                ])
            };
        }
    },

    // System > Sign-in Logs. filters: archived, role ("unknown" = no
    // account), status (Success / Failed), from / to.
    signinLogs: {
        reportTitle: "Resident Logs Report",
        filenamePrefix: "SignIn_Logs",
        fileTitle: "SafeConnect-SantaFe Resident Logs",
        async build(filters = {}) {
            const { role, status, from, to, archived, subtitle } = systemOptions(filters, SIGNIN_STATUSES, { allowUnknownRole: true });
            const logs = await Log.getSigninLogs({ archived, role, status, from, to, residentsOnly: true });
            const success = logs.filter((l) => l.status === "Success").length;

            return {
                subtitle,
                summary: [
                    { label: "Total Attempts", value: logs.length },
                    { label: "Successful", value: success },
                    { label: "Failed", value: logs.length - success }
                ],
                columns: [
                    { label: "Name", key: "name" },
                    { label: "Email", key: "email", weight: 1.6 },
                    { label: "Role", key: "role", weight: 0.8 },
                    { label: "Device & IP Address", key: "device", weight: 2.2 },
                    { label: "Location", key: "location", weight: 1.5 },
                    { label: "Status", key: "status", weight: 0.7 },
                    { label: "Timestamp", key: "date", weight: 1.2 }
                ],
                rows: logs.map((l) => [
                    l.full_name,
                    l.email_address,
                    roleLabel(l.role),
                    `${l.device || "Device not tracked"}\n${l.ip_address || "IP not tracked"}`,
                    l.location || "",
                    l.status,
                    fmtDate(l.timestamp)
                ])
            };
        }
    },

    // System > Admin Logs. filters: archived, role (official / admin),
    // from / to, plus the tab's own admin (email) and search.
    adminLogs: {
        reportTitle: "Admin Activity Report",
        filenamePrefix: "Admin_Activity",
        fileTitle: "SafeConnect-SantaFe Admin Logs",
        async build(filters = {}) {
            const { role, from, to, archived, subtitle } = systemOptions(filters, []);
            let logs = await AdminActivity.getRecent(5000, { archived, role, from, to });

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

            const accounts = new Set(logs.map((l) => l.admin_email)).size;

            return {
                subtitle,
                summary: [
                    { label: "Total Actions", value: logs.length },
                    { label: "Accounts", value: accounts }
                ],
                columns: [
                    { label: "Name", key: "admin" },
                    { label: "Email", key: "email" },
                    { label: "Role", key: "role", weight: 0.7 },
                    { label: "Action", key: "action" },
                    { label: "Details", key: "details" },
                    { label: "Time", key: "date" }
                ],
                rows: logs.map((l) => [
                    l.admin_username || "",
                    l.admin_email,
                    roleLabel(l.role),
                    l.action,
                    l.details || "",
                    fmtDate(l.created_at)
                ])
            };
        }
    }
};

// "SafeConnect-SantaFe Emergency Reports_Oct 1, 2026 - Oct 31, 2026", or
// "..._All time". reportsOverTime counts back `days` from today.
const fileName = (exporter, filters = {}, built = {}) => {
    let period = built.period || dateRange(filters).period;
    if (exporter === EXPORTERS.reportsOverTime) {
        const days = RANGE_DAYS.includes(Number(filters.days)) ? Number(filters.days) : 30;
        period = `Last ${days} days`;
    }
    if (period === "All dates") period = "All time";
    // Characters Windows doesn't allow in file names.
    return `${exporter.fileTitle || exporter.reportTitle}_${period}`.replace(/[\\/:*?"<>|]/g, "-");
};

class ExportService {

    static get validTypes() {
        return Object.keys(EXPORTERS);
    }

    static async exportPDF(type, filters, res) {
        const exporter = EXPORTERS[type];
        if (!exporter) throw new Error(`Unknown export type: ${type}`);

        const built = await exporter.build(filters);
        const { subtitle, summary, columns, rows, sections } = built;

        await PDFService.generateTableReport(
            {
                reportTitle: exporter.reportTitle,
                filename: fileName(exporter, filters, built),
                subtitle,
                summary,
                columns,
                rows,
                sections
            },
            res
        );
    }

    static async exportExcel(type, filters, res) {
        const exporter = EXPORTERS[type];
        if (!exporter) throw new Error(`Unknown export type: ${type}`);

        const built = await exporter.build(filters);
        const { subtitle, summary, columns, rows, sections } = built;

        await ExcelService.generateTableReport(
            {
                reportTitle: exporter.reportTitle,
                filename: fileName(exporter, filters, built),
                subtitle,
                summary,
                columns,
                rows,
                sections
            },
            res
        );
    }
}

module.exports = ExportService;
