import React from "react";

import AssistanceRequestsTable from "./AssistanceRequestsTable";

const AssistancePage = ({
    assistanceRequests,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive
}) => {
    return (
        <AssistanceRequestsTable
            data={assistanceRequests}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
        />
    );
};

export default AssistancePage;