// Account roles (registered_users.role):
//   resident    - uses the resident app
//   admin       - admin panel, except the System tabs (users, sign-in logs,
//                 admin logs, settings): handles reports and announcements
//   super_admin - everything, including the System tabs
const ROLES = {
    RESIDENT: "resident",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin"
};

const ALL_ROLES = Object.values(ROLES);
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);
const isSuperAdminRole = (role) => role === ROLES.SUPER_ADMIN;

module.exports = {
    ROLES,
    ALL_ROLES,
    ADMIN_ROLES,
    isAdminRole,
    isSuperAdminRole
};
