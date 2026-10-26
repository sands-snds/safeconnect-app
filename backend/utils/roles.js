// Account roles (registered_users.role). The stored values are kept as they
// were; only the names shown to people changed:
//
//   stored value   shown as     what they can do
//   resident       Resident     uses the resident app
//   admin          Official     admin panel, except the System tabs: handles
//                               reports and announcements
//   super_admin    Admin        everything, including the System tabs
//                               (users, logs, site contacts, settings)
//
// Always show ROLE_LABELS[role] to people, never the stored value.
const ROLES = {
    RESIDENT: "resident",
    ADMIN: "admin",             // shown as "Official"
    SUPER_ADMIN: "super_admin"  // shown as "Admin"
};

const ROLE_LABELS = {
    [ROLES.RESIDENT]: "Resident",
    [ROLES.ADMIN]: "Official",
    [ROLES.SUPER_ADMIN]: "Admin"
};

const roleLabel = (role) => ROLE_LABELS[role] || "Unknown";

const ALL_ROLES = Object.values(ROLES);
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);
const isSuperAdminRole = (role) => role === ROLES.SUPER_ADMIN;

// The barangay's own account. It is created on server start if missing and
// is always an Active Admin (super_admin): its role, status and email can't
// be changed, so the system can be handed over to the barangay without
// anyone being able to lock them out. See services/mainAccount.js.
const MAIN_ACCOUNT_EMAIL = "safeconnect.brgy.santafe@gmail.com";

const isMainAccount = (email) =>
    String(email || "").trim().toLowerCase() === MAIN_ACCOUNT_EMAIL;

module.exports = {
    ROLES,
    ROLE_LABELS,
    roleLabel,
    ALL_ROLES,
    ADMIN_ROLES,
    isAdminRole,
    isSuperAdminRole,
    MAIN_ACCOUNT_EMAIL,
    isMainAccount
};
