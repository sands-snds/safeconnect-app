import React from "react";
import { tx } from "../../../i18n/adminText";

const ReportCard = ({
  accentColor = "#d1d5db",
  title,

  badge,

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
            {tag}

            {badge && (
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: badge.bg,
                  color: badge.color,
                  fontWeight: 600,
                  whiteSpace: "nowrap"
                }}
              >
                {tx(badge.text)}
              </span>
            )}
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
          className="report-card-toggle button button-primary"
          onClick={onToggle}
          aria-expanded={!!expanded}
          style={{
            padding: "6px 12px",
            fontSize: 12.5,
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
        >
          {expanded ? tx("Hide details") : tx("View details")}
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
