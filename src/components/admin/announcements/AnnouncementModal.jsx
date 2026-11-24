import React from "react";
import CreateAnnouncementView from "./CreateAnnouncementView";
import { tx } from "../../../i18n/adminText";

// The create / edit announcement window: header, then the form
// (CreateAnnouncementView: fields beside a live preview, with Cancel / Post
// fixed at the bottom). Only the X or Cancel closes it: a click outside, a
// text selection dragged past its edge, or Esc leave it open. What was
// entered is kept as a draft (CreateAnnouncementView) for the next time.
const AnnouncementModal = ({ show, editingAnnouncement, onClose, onSaved, onArchiveToggle }) => {
    const isEditMode = !!editingAnnouncement;

    if (!show) return null;

    return (
        <div
            className="announcement-modal-overlay"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(17,17,17,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px"
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-modal-title"
                style={{
                    background: "#fff",
                    borderRadius: "18px",
                    width: "100%",
                    maxWidth: "1040px",
                    maxHeight: "calc(100dvh - 32px)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.35)"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: "1px solid #f0eaec", flexShrink: 0 }}>
                    <span
                        aria-hidden="true"
                        style={{ width: 44, height: 44, borderRadius: 12, background: "#f5e9ec", color: "#6B2C3E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}
                    >
                        <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-megaphone-fill"}`} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 id="announcement-modal-title" style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#111827" }}>
                            {isEditMode ? tx("Edit Announcement") : tx("New Announcement")}
                        </h2>
                        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
                            {isEditMode
                                ? tx("Changes show on the residents' News page when you save.")
                                : tx("Shown on the residents' News page and emailed to every active resident.")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={tx("Close")}
                        style={{ width: 44, height: 44, border: 0, borderRadius: 10, background: "#f3f4f6", color: "#374151", fontSize: 18, cursor: "pointer", flexShrink: 0 }}
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <CreateAnnouncementView
                    editingAnnouncement={editingAnnouncement}
                    onCreated={onSaved}
                    onCancel={onClose}
                    onArchiveToggle={onArchiveToggle}
                />
            </div>
        </div>
    );
};

export default AnnouncementModal;
