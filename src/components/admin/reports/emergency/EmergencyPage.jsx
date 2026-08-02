import React from "react";

import EmergencyReportsTable from "./EmergencyReportsTable";

const EmergencyPage = ({
    emergencyReports,
    filters,
    setFilters,
    onUpdateStatus,
    getSeverityColor
}) => {
    return (
        <EmergencyReportsTable
            data={emergencyReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            getSeverityColor={getSeverityColor}
        />
    );
};

export default EmergencyPage;