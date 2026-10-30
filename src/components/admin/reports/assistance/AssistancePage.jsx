import React from "react";

import AssistanceRequestsTable from "./AssistanceRequestsTable";

const AssistancePage = ({
    assistanceRequests,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive,
    focusId
}) => {
    return (
        <AssistanceRequestsTable
            data={assistanceRequests}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
            focusId={focusId}
        />
    );
};

export default AssistancePage;