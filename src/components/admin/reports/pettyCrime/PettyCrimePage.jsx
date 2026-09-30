import React from "react";

import PettyCrimeReportsTable from "./PettyCrimeReportsTable";

const PettyCrimePage = ({
    pettyCrimeReports,
    filters,
    setFilters,
    onUpdateStatus,
    onArchive
}) => {
    return (
        <PettyCrimeReportsTable
            data={pettyCrimeReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onArchive={onArchive}
        />
    );
};

export default PettyCrimePage;