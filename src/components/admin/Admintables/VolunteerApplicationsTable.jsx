import React from 'react';
import ListView from '../../shared/ListView';

const VolunteerApplicationsTable = ({ 
  data, 
  filters, 
  setFilters, 
  onUpdateStatus, 
  onViewDetails,
  onAddNew 
}) => {
  const renderRow = (volunteer) => (
    <tr key={volunteer.email}>
      <td className="table-cell">
        <div className="font-medium text-sm">{volunteer.name}</div>
        <div className="text-gray-500 text-xs">{volunteer.email}</div>
      </td>
      <td className="table-cell text-sm">
        <div>{volunteer.phone}</div>
        <div className="text-gray-500 text-xs">Age: {volunteer.age}</div>
      </td>
      <td className="table-cell text-sm">
        <div>{volunteer.skills}</div>
        <div className="text-gray-500 text-xs">{volunteer.availability}</div>
      </td>
      <td className="table-cell text-sm">{volunteer.dateApplied}</td>
      <td className="table-cell">
        <select 
          value={volunteer.status}
          onChange={(e) => onUpdateStatus(volunteer.id, e.target.value, 'volunteer')}
          className="form-select text-xs"
          style={{ padding: '4px 8px' }}
        >
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </td>
      <td className="table-cell">
      </td>
    </tr>
  );

  return (
    <ListView
      title="VOLUNTEER APPLICATIONS"
      data={data}
      filterType="volunteer"
      filters={filters}
      setFilters={setFilters}
      headers={['NAME', 'CONTACT', 'SKILLS', 'DATE APPLIED', 'STATUS']}
      renderRow={renderRow}
      statusOptions={['All Items', 'Pending', 'Approved', 'Rejected']}
    />
  );
};

export default VolunteerApplicationsTable;