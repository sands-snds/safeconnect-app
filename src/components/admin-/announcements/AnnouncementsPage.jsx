import React from "react";

import AnnouncementsTable from "./AnnouncementsTable";
import CreateAnnouncementView from "./CreateAnnouncementView";

const AnnouncementsPage = ({
    activeView,

    editingAnnouncement,

    setEditingAnnouncement,

    filters,
    setFilters,

    loadAnnouncements,

    setActiveView
}) => {

    if (activeView === "create-announcement") {
        return (
            <CreateAnnouncementView
                editingAnnouncement={editingAnnouncement}
                onCreated={() => {
                    loadAnnouncements();

                    setEditingAnnouncement(null);

                    setActiveView(
                        "announcement-page"
                    );
                }}
                onCancel={() => {
                    setEditingAnnouncement(null);

                    setActiveView(
                        "announcement-page"
                    );
                }}
            />
        );
    }

    return (
        <AnnouncementsTable
            filters={filters}
            setFilters={setFilters}
            onEdit={(announcement) => {
                setEditingAnnouncement(
                    announcement
                );

                setActiveView(
                    "create-announcement"
                );
            }}
        />
    );
};

export default AnnouncementsPage;