import React, { useState } from "react";
import StatusConfirmModal from "./StatusConfirmModal";

const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

const STATUS_COLORS = {
  "Received": { bg: "#fef3c7", text: "#92400e" },
  "In Progress": { bg: "#dbeafe", text: "#1e40af" },
  "Resolved": { bg: "#dcfce7", text: "#166534" }
};

// Forward-only status control. Instead of a free dropdown (which let admins
// jump to any status, including backward), this shows the current status as
// a badge plus a single button to advance to the next step -- so an invalid
// transition simply isn't an available action, and there's no cramped
// <select> with cut-off text.
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

  const confirmAdvance = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(reportId, pendingNext, reportType);
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
          onClick={() => setPendingNext(nextStatus)}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Move to {nextStatus} →
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
