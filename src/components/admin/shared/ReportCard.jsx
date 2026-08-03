import React from "react";

// Shared collapsed/expandable report card used by all three report tables
// (emergency, assistance, petty crime). Collapsed: a short horizontal
// summary row. Expanded: grows to show the full detail view underneath.
const ReportCard = ({
  accentColor = "#d1d5db",
  title,
  badge,
  subtitle,
  statusControl,
  expanded,
  onToggle,
  children
}) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px"
        }}
      >
        <div
          style={{
            width: 6,
            alignSelf: "stretch",
            borderRadius: 4,
            background: accentColor,
            flexShrink: 0
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
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
          </div>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {statusControl}

          <button
            type="button"
            onClick={onToggle}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 500,
              whiteSpace: "nowrap"
            }}
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div
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
