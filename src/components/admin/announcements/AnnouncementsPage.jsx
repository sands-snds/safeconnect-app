import React from "react";

import AnnouncementsTable from "./AnnouncementsTable";

const AnnouncementsPage = ({
    editingAnnouncement,
    setEditingAnnouncement,
    filters,
    setFilters,
    loadAnnouncements,
    pendingCreateAnnouncement,
    onConsumePendingCreateAnnouncement
}) => {
    return (
        <AnnouncementsTable
            filters={filters}
            setFilters={setFilters}
            editingAnnouncement={editingAnnouncement}
            setEditingAnnouncement={setEditingAnnouncement}
            refreshDashboardData={loadAnnouncements}
            pendingCreateAnnouncement={pendingCreateAnnouncement}
            onConsumePendingCreateAnnouncement={onConsumePendingCreateAnnouncement}
        />
    );
};

export default AnnouncementsPage;