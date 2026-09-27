import React from 'react';
import ListView, { allOption } from '../shared/ListView';
import StatusBadge from '../shared/StatusBadge';

const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', resident: 'Resident' };

const SignInLogsTable = ({ 
  data, 
  filters, 
  setFilters 
}) => {
  const renderRow = (log) => (
    <tr key={log.id}>
      <td className="table-cell">
        <div className="font-medium text-sm">{log.fullName}</div>
        <div className="text-gray-500 text-xs">{log.email}</div>
      </td>
      <td className="table-cell text-sm">{log.loginTime}</td>
      <td className="table-cell text-sm">{ROLE_LABELS[log.role] || 'Unknown'}</td>
      <td className="table-cell text-sm">{log.ipAddress}</td>
      <td className="table-cell text-sm">{log.device}</td>
      <td className="table-cell">
        <StatusBadge status={log.status} />
      </td>
    </tr>
  );

  return (
    <ListView
      data={data}
      filterType="signins"
      filters={filters}
      setFilters={setFilters}
      headers={['USER', 'LOGIN TIME', 'ROLE', 'IP ADDRESS', 'DEVICE', 'STATUS']}
      renderRow={renderRow}
      statusOptions={[allOption('All Statuses'), 'Success', 'Failed']}
      exportType="signinLogs"
      itemLabel="sign-ins"
    />
  );
};

export default SignInLogsTable;