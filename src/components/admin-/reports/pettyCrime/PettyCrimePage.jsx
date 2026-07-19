import React from "react";

import PettyCrimeReportsTable from "./PettyCrimeReportsTable";

const PettyCrimePage = ({
    pettyCrimeReports,
    filters,
    setFilters,
    onUpdateStatus
}) => {
    return (
        <PettyCrimeReportsTable
            data={pettyCrimeReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
        />
    );
};

export default PettyCrimePage;