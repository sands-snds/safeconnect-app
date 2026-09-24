import React, { useState } from 'react';
import ListView, { allOption } from '../shared/ListView';
import UserStatusSelect, { USER_STATUSES } from './UserStatusSelect';
import UserRoleSelect from './UserRoleSelect';
import UserChangeConfirmModal from './UserChangeConfirmModal';

const RegisteredUsersTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus,
  onUpdateRole,
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
      // updateStatus already alerts the backend's message on failure.
      await onUpdateStatus(user.id, value, 'users');
      setIsSubmitting(false);
    }

    closeModal();
  };

  const renderRow = (user) => {
    const isSelf = String(user.id) === String(currentAdminId);
    const selfTitle = isSelf ? "You can't change your own account here" : undefined;

    return (
      <tr key={user.id}>
        <td className="table-cell">
          <div className="font-medium text-sm">
            {user.fullName}
            {isSelf && (
              <span style={{
                marginLeft: 6,
                fontSize: 10.5,
                fontWeight: 600,
                color: '#6B2C3E',
                background: '#FDECEC',
                padding: '1px 6px',
                borderRadius: 999
              }}>
                You
              </span>
            )}
          </div>
          <div className="text-gray-500 text-xs">{user.email}</div>
        </td>
        <td className="table-cell" title={selfTitle}>
          <UserRoleSelect
            value={user.role}
            disabled={isSelf}
            onChange={(e) => setPendingChange({ user, field: 'role', value: e.target.value })}
          />
        </td>
        <td className="table-cell text-sm">{user.dateRegistered}</td>
        <td className="table-cell" title={selfTitle}>
          <UserStatusSelect
            value={user.status}
            disabled={isSelf}
            onChange={(e) => setPendingChange({ user, field: 'status', value: e.target.value })}
          />
        </td>
      </tr>
    );
  };

  const roleFilter = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="font-medium text-sm">Filter by role</label>
      <select
        value={filters.users?.role || 'All Roles'}
        onChange={(e) => setFilters(prev => ({
          ...prev,
          users: { ...prev.users, role: e.target.value }
        }))}
        className="form-select"
      >
        <option value="All Roles">All Roles</option>
        <option value="resident">Resident</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );

  return (
    <>
      <ListView
        data={data}
        filterType="users"
        filters={filters}
        setFilters={setFilters}
        headers={['NAME', 'ROLE', 'DATE REGISTERED', 'STATUS']}
        renderRow={renderRow}
        statusOptions={[allOption('All Statuses'), ...USER_STATUSES]}
        extraFilters={roleFilter}
        exportType="users"
        itemLabel="users"
      />

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
