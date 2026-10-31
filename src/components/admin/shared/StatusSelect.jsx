import React, { useState } from "react";
import StatusConfirmModal from "./StatusConfirmModal";
import { tx } from "../../../i18n/adminText";

const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

const STATUS_COLORS = {
  "Received": { bg: "#fef3c7", text: "#92400e" },
  "In Progress": { bg: "#dbeafe", text: "#1e40af" },
  "Resolved": { bg: "#dcfce7", text: "#166534" },
  "Dismissed": { bg: "#fee2e2", text: "#991b1b" }
};

export const statusBadge = (status) => {
  const colors = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
  return { text: status, bg: colors.bg, color: colors.text };
};

const NEXT_BUTTON_CLASS = {
  "In Progress": "button-status-progress",
  "Resolved": "button-status-resolved"
};

const CLOSED_STATUSES = ["Resolved", "Dismissed"];

const StatusSelect = ({
  value,
  reportId,
  reportType,
  onUpdateStatus,

  showBadge = true
}) => {
  const [pendingNext, setPendingNext] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = STATUS_ORDER.indexOf(value);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIndex + 1]
    : null;

  const colors = STATUS_COLORS[value] || { bg: "#f3f4f6", text: "#374151" };
  const canDismiss = !CLOSED_STATUSES.includes(value);

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
      {showBadge && (
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
          {tx(value)}
        </span>
      )}

      {nextStatus && (
        <button
          type="button"
          className={`button ${NEXT_BUTTON_CLASS[nextStatus] || "button-soft"}`}
          onClick={() => setPendingNext(nextStatus)}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            whiteSpace: "nowrap"
          }}
        >
          {tx("Move to {{status}} →", { status: tx(nextStatus) })}
        </button>
      )}

      {canDismiss && (
        <button
          type="button"
          className="button button-danger-soft"
          onClick={() => setPendingNext("Dismissed")}
          title={tx("Dismiss a repeat, prank or false report")}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            whiteSpace: "nowrap"
          }}
        >
          <i className="bi bi-x-circle" aria-hidden="true" /> {tx("Dismiss")}
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
