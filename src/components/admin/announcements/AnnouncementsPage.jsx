import React from "react";

import AnnouncementsTable from "./AnnouncementsTable";

const AnnouncementsPage = ({
    editingAnnouncement,
    setEditingAnnouncement,
    filters,
    setFilters,
    loadAnnouncements,
    pendingCreateAnnouncement,
    onConsumePendingCreateAnnouncement,
    isSuperAdmin
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
            isSuperAdmin={isSuperAdmin}
        />
    );
};

export default AnnouncementsPage;