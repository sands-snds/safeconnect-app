import React from 'react';

const DetailField = ({ label, value }) => (
  <div className="detail-field">
    <div className="detail-label">
      {label}
    </div>
    <div className="detail-value">{value}</div>
  </div>
);

export default DetailField;