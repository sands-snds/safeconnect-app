import React, { useEffect, useState } from "react";

// Shared confirmation dialog for report status changes (emergency,
// assistance, petty crime). Also shows the canned reply that will be sent
// to the reporter, if any, so the admin knows what the resident will see.
// Rejecting asks for a reason, which is sent to the reporter
// (backend/utils/statusWorkflow.js: validateRejectionReason, rejectionMessage).
const STATUS_REPLY_PREVIEW = {
    "In Progress": "Help is on the way. Our responders have received your report and are on their way.",
    "Resolved": "Your report has been marked as resolved. Thank you for helping keep our community safe."
};

const REASON_MIN = 5;
const REASON_MAX = 500;

const rejectionPreview = (reason) =>
    `Your report was not accepted by the barangay. Reason: ${reason || "…"} If you think this is a mistake, please contact the barangay.`;

const StatusConfirmModal = ({ show, fromStatus, toStatus, onConfirm, onCancel, isSubmitting }) => {
    const [reason, setReason] = useState("");
    const isReject = toStatus === "Rejected";

    // Start each rejection with an empty reason.
    useEffect(() => {
        if (show) setReason("");
    }, [show, toStatus]);

    if (!show) return null;

    const trimmed = reason.trim();
    const replyPreview = isReject ? rejectionPreview(trimmed) : STATUS_REPLY_PREVIEW[toStatus];
    const canConfirm = !isSubmitting && (!isReject || trimmed.length >= REASON_MIN);

    return (
        <div
            onClick={onCancel}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "24px",
                    width: isReject ? 440 : 380,
                    maxWidth: "90vw"
                }}
            >
                <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>
                    {isReject ? "Reject this report?" : `Change status to "${toStatus}"?`}
                </h3>

                <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#4b5563" }}>
                    {isReject ? (
                        <>Use this for repeat reports, pranks or false accusations, instead of suspending the account. The report is closed as <strong>Rejected</strong>. This can't be undone.</>
                    ) : (
                        <>This will move the report from <strong>{fromStatus}</strong> to <strong>{toStatus}</strong>. This can't be undone.</>
                    )}
                </p>

                {isReject && (
                    <div style={{ marginBottom: 14 }}>
                        <label htmlFor="reject-reason" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                            Reason (sent to the reporter)
                        </label>
                        <textarea
                            id="reject-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                            rows={3}
                            autoFocus
                            placeholder="e.g. This incident was already reported (SC-2026-000021)."
                            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#6b7280", marginTop: 4 }}>
                            <span>{trimmed.length < REASON_MIN ? `At least ${REASON_MIN} characters.` : " "}</span>
                            <span>{reason.length}/{REASON_MAX}</span>
                        </div>
                    </div>
                )}

                {replyPreview && (
                    <div
                        style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "10px 12px",
                            marginBottom: 18,
                            fontSize: 12.5,
                            color: "#374151"
                        }}
                    >
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "#6b7280", fontSize: 11 }}>
                            The reporter will automatically receive:
                        </div>
                        "{replyPreview}"
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="button button-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(isReject ? trimmed : undefined)}
                        disabled={!canConfirm}
                        className="button button-primary"
                        style={{ opacity: canConfirm ? 1 : 0.6 }}
                    >
                        {isSubmitting ? "Updating…" : isReject ? "Reject Report" : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusConfirmModal;
