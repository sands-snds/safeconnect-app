import React from "react";

import SignInLogsTable from "./SignInLogsTable";
import AdminLogsTable from "./AdminLogsTable";

// System > Resident Logs / Admin Logs. Each table filters its own list and
// loads its own Archived tab.
const LogsPage = ({
    activeView,
    signInLogs,
    adminLogs,
    filters,
    setFilters,
    isSuperAdmin,
    onRefresh
}) => {
    switch (activeView) {

        case "sign-in-logs":
            return (
                <SignInLogsTable
                    data={signInLogs}
                    filters={filters}
                    setFilters={setFilters}
                    isSuperAdmin={isSuperAdmin}
                    onRefresh={onRefresh}
                />
            );

        case "admin-logs":
            return (
                <AdminLogsTable
                    admins={adminLogs.admins}
                    activity={adminLogs.activity}
                    filters={filters}
                    setFilters={setFilters}
                    isSuperAdmin={isSuperAdmin}
                    onRefresh={onRefresh}
                />
            );

        default:
            return null;
    }
};

export default LogsPage;
