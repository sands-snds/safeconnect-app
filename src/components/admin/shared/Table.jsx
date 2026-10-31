import React, { useEffect, useRef } from 'react';
import { tx } from '../../../i18n/adminText';

const Table = ({ headers = [], children }) => {
  const tableRef = useRef(null);
  useEffect(() => {
    tableRef.current?.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, i) => {
        if (headers[i] && cell.colSpan <= 1) cell.setAttribute('data-label', tx(headers[i]));
      });
    });
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table ref={tableRef} className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                {tx(h)}
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
