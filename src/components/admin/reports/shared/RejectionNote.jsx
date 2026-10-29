import React from "react";

// Shown at the top of a rejected report's details: why it was rejected
// (the same reason the reporter was sent).
const RejectionNote = ({ report }) => {
  if (report.status !== "Rejected") return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 16,
        fontSize: 13
      }}
    >
      <i className="bi bi-x-circle-fill" aria-hidden="true" style={{ marginTop: 1 }} />
      <div>
        <div style={{ fontWeight: 700 }}>This report was rejected</div>
        <div style={{ color: "#7f1d1d", marginTop: 2, whiteSpace: "pre-wrap" }}>
          {report.rejectionReason || "No reason was recorded."}
        </div>
      </div>
    </div>
  );
};

export default RejectionNote;
