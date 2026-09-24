import React, { useEffect } from "react";
import CreateAnnouncementView from "./CreateAnnouncementView";

// Wraps CreateAnnouncementView in a popup instead of a separate page. Reuses
// the app's existing .modal-overlay backdrop class (see admin.css) for
// consistency with the other admin modals, but with its own wider content
// box -- the generic .modal-content caps at 600px, which is cramped once
// the image preview / link preview blocks are showing.
const AnnouncementModal = ({ show, editingAnnouncement, onClose, onSaved }) => {
    const isEditMode = !!editingAnnouncement;

    // Esc closes the modal, matching the click-outside-to-close affordance below.
    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className="announcement-modal-overlay"
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px"
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "760px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.25)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px 24px",
                        borderBottom: "1px solid #f3f4f6",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        borderRadius: "16px 16px 0 0",
                        zIndex: 1
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                        {isEditMode ? "Edit Announcement" : "New Announcement"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            lineHeight: 1,
                            cursor: "pointer",
                            color: "#6b7280"
                        }}
                    >
                        &times;
                    </button>
                </div>

                <CreateAnnouncementView
                    editingAnnouncement={editingAnnouncement}
                    onCreated={onSaved}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
};

export default AnnouncementModal;