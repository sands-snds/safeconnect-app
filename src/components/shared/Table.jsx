import React from 'react';

const Table = ({ headers, children }) => (
  <div className="table-container">
    <table className="data-table">
      <thead className="table-header">
        <tr>
          {headers.map((header, i) => (
            <th key={i} className="table-header-cell">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export default Table;