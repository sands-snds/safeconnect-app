import React from 'react';
import { tx } from '../../../i18n/adminText';

// Headers given as { label, width } set a column width.
// stack: 'lg', 'md' or 'sm' — instead of scrolling sideways, the table fills
// its space and, when that gets narrower than about 1000 / 820 / 480 px, each
// row becomes a card (cells need a data-label with their column name; see
// .stack-table in admin.css). Without it, a narrow screen scrolls sideways.
const Table = ({ headers = [], children, stack }) => {
  return (
    <div className={stack ? 'stack-table-wrap' : undefined} style={stack ? undefined : { overflowX: 'auto' }}>
      <table className={stack ? `admin-table stack-table stack-${stack}` : 'admin-table'} style={{ width: '100%', borderCollapse: 'collapse' }}>
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
