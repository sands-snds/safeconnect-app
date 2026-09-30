import React from "react";

import EmergencyReportsTable from "./EmergencyReportsTable";

const EmergencyPage = ({
    emergencyReports,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive,
    getSeverityColor
}) => {
    return (
        <EmergencyReportsTable
            data={emergencyReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
            getSeverityColor={getSeverityColor}
        />
    );
};

export default EmergencyPage;