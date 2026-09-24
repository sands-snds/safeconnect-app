import React from "react";

import StatusBadge from "../shared/StatusBadge";
import { timeAgo } from "../shared/timeUtils";

const LIMIT = 6;

const TYPES = {
    emergency:  { label: "Emergency",   icon: "bi-exclamation-triangle-fill", color: "#dc2626", bg: "#fee2e2", view: "emergency-reports" },
    assistance: { label: "Assistance",  icon: "bi-life-preserver",            color: "#6B2C3E", bg: "#FDECEC", view: "assistance-requests" },
    pettyCrime: { label: "Petty Crime", icon: "bi-shield-exclamation",        color: "#b45309", bg: "#fef3c7", view: "petty-crime-reports" }
};

// Newest first across all three report types (the old version just took the
// first 5 of emergency + assistance + petty crime without sorting, so it
// was mostly showing emergency reports, not the most recent ones).
const buildRecent = (emergencyReports, assistanceRequests, pettyCrimeReports) =>
    [
        ...emergencyReports.map(r => ({
            key: `e-${r.id}`, type: "emergency", title: r.emergency,
            reporter: r.reporter, location: r.location, report: r
        })),
        ...assistanceRequests.map(r => ({
            key: `a-${r.id}`, type: "assistance", title: r.assistanceType,
            reporter: r.requester, location: r.location, report: r
        })),
        ...pettyCrimeReports.map(r => ({
            key: `p-${r.id}`, type: "pettyCrime", title: r.crimeType,
            reporter: r.reporter, location: r.location, report: r
        }))
    ]
        .filter(item => item.report.rawDate)
        .sort((a, b) => new Date(b.report.rawDate) - new Date(a.report.rawDate))
        .slice(0, LIMIT);

export default function DashboardRecentReports({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = [],
    onNavigate
}) {
    const reports = buildRecent(emergencyReports, assistanceRequests, pettyCrimeReports);

    return (
        <div
            style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                marginTop: 24,
                overflow: "hidden"
            }}
        >
            <style>{`
                .recent-report-row { transition: background .15s; }
                .recent-report-row:hover { background: #f9fafb; }
                @media (max-width: 640px) {
                    .recent-report-meta { display: none; }
                }
            `}</style>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 22px",
                    borderBottom: "1px solid #f3f4f6"
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>
                        Recent Reports
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6b7280" }}>
                        Latest {LIMIT} submissions across all report types
                    </p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div style={{ padding: "36px 22px", textAlign: "center", color: "#6b7280", fontSize: 14 }}>
                    <i className="bi bi-inbox" style={{ fontSize: 36, display: "block", marginBottom: 8, opacity: 0.5 }} />
                    No reports yet.
                </div>
            ) : (
                reports.map(item => {
                    const type = TYPES[item.type];
                    const r = item.report;
                    const forOthers = r.reportFor === "others";

                    return (
                        <div
                            key={item.key}
                            className="recent-report-row"
                            role="button"
                            tabIndex={0}
                            onClick={() => onNavigate?.(type.view)}
                            onKeyDown={(e) => e.key === "Enter" && onNavigate?.(type.view)}
                            title={`Open ${type.label} reports`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                padding: "14px 22px",
                                borderBottom: "1px solid #f3f4f6",
                                cursor: onNavigate ? "pointer" : "default"
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: type.bg,
                                    color: type.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    flexShrink: 0
                                }}
                            >
                                <i className={`bi ${type.icon}`} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                                        {item.title || type.label}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: type.color }}>
                                        {type.label}
                                    </span>
                                    {r.reference && (
                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{r.reference}</span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: "#6b7280",
                                        marginTop: 2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {item.reporter || "Unknown"}
                                    {forOthers && (
                                        <span style={{ color: "#5b21b6", fontWeight: 500 }}>
                                            {" "}for {r.victimName || "someone else"}
                                        </span>
                                    )}
                                    {item.location && <> · {item.location}</>}
                                </div>
                            </div>

                            <div
                                className="recent-report-meta"
                                style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}
                                title={r.date}
                            >
                                {timeAgo(r.rawDate)}
                            </div>

                            <div style={{ flexShrink: 0 }}>
                                <StatusBadge status={r.status} />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
