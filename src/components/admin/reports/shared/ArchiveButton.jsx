import React, { useState } from "react";
import { showPopup } from "../../../shared/popup";
import { tx } from "../../../../i18n/adminText";

// Archive / Restore button shown next to a report's status. Only Resolved and
// Dismissed reports can be archived; archived ones get a Restore button instead.
// onArchive(id, type, archived) -> { success, message } (useAdminData's
// setReportArchived).
const ArchiveButton = ({ report, reportType, onArchive }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isArchived = Boolean(report.archivedAt);
  if (!onArchive || (!isArchived && !["Resolved", "Dismissed"].includes(report.status))) return null;

  const handleClick = async () => {
    setIsSubmitting(true);
    try {
      const result = await onArchive(report.id, reportType, !isArchived);
      if (!result?.success) {
        showPopup({ type: "error", title: `Couldn't ${isArchived ? "Restore" : "Archive"} Report`, message: result?.message || `Failed to ${isArchived ? "restore" : "archive"} report.` });
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
      className="button button-soft"
      style={{
        padding: "4px 12px",
        cursor: isSubmitting ? "wait" : "pointer",
        fontSize: 12,
        whiteSpace: "nowrap"
      }}
    >
      {isSubmitting ? tx("Saving…") : isArchived ? tx("Restore") : tx("Archive")}
    </button>
  );
};

export default ArchiveButton;
