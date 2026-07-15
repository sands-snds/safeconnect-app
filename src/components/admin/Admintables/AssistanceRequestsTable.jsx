import React, { useState } from 'react';
import ListView from '../../shared/ListView';

const DetailField = ({ label, value }) => (
  <div style={{ display: 'flex', marginBottom: '6px', fontSize: '0.85em' }}>
    <div style={{ width: '170px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>{label}:</div>
    <div style={{ flex: 1, color: '#374151' }}>{value || value === 0 ? value : 'N/A'}</div>
  </div>
);

const AssistanceRequestsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);

  const renderRow = (request) => {
    const isExpanded = expandedRowId === request.id;
    const photo = request.photoUrl || request.photo_url || request.imageUrl;

    return (
      <React.Fragment key={request.id}>
        <tr>
          <td className="table-cell">
            <div className="font-medium text-sm">{request.requester}</div>
            <div className="text-gray-500 text-xs">{request.phone}</div>
          </td>
          <td className="table-cell">
            <div className="font-medium text-sm">{request.assistanceType}</div>
            <div className="text-gray-500 text-xs">People: {request.peopleAffected}</div>
          </td>
          <td className="table-cell text-sm">{request.location}</td>
          <td className="table-cell text-sm">{request.date}</td>
          <td className="table-cell">
            <select
              value={request.status}
              onChange={(e) => onUpdateStatus(request.id, e.target.value, 'assistance')}
              className="form-select text-xs"
              style={{ padding: '4px 8px' }}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </td>
          <td className="table-cell">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : request.id)}
              className="text-xs font-medium"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          </td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={6} style={{ backgroundColor: '#f9fafb', padding: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
                  <DetailField label="Requester Name" value={request.requester} />
                  <DetailField label="Contact Number" value={request.phone} />
                  <DetailField label="Email" value={request.email} />
                  <DetailField label="Assistance Type" value={request.assistanceType} />
                  <DetailField label="Urgency Level" value={request.urgency} />
                  <DetailField label="People Needing Help" value={request.peopleAffected} />
                  <DetailField label="Location" value={request.location} />
                  <DetailField label="Situation / Description" value={request.description} />
                  <DetailField label="Special Needs / Considerations" value={request.specialNeeds || 'None'} />
                  <DetailField label="Date" value={request.date} />
                </div>
                {photo && (
                  <div style={{ flex: '0 0 auto' }}>
                    <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.85em', color: '#374151' }}>
                      Uploaded Photo
                    </div>
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo}
                        alt="Attachment"
                        style={{
                          width: '220px',
                          maxHeight: '220px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <ListView
      title="ASSISTANCE REQUESTS"
      data={data}
      filterType="assistance"
      filters={filters}
      setFilters={setFilters}
      headers={['REQUESTER', 'TYPE', 'LOCATION', 'DATE', 'STATUS', 'ACTIONS']}
      renderRow={renderRow}
      statusOptions={['All Items', 'Pending', 'In Progress', 'Approved', 'Rejected']}
    />
  );
};

export default AssistanceRequestsTable;