import React, { useEffect, useRef } from 'react';
import { tx } from '../../../i18n/adminText';

// Renders the <table> shell: a header row built from `headers`, and a body
// that's just whatever <tr> rows the caller (ListView) already built via
// renderRow(). Kept dumb on purpose so every list page can reuse it.
// On phones (admin.css) each row is a card and every cell shows its column
// name, taken from the data-label set here after each render.
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
