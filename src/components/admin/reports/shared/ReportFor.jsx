import React from "react";

import DetailField from "../../shared/DetailField";

// Residents can file a report / request help on behalf of someone else
// (report_for = "others" + victim_name/contact/relationship). These pieces
// surface that on the admin side, shared by all three report types.

export const isForOthers = (report) => report?.reportFor === "others";

const relationshipText = (report) =>
    report.victimRelationship ? ` (${report.victimRelationship})` : "";

// Small pill for the collapsed report card.
export const ReportForTag = ({ report }) => {
    if (!isForOthers(report)) return null;

    return (
        <span
            title="Filed on behalf of someone else"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                background: "#ede9fe",
                color: "#5b21b6",
                fontWeight: 600,
                whiteSpace: "nowrap"
            }}
        >
            <i className="bi bi-people-fill" />
            For {report.victimName || "someone else"}{relationshipText(report)}
        </span>
    );
};

// Block at the top of the expanded details. personLabel is what the other
// person is called for this report type ("Person Affected", "Victim", ...).
export const ReportForDetails = ({ report, personLabel = "Person Affected" }) => {
    if (!isForOthers(report)) return null;

    return (
        <div
            style={{
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#5b21b6",
                    marginBottom: 8
                }}
            >
                <i className="bi bi-people-fill" />
                Filed on behalf of someone else
            </div>

            <DetailField label={personLabel} value={report.victimName} />
            <DetailField label="Their Contact" value={report.victimContact || "Not provided"} />
            <DetailField label="Relationship" value={report.victimRelationship} />
        </div>
    );
};

export const REPORT_FOR_OPTIONS = [
    { value: "all", label: "Everyone" },
    { value: "self", label: "Themselves" },
    { value: "others", label: "Someone else" }
];

// "Filed for" filter, passed to ListView as extraFilters.
export const ReportForFilter = ({ filterType, filters, setFilters }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label className="font-medium text-sm">Filed for</label>
        <select
            value={filters[filterType]?.reportFor || "all"}
            onChange={(e) => setFilters(prev => ({
                ...prev,
                [filterType]: { ...prev[filterType], reportFor: e.target.value }
            }))}
            className="form-select"
        >
            {REPORT_FOR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);
