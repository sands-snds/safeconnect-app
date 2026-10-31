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
