import React from "react";
import { EmergencyPage } from "../reports/emergency";
import { AssistancePage } from "../reports/assistance";
import { PettyCrimePage } from "../reports/pettycrime";

const ReportsPage = ({
    activeView,

    emergencyReports,
    assistanceRequests,
    pettyCrimeReports,

    filters,
    setFilters,

    onUpdateStatus,

    getSeverityColor
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

    const filteredEmergencyReports = filterData(
        emergencyReports,
        "emergency"
    );

    const filteredAssistanceRequests = filterData(
        assistanceRequests,
        "assistance"
    );

    const filteredPettyCrimeReports = filterData(
        pettyCrimeReports,
        "pettyCrime"
    );

    switch (activeView) {

        case "emergency-reports":
            return (
                <EmergencyPage
                    emergencyReports={filteredEmergencyReports}
                    filters={filters}
                    setFilters={setFilters}
                    onUpdateStatus={onUpdateStatus}
                    getSeverityColor={getSeverityColor}
                />
            );

        case "assistance-requests":
            return (
                <AssistancePage
                    assistanceRequests={filteredAssistanceRequests}
                    filters={filters}
                    setFilters={setFilters}
                    onUpdateStatus={onUpdateStatus}
                />
            );

        case "petty-crime-reports":
            return (
                <PettyCrimePage
                    pettyCrimeReports={filteredPettyCrimeReports}
                    filters={filters}
                    setFilters={setFilters}
                    onUpdateStatus={onUpdateStatus}
                />
            );

        default:
            return null;
    }
};

export default ReportsPage;