import React from "react";

import PettyCrimeReportsTable from "./PettyCrimeReportsTable";

const PettyCrimePage = ({
    pettyCrimeReports,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive,
    focusId
}) => {
    return (
        <PettyCrimeReportsTable
            data={pettyCrimeReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
            focusId={focusId}
        />
    );
};

export default PettyCrimePage;