import React, { useState } from 'react';
import ListView from '../../shared/ListView';

const DetailField = ({ label, value }) => (
  <div style={{ display: 'flex', marginBottom: '6px', fontSize: '0.85em' }}>
    <div style={{ width: '170px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>{label}:</div>
    <div style={{ flex: 1, color: '#374151' }}>{value || value === 0 ? value : 'N/A'}</div>
  </div>
);

const PettyCrimeReportsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);

  const renderRow = (report) => {
    const isExpanded = expandedRowId === report.id;
    const photo = report.photoUrl || report.photo_url || report.imageUrl;

    return (
      <React.Fragment key={report.id}>
        <tr>
          <td className="table-cell">
            <div className="font-medium text-sm">{report.reporter}</div>
            <div className="text-gray-500 text-xs">{report.phone || 'No contact provided'}</div>
          </td>
          <td className="table-cell text-sm">{report.crimeType}</td>
          <td className="table-cell text-sm">{report.location}</td>
          <td className="table-cell text-sm">{report.date}</td>
          <td className="table-cell">
            <select
              value={report.status}
              onChange={(e) => onUpdateStatus(report.id, e.target.value, 'pettyCrime')}
              className="form-select text-xs"
              style={{ padding: '4px 8px' }}
            >
              <option value="Received">Received</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </td>
          <td className="table-cell">
            <button
              type="button"
              onClick={() => setExpandedRowId(isExpanded ? null : report.id)}
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
                  <DetailField label="Reporter Name" value={report.reporter} />
                  <DetailField label="Contact Number" value={report.phone} />
                  <DetailField label="Location" value={report.location} />
                  <DetailField label="Crime Type" value={report.crimeType} />
                  <DetailField label="Description" value={report.description} />
                  <DetailField label="Suspect Info" value={report.suspectInfo || 'None'} />
                  <DetailField label="Report Date" value={report.date} />
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
      title="PETTY CRIME REPORTS"
      data={data}
      filterType="pettyCrime"
      filters={filters}
      setFilters={setFilters}
      headers={['REPORTER', 'CRIME TYPE', 'LOCATION', 'DATE', 'STATUS', 'ACTIONS']}
      renderRow={renderRow}
      statusOptions={['All Items', 'Received', 'In Progress', 'Resolved']}
    />
  );
};

export default PettyCrimeReportsTable;