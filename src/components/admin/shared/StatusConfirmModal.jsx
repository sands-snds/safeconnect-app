import React from "react";

// Shared confirmation dialog for report status changes (emergency,
// assistance, petty crime). Also shows the canned reply that will be sent
// to the reporter, if any, so the admin knows what the resident will see.
const STATUS_REPLY_PREVIEW = {
    "In Progress": "Help is on the way. Our responders have received your report and are on their way.",
    "Resolved": "Your report has been marked as resolved. Thank you for helping keep our community safe."
};

const StatusConfirmModal = ({ show, fromStatus, toStatus, onConfirm, onCancel, isSubmitting }) => {
    if (!show) return null;

    const replyPreview = STATUS_REPLY_PREVIEW[toStatus];

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
                    width: 380,
                    maxWidth: "90vw"
                }}
            >
                <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>
                    Change status to "{toStatus}"?
                </h3>

                <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#4b5563" }}>
                    This will move the report from <strong>{fromStatus}</strong> to <strong>{toStatus}</strong>. This can't be undone.
                </p>

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
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="button button-primary"
                    >
                        {isSubmitting ? "Updating…" : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusConfirmModal;
