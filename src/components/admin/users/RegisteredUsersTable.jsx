import React from 'react';
import ListView from '../shared/ListView';
import UserStatusSelect from './UserStatusSelect';

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
        <UserStatusSelect
            value={user.status}
            onChange={(e)=>
                onUpdateStatus(
                    user.id,
                    e.target.value,
                    "users"
                )
            }
        />
      </td>
    </tr>
  );

  return (
    <ListView
      data={data}
      filterType="users"
      filters={filters}
      setFilters={setFilters}
      headers={['USER','DATE REGISTERED','STATUS']}
      renderRow={renderRow}
      statusOptions={['Select', 'Active', 'Inactive', 'Suspended']}
    />
    
  );
};

export default RegisteredUsersTable;