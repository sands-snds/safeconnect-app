import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyle = (status) => {
    const styles = {
      'Received': { bg: '#fef3c7', color: '#92400e' },
      'Pending': { bg: '#fef3c7', color: '#92400e' },
      'In Progress': { bg: '#dbeafe', color: '#1e40af' },
      'Resolved': { bg: '#d1fae5', color: '#065f46' },
      'Approved': { bg: '#d1fae5', color: '#065f46' },
      'Rejected': { bg: '#fee2e2', color: '#991b1b' } ,    
      'Active': { bg: '#d1fae5', color: '#065f46' },
      'Inactive': { bg: '#f3f4f6', color: '#6b7280' },
      'Suspended': { bg: '#fee2e2', color: '#991b1b' },
      'Success': { bg: '#d1fae5', color: '#065f46' },
      'Failed': { bg: '#fee2e2', color: '#991b1b' }
    };
    return styles[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const style = getStatusStyle(status);
  
  return (
    <span 
      className="status-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;