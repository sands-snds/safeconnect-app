import React from "react";

import EmergencyReportsTable from "./EmergencyReportsTable";

const EmergencyPage = ({
    emergencyReports,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive,
    focusId
}) => {
    return (
        <EmergencyReportsTable
            data={emergencyReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
            focusId={focusId}
        />
    );
};

export default EmergencyPage;