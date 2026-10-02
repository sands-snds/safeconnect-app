import React, { useEffect, useState } from "react";
import { showPopup } from "../../../shared/popup";

import { fetchArchiveSettings, updateArchiveSettings } from "../../../../Services/api";

const PERIOD_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 6, label: "After 6 months" },
  { value: 12, label: "After 1 year" }
];

const periodLabel = (months) =>
  PERIOD_OPTIONS.find((o) => o.value === months)?.label || "";

// Sits above each report list: switches between active and archived
// reports, and shows the auto-archive period for resolved reports (super
// admins can change it). onSettingsChanged is called after the period is
// saved, since a shorter period may archive reports right away.
const ArchiveToolbar = ({
  showArchived,
  setShowArchived,
  activeCount,
  archivedCount,
  isSuperAdmin,
  onSettingsChanged
}) => {
  const [months, setMonths] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArchiveSettings().then(setMonths).catch(() => {});
  }, []);

  const handlePeriodChange = async (e) => {
    const next = Number(e.target.value);
    const previous = months;
    setMonths(next);
    setIsSaving(true);
    try {
      const result = await updateArchiveSettings(next);
      if (!result?.success) {
        setMonths(previous);
        showPopup({ type: "error", title: "Couldn't Save Setting", message: result?.message || "Failed to update the auto-archive setting." });
        return;
      }
      if (result.archived > 0) onSettingsChanged && onSettingsChanged();
    } finally {
      setIsSaving(false);
    }
  };

  const tabStyle = (active) => ({
    padding: "6px 14px",
    border: "none",
    borderRadius: 6,
    background: active ? "#fff" : "transparent",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
    color: active ? "#111827" : "#6b7280",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer"
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16
      }}
    >
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "#f3f4f6", borderRadius: 8 }}>
        <button type="button" style={tabStyle(!showArchived)} onClick={() => setShowArchived(false)}>
          Active ({activeCount})
        </button>
        <button type="button" style={tabStyle(showArchived)} onClick={() => setShowArchived(true)}>
          Archived ({archivedCount})
        </button>
      </div>

      {months !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
          <span>Auto-archive resolved reports:</span>
          {isSuperAdmin ? (
            <select
              className="form-select"
              value={months}
              onChange={handlePeriodChange}
              disabled={isSaving}
              style={{ width: "auto" }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <strong>{periodLabel(months)}</strong>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchiveToolbar;
