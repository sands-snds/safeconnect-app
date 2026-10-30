import React, { useEffect, useState } from "react";
import { showPopup } from "../../../shared/popup";

import { fetchArchiveSettings, updateArchiveSettings } from "../../../../Services/api";

// Report tabs: months after a report is resolved.
const REPORT_PERIOD_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 6, label: "After 6 months" },
  { value: 12, label: "After 1 year" }
];

// Sits above a list with an archive: switches between the current and
// archived entries, and shows the auto-archive period (Admins can change
// it). onSettingsChanged is called after the period is saved, since a
// shorter period may archive entries right away.
//
// Defaults to the report tabs' setting. The System logs pass their own:
//   loadSetting()        -> Promise<value | null>
//   saveSetting(value)   -> Promise<{ success, archived?, message? }>
//   periodOptions        -> [{ value, label }]
//   settingLabel         -> e.g. "Auto-archive sign-ins:"
// Counts can be null (not loaded yet) to hide the number.
const ArchiveToolbar = ({
  showArchived,
  setShowArchived,
  activeCount,
  archivedCount,
  isSuperAdmin,
  onSettingsChanged,
  loadSetting = fetchArchiveSettings,
  saveSetting = updateArchiveSettings,
  periodOptions = REPORT_PERIOD_OPTIONS,
  settingLabel = "Auto-archive resolved reports:",
  activeLabel = "Active",
  archivedLabel = "Archived"
}) => {
  const [period, setPeriod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSetting().then(setPeriod).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodLabel = (value) => periodOptions.find((o) => o.value === value)?.label || "";

  const handlePeriodChange = async (e) => {
    const next = Number(e.target.value);
    const previous = period;
    setPeriod(next);
    setIsSaving(true);
    try {
      const result = await saveSetting(next);
      if (!result?.success) {
        setPeriod(previous);
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

  const count = (n) => (n === null || n === undefined ? "" : ` (${n})`);

  return (
    // archive-toolbar*: phone layout in styles/admin.css (tabs full width,
    // the auto-archive setting on its own line).
    <div
      className="archive-toolbar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16
      }}
    >
      <div className="archive-toolbar-tabs" style={{ display: "inline-flex", gap: 4, padding: 4, background: "#f3f4f6", borderRadius: 8 }}>
        <button type="button" style={tabStyle(!showArchived)} onClick={() => setShowArchived(false)}>
          {activeLabel}{count(activeCount)}
        </button>
        <button type="button" style={tabStyle(showArchived)} onClick={() => setShowArchived(true)}>
          {archivedLabel}{count(archivedCount)}
        </button>
      </div>

      {period !== null && (
        <div className="archive-toolbar-setting" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
          <span style={{ whiteSpace: "nowrap" }}>{settingLabel}</span>
          {isSuperAdmin ? (
            <select
              className="form-select"
              value={period}
              onChange={handlePeriodChange}
              disabled={isSaving}
              style={{ width: "auto", minWidth: 150 }}
            >
              {periodOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <strong>{periodLabel(period)}</strong>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchiveToolbar;
