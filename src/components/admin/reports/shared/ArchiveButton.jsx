import React, { useState } from "react";

// Archive / Restore button shown next to a report's status. Only Resolved
// reports can be archived; archived ones get a Restore button instead.
// onArchive(id, type, archived) -> { success, message } (useAdminData's
// setReportArchived).
const ArchiveButton = ({ report, reportType, onArchive }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isArchived = Boolean(report.archivedAt);
  if (!onArchive || (!isArchived && report.status !== "Resolved")) return null;

  const handleClick = async () => {
    setIsSubmitting(true);
    try {
      const result = await onArchive(report.id, reportType, !isArchived);
      if (!result?.success) {
        alert(result?.message || `Failed to ${isArchived ? "restore" : "archive"} report.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      title={isArchived ? "Move back to the active list" : "Move to the archive"}
      style={{
        padding: "4px 12px",
        borderRadius: 20,
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        cursor: isSubmitting ? "wait" : "pointer",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap"
      }}
    >
      {isSubmitting ? "Saving..." : isArchived ? "Restore" : "Archive"}
    </button>
  );
};

export default ArchiveButton;
