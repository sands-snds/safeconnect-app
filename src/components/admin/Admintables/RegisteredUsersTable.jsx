import React from 'react';
import ListView from '../../shared/ListView';

const RegisteredUsersTable = ({ 
  data, 
  filters, 
  setFilters, 
  onUpdateStatus 
}) => {
  const renderRow = (user) => (
    <tr key={user.id}>
      <td className="table-cell">
        <div className="font-medium text-sm">{user.fullName}</div>
        <div className="text-gray-500 text-xs">{user.email}</div>
      </td>
      <td className="table-cell text-sm">{user.dateRegistered}</td>
      <td className="table-cell">
        <select 
          value={user.status}
          onChange={(e) => onUpdateStatus(user.id, e.target.value, 'users')}
          className="form-select text-xs"
          style={{ padding: '4px 8px' }}
        >
          <option>Active</option>
          <option>Inactive</option>
          <option>Suspended</option>
        </select>
      </td>
    </tr>
  );

  return (
    <ListView
      title="REGISTERED USERS"
      data={data}
      filterType="users"
      filters={filters}
      setFilters={setFilters}
      headers={['USER','DATE REGISTERED','STATUS']}
      renderRow={renderRow}
      statusOptions={['All Items', 'Active', 'Inactive', 'Suspended']}
    />
  );
};

export default RegisteredUsersTable;