import React, { useState } from "react";
import StatusConfirmModal from "./StatusConfirmModal";

const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

const STATUS_COLORS = {
  "Received": { bg: "#fef3c7", text: "#92400e" },
  "In Progress": { bg: "#dbeafe", text: "#1e40af" },
  "Resolved": { bg: "#dcfce7", text: "#166534" },
  "Dismissed": { bg: "#fee2e2", text: "#991b1b" }
};

// Reports that are still open can also be dismissed (with a reason).
const CLOSED_STATUSES = ["Resolved", "Dismissed"];

// Forward-only status control. Instead of a free dropdown (which let admins
// jump to any status, including backward), this shows the current status as
// a badge plus a single button to advance to the next step -- so an invalid
// transition simply isn't an available action, and there's no cramped
// <select> with cut-off text. "Dismiss" closes an open report instead.
const StatusSelect = ({
  value,
  reportId,
  reportType,
  onUpdateStatus
}) => {
  const [pendingNext, setPendingNext] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = STATUS_ORDER.indexOf(value);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIndex + 1]
    : null;

  const colors = STATUS_COLORS[value] || { bg: "#f3f4f6", text: "#374151" };
  const canDismiss = !CLOSED_STATUSES.includes(value);

  // reason: from the confirm dialog, only when dismissing.
  const confirmAdvance = async (reason) => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(reportId, pendingNext, reportType, reason);
    } finally {
      setIsSubmitting(false);
      setPendingNext(null);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          background: colors.bg,
          color: colors.text,
          whiteSpace: "nowrap"
        }}
      >
        {value}
      </span>

      {nextStatus && (
        <button
          type="button"
          className="button button-soft"
          onClick={() => setPendingNext(nextStatus)}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            whiteSpace: "nowrap"
          }}
        >
          Move to {nextStatus} →
        </button>
      )}

      {canDismiss && (
        <button
          type="button"
          className="button button-soft"
          onClick={() => setPendingNext("Dismissed")}
          title="Dismiss a repeat, prank or false report"
          style={{
            fontSize: 12,
            padding: "4px 10px",
            whiteSpace: "nowrap"
          }}
        >
          <i className="bi bi-x-circle" aria-hidden="true" /> Dismiss
        </button>
      )}

      <StatusConfirmModal
        show={Boolean(pendingNext)}
        fromStatus={value}
        toStatus={pendingNext}
        isSubmitting={isSubmitting}
        onConfirm={confirmAdvance}
        onCancel={() => setPendingNext(null)}
      />
    </div>
  );
};

export default StatusSelect;
