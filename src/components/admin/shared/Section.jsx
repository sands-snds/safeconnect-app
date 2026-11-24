import React, { useId } from 'react';
import { CollapseButton } from './Collapsible';

// collapsible: a Show / Hide table button beside the title; collapsed hides
// everything under the title.
const Section = ({ title, children, collapsible = false, collapsed = false, onToggle }) => {
  const bodyId = useId();
  const hidden = collapsible && collapsed;
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: hidden ? 0 : '16px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              margin: 0,
              color: '#111827'
            }}
          >
            {title}
          </h3>
          {collapsible && <CollapseButton collapsed={collapsed} onToggle={onToggle} controls={bodyId} label={typeof title === 'string' ? title : undefined} />}
        </div>
      )}
      <div id={bodyId} hidden={hidden}>
        {children}
      </div>
    </div>
  );
};

export default Section;
