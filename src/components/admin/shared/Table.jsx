import React from 'react';
import { tx } from '../../../i18n/adminText';

// minWidth: for a table with many columns (it scrolls sideways when the
// screen is narrower). Headers given as { label, width } set a column width.
const Table = ({ headers = [], children, minWidth }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', ...(minWidth ? { minWidth } : {}) }}>
        <thead>
          <tr>
            {headers.map((header) => {
              const h = typeof header === 'string' ? header : header.label;
              return (
              <th
                key={h}
                style={{
                  width: typeof header === 'string' ? undefined : header.width,
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: '.75rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  borderBottom: '2px solid #e5e7eb',
                  textTransform: 'uppercase',
                  letterSpacing: '.03em'
                }}
              >
                {tx(h)}
              </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default Table;
