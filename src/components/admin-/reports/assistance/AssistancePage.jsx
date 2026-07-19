import React from "react";

import AssistanceRequestsTable from "./AssistanceRequestsTable";

const AssistancePage = ({
    assistanceRequests,
    filters,
    setFilters,
    onUpdateStatus
}) => {
    return (
        <AssistanceRequestsTable
            data={assistanceRequests}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
        />
    );
};

export default AssistancePage;