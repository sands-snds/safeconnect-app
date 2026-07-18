import React from "react";

import RegisteredUsersTable from "../users/RegisteredUsersTable";

const UsersPage = ({
    registeredUsers,
    filters,
    setFilters,
    onUpdateStatus
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

    const filteredUsers = filterData(
        registeredUsers,
        "users"
    );

    return (
        <RegisteredUsersTable
            data={filteredUsers}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
        />
    );
};

export default UsersPage;