import React from 'react';

const Section = ({ title, children }) => (
  <div className="section">
    <div className="section-header">
      {title}
    </div>
    {children}
  </div>
);

export default Section;