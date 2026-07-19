import RegisteredUsersTable from "./RegisteredUsersTable";

export default function UsersPage({
    registeredUsers,
    filters,
    setFilters,
    onUpdateStatus
}) {
    return (
        <RegisteredUsersTable
            data={registeredUsers}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
        />
    );
}