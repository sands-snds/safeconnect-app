import React, { useState } from "react";
import RegisteredUsersTable from "./RegisteredUsersTable";
import ArchiveToolbar from "../reports/shared/ArchiveToolbar";
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
    onArchiveUser,
    currentAdminId
}) {
    // Active / Archived tab: archived = Closed accounts moved out of the way.
    const [showArchived, setShowArchived] = useState(false);
    const inTab = registeredUsers.filter(u => Boolean(u.archivedAt) === showArchived);
    const archivedCount = registeredUsers.filter(u => u.archivedAt).length;
    const filtered = filterUsers(inTab, filters.users);

    return (
        <>
        <ArchiveToolbar
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            activeCount={registeredUsers.length - archivedCount}
            archivedCount={archivedCount}
            // No automatic archiving for accounts: Closed ones are archived by hand.
            loadSetting={() => Promise.resolve(null)}
        />
        <RegisteredUsersTable
            residents={filtered.filter(u => u.role === "resident")}
            staff={filtered.filter(u => u.role !== "resident")}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={onUpdateStatus}
            onUpdateRole={onUpdateRole}
            onArchiveUser={onArchiveUser}
            currentAdminId={currentAdminId}
        />
        </>
    );
}
