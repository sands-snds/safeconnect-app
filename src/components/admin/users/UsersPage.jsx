import RegisteredUsersTable from "./RegisteredUsersTable";

// Search / status / role filtering (the table used to receive the raw list,
// so the filters on this tab never actually did anything).
const filterUsers = (users, filter = {}) => {
    let result = users;

    if (filter.status && filter.status !== "All Items") {
        result = result.filter(u => u.status === filter.status);
    }

    if (filter.role && filter.role !== "All Roles") {
        result = result.filter(u => u.role === filter.role);
    }

    if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(u =>
            [u.fullName, u.username, u.email, u.contact, u.role, u.status]
                .some(v => String(v || "").toLowerCase().includes(q))
        );
    }

    return result;
};

export default function UsersPage({
    registeredUsers,
    filters,
    setFilters,
    onUpdateStatus,
    onUpdateRole,
    currentAdminId
}) {
    return (
        <RegisteredUsersTable
            data={filterUsers(registeredUsers, filters.users)}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onUpdateRole={onUpdateRole}
            currentAdminId={currentAdminId}
        />
    );
}
