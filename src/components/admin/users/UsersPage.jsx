import RegisteredUsersTable from "./RegisteredUsersTable";
import { roleLabel } from "../../shared/roles";

// Search / status filtering, shared by both tables (Residents, and Admins &
// Officials).
const filterUsers = (users, filter = {}) => {
    let result = users;

    if (filter.status && filter.status !== "All Items") {
        result = result.filter(u => u.status === filter.status);
    }

    if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(u =>
            [u.fullName, u.username, u.email, u.contact, roleLabel(u.role), u.status]
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
    const filtered = filterUsers(registeredUsers, filters.users);

    return (
        <RegisteredUsersTable
            residents={filtered.filter(u => u.role === "resident")}
            staff={filtered.filter(u => u.role !== "resident")}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onUpdateRole={onUpdateRole}
            currentAdminId={currentAdminId}
        />
    );
}
