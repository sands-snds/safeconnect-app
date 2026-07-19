import React from "react";

import SignInLogsTable from "./SignInLogsTable";
import AdminLogsTable from "./AdminLogsTable";

const LogsPage = ({
    activeView,
    signInLogs,
    adminLogs,
    filters,
    setFilters
}) => {

    const filterData = (data, filterType, statusKey = "status") => {
        let filtered = data;

        const currentFilter = filters[filterType];

        if (currentFilter.status !== "All Items") {
            filtered = filtered.filter(
                item => item[statusKey] === currentFilter.status
            );
        }

        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();

            filtered = filtered.filter(item =>
                Object.values(item).some(value =>
                    String(value)
                        .toLowerCase()
                        .includes(search)
                )
            );
        }

        return filtered;
    };

    const filteredSignIns = filterData(
        signInLogs,
        "signins",
        "status"
    );

    const filteredAdminLogs = filterData(
        adminLogs,
        "adminLogs",
        "status"
    );

    switch (activeView) {

        case "sign-in-logs":
            return (
                <SignInLogsTable
                    data={filteredSignIns}
                    filters={filters}
                    setFilters={setFilters}
                />
            );

        case "admin-logs":
            return (
                <AdminLogsTable
                    data={filteredAdminLogs}
                    filters={filters}
                    setFilters={setFilters}
                />
            );

        default:
            return null;
    }
};

export default LogsPage;