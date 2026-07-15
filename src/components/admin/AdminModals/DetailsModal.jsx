import React from 'react';

const DetailField = ({ label, value }) => (
  <div style={{ display: 'flex', marginBottom: '8px' }}>
    <div style={{ width: '150px', fontWeight: '600' }}>{label}:</div>
    <div style={{ flex: 1 }}>{value || 'N/A'}</div>
  </div>
);

const TYPE_LABELS = {
  emergency: 'Emergency Report',
  assistance: 'Assistance Request',
  pettyCrime: 'Petty Crime Report',
};

const ADMIN_NOTES = {
  emergency: 'Fire department dispatched. Evacuation in progress.',
  assistance: 'Relief goods prepared. Scheduled for delivery.',
  pettyCrime: 'Report logged. Under review by barangay patrol.',
};

const DetailsModal = ({ type, data, onClose }) => {
  if (!data) return null;

  const getStatusStyle = (status) => {
    const styles = {
      'Received': { bg: '#fef3c7', color: '#92400e' },
      'Pending': { bg: '#fef3c7', color: '#92400e' },
      'In Progress': { bg: '#dbeafe', color: '#1e40af' },
      'Resolved': { bg: '#d1fae5', color: '#065f46' },
      'Approved': { bg: '#d1fae5', color: '#065f46' },
      'Rejected': { bg: '#fee2e2', color: '#991b1b' },
      'Active': { bg: '#d1fae5', color: '#065f46' },
      'Inactive': { bg: '#f3f4f6', color: '#6b7280' },
      'Suspended': { bg: '#fee2e2', color: '#991b1b' },
      'Success': { bg: '#d1fae5', color: '#065f46' },
      'Failed': { bg: '#fee2e2', color: '#991b1b' }
    };
    return styles[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const statusStyle = getStatusStyle(data.status);

  // Collect images
  const photos = [data.photoUrl, data.photo_url, data.imageUrl].filter(Boolean);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '700px', width: '90%',
        maxHeight: '90%', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '1.5em' }}>
            {TYPE_LABELS[type] || 'Report'} Details
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#6b7280'
          }}>×</button>
        </div>

        {/* Status Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: '16px', fontSize: '0.9em', fontWeight: '600',
            backgroundColor: statusStyle.bg, color: statusStyle.color
          }}>
            {data.status}
          </span>
        </div>

        {/* Content: keep simple, label-value layout */}
        <div style={{ marginBottom: '20px' }}>
          {type === 'emergency' && (
            <>
              <DetailField label="Reporter Name" value={data.reporter} />
              <DetailField label="Contact Number" value={data.phone} />
              <DetailField label="Location" value={data.location} />
              <DetailField label="Emergency Type" value={data.emergency} />
              <DetailField label="Severity" value={data.severity} />
              <DetailField label="People Affected" value={data.peopleAffected} />
              <DetailField label="Description" value={data.description} />
              <DetailField label="Report Date" value={data.date} />
            </>
          )}
          {type === 'assistance' && (
            <>
              <DetailField label="Requester Name" value={data.requester} />
              <DetailField label="Contact Number" value={data.phone} />
              <DetailField label="Email" value={data.email} />
              <DetailField label="Assistance Type" value={data.assistanceType} />
              <DetailField label="Urgency" value={data.urgency} />
              <DetailField label="People" value={data.peopleAffected} />
              <DetailField label="Location" value={data.location} />
              <DetailField label="Situation / Description" value={data.description} />
              <DetailField label="Special Needs / Considerations" value={data.specialNeeds || 'None'} />
              <DetailField label="Date" value={data.date} />
            </>
          )}
          {type === 'pettyCrime' && (
            <>
              <DetailField label="Reporter Name" value={data.reporter} />
              <DetailField label="Contact Number" value={data.phone} />
              <DetailField label="Location" value={data.location} />
              <DetailField label="Crime Type" value={data.crimeType} />
              <DetailField label="Description" value={data.description} />
              <DetailField label="Suspect Info" value={data.suspectInfo || 'None'} />
              <DetailField label="Report Date" value={data.date} />
            </>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              {photos.length > 1 ? 'Uploaded Photos' : 'Uploaded Photo'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: photos.length > 1 ? 'repeat(2, 1fr)' : '1fr',
              gap: '8px'
            }}>
              {photos.map((src, index) => (
                <a key={index} href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  <img src={src} alt={`Photo ${index + 1}`} style={{
                    width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb'
                  }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin notes */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Admin Notes</div>
          <div style={{ color: '#374151' }}>{ADMIN_NOTES[type] || 'No notes yet.'}</div>
        </div>

        {/* Back button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: '4px', backgroundColor: '#6b7280', color: '#fff', border: 'none', cursor: 'pointer'
          }}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;