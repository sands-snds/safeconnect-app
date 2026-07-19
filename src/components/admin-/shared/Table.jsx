import React from 'react';

// Renders the <table> shell: a header row built from `headers`, and a body
// that's just whatever <tr> rows the caller (ListView) already built via
// renderRow(). Kept dumb on purpose so every list page can reuse it.
const Table = ({ headers = [], children }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
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
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export default Table;
