import React from 'react';

// Colored pill for any status value in the admin tables (sign-in logs,
// users, reports, etc). Falls back to a neutral gray for anything not
// listed below, so new statuses never crash this component.
const STATUS_STYLES = {
  Success: { bg: '#d1fae5', color: '#065f46' },
  Failed: { bg: '#fee2e2', color: '#991b1b' },
  Active: { bg: '#d1fae5', color: '#065f46' },
  Inactive: { bg: '#f3f4f6', color: '#374151' },
  Suspended: { bg: '#fee2e2', color: '#991b1b' },
  Received: { bg: '#fef3c7', color: '#92400e' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  'In Progress': { bg: '#dbeafe', color: '#1e40af' },
  Resolved: { bg: '#d1fae5', color: '#065f46' },
  Approved: { bg: '#d1fae5', color: '#065f46' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
  Disabled: { bg: '#f3f4f6', color: '#374151' },
  Banned: { bg: '#fee2e2', color: '#991b1b' }
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '.75rem',
        fontWeight: 600,
        background: style.bg,
        color: style.color
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
