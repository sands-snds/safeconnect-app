import React from "react";

// Shared collapsed/expandable report card used by all three report tables
// (emergency, assistance, petty crime). Collapsed: a short horizontal
// summary row. Expanded: grows to show the full detail view underneath.
//
// On phones (report-card rules in styles/admin.css) the row wraps: title
// and "View details" on top, then the status control full width below,
// instead of squeezing everything into one line.
const ReportCard = ({
  accentColor = "#d1d5db",
  title,
  badge,
  // Optional extra element next to the badge (e.g. the "For <name>" pill).
  tag,
  subtitle,
  statusControl,
  expanded,
  onToggle,
  children
}) => {
  return (
    <div
      className="report-card"
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      <div
        className="report-card-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px"
        }}
      >
        <div
          className="report-card-accent"
          style={{
            width: 6,
            alignSelf: "stretch",
            borderRadius: 4,
            background: accentColor,
            flexShrink: 0
          }}
        />

        <div className="report-card-main" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {title}
            </span>
            {badge && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: badge.bg,
                  color: badge.color,
                  fontWeight: 600,
                  whiteSpace: "nowrap"
                }}
              >
                {badge.text}
              </span>
            )}
            {tag}
          </div>
          <div className="report-card-subtitle" style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>
            {subtitle}
          </div>
        </div>

        <div className="report-card-status" style={{ flexShrink: 0 }}>
          {statusControl}
        </div>

        <button
          type="button"
          className="report-card-toggle"
          onClick={onToggle}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          {expanded ? "Hide details" : "View details"}
        </button>
      </div>

      {expanded && (
        <div
          className="report-card-details"
          style={{
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
            padding: "18px"
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default ReportCard;
