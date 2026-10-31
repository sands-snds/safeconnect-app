import React, { useState } from 'react';
import ListView, { allOption } from '../shared/ListView';
import UserStatusSelect, { USER_STATUSES } from './UserStatusSelect';
import UserRoleSelect from './UserRoleSelect';
import UserChangeConfirmModal from './UserChangeConfirmModal';
import { confirmPopup } from '../../shared/popup';
import { tx } from "../../../i18n/adminText";

const badgeStyle = (bg, color) => ({
  marginLeft: 6,
  fontSize: 10.5,
  fontWeight: 600,
  color,
  background: bg,
  padding: '1px 6px',
  borderRadius: 999
});

// System > Users: Residents, then Admins & Officials, as two tables under
// one shared search / status filter / Generate Report row.
const RegisteredUsersTable = ({
  residents,
  staff,
  filters,
  setFilters,
  onUpdateStatus,
  onUpdateRole,
  onArchiveUser,
  currentAdminId
}) => {
  // { user, field: 'role' | 'status', value } while the confirm dialog is open.
  const [pendingChange, setPendingChange] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    setPendingChange(null);
    setError('');
  };

  const handleConfirm = async () => {
    const { user, field, value } = pendingChange;
    setIsSubmitting(true);
    setError('');

    if (field === 'role') {
      const result = await onUpdateRole(user.id, value);
      setIsSubmitting(false);
      if (!result?.success) {
        setError(result?.message || 'Failed to update role.');
        return;
      }
    } else {
      // updateStatus already shows the backend's message on failure.
      await onUpdateStatus(user.id, value, 'users');
      setIsSubmitting(false);
    }

    closeModal();
  };

  // Closed accounts: Archive (to the Archived tab) or Restore.
  const handleArchive = async (user) => {
    const archiving = !user.archivedAt;
    if (archiving) {
      const confirmed = await confirmPopup({
        type: 'warning',
        title: 'Archive this account?',
        message: `${user.fullName || user.email} moves to the Archived tab. The account stays closed; you can restore it any time.`,
        confirmLabel: 'Archive'
      });
      if (!confirmed) return;
    }
    await onArchiveUser(user.id, archiving);
  };

  const renderRow = (user) => {
    const isSelf = String(user.id) === String(currentAdminId);
    const locked = isSelf || user.isMainAccount;
    const lockTitle = user.isMainAccount
      ? "The barangay's main Admin account can't be changed"
      : isSelf ? "You can't change your own account here" : undefined;

    return (
      <tr key={user.id}>
        <td className="table-cell">
          <div className="font-medium text-sm">
            {user.fullName}
            {isSelf && <span style={badgeStyle('#FDECEC', '#6B2C3E')}>{tx("You")}</span>}
            {user.isMainAccount && (
              <span style={badgeStyle('#3b0d1b', '#fff')} title="The barangay's main Admin account">
                <i className="bi bi-lock-fill" style={{ marginRight: 3 }} />{tx("Main account")}
              </span>
            )}
          </div>
          <div className="text-gray-500 text-xs">{user.email}</div>
        </td>
        <td className="table-cell" title={lockTitle}>
          <UserRoleSelect
            value={user.role}
            disabled={locked}
            onChange={(e) => setPendingChange({ user, field: 'role', value: e.target.value })}
          />
        </td>
        <td className="table-cell text-sm">{user.dateRegistered}</td>
        <td className="table-cell" title={lockTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <UserStatusSelect
              value={user.status}
              disabled={locked}
              onChange={(e) => setPendingChange({ user, field: 'status', value: e.target.value })}
            />
            {onArchiveUser && !locked && (user.archivedAt || user.status === 'Closed') && (
              <button type="button" className="button button-soft" style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }} onClick={() => handleArchive(user)}>
                <i className={`bi ${user.archivedAt ? 'bi-box-arrow-up' : 'bi-archive'}`} style={{ marginRight: 4 }} />
                {user.archivedAt ? 'Restore' : 'Archive'}
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const headers = ['NAME', 'ROLE', 'DATE REGISTERED', 'STATUS'];

  return (
    <>
      <ListView
        data={residents}
        filterType="users"
        filters={filters}
        setFilters={setFilters}
        headers={headers}
        renderRow={renderRow}
        sectionTitle={`Residents (${residents.length})`}
        statusOptions={[allOption('All Statuses'), ...USER_STATUSES]}
        exportType="users"
        exportWithOptions
        exportTitle={tx("Registered Users")}
        itemLabel={tx("residents")}
      />

      <div style={{ marginTop: 28 }}>
        <ListView
          data={staff}
          filterType="users"
          filters={filters}
          setFilters={setFilters}
          headers={headers}
          renderRow={renderRow}
          sectionTitle={`Admins & Officials (${staff.length})`}
          statusOptions={[]}
          showFilters={false}
          itemLabel={tx("accounts")}
        />
      </div>

      <UserChangeConfirmModal
        change={pendingChange}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        isSubmitting={isSubmitting}
        error={error}
      />
    </>
  );
};

export default RegisteredUsersTable;
