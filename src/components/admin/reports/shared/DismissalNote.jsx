import React from "react";
import { tx } from "../../../../i18n/adminText";

const DismissalNote = ({ report }) => {
  if (report.status !== "Dismissed") return null;

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
        <div style={{ fontWeight: 700 }}>{tx("This report was dismissed")}</div>
        <div style={{ color: "#7f1d1d", marginTop: 2, whiteSpace: "pre-wrap" }}>
          {report.dismissalReason || "No reason was recorded."}
        </div>
      </div>
    </div>
  );
};

export default DismissalNote;
