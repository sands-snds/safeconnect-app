import React from 'react';

// Simple card/section wrapper used by ListView and the dashboard's pie charts.
const Section = ({ title, children }) => {
  return (
    <div
      className="admin-section"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px'
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#111827'
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Section;
