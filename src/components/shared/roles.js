// Names shown for each account role. The stored values didn't change (see
// backend/utils/roles.js), only what people see:
//   resident    -> Resident
//   admin       -> Official  (admin panel except the System tabs)
//   super_admin -> Admin     (everything, including the System tabs)
export const ROLE_LABELS = {
  resident: 'Resident',
  admin: 'Official',
  super_admin: 'Admin'
};

export const roleLabel = (role) => ROLE_LABELS[role] || 'Unknown';

// The barangay's main Admin account: its role, status and email can't be
// changed (enforced by the backend; the UI just shows it as locked).
export const MAIN_ACCOUNT_EMAIL = 'safeconnect.brgy.santafe@gmail.com';
