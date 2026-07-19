import React from 'react';

const AdminLogsTable = ({ data, filters, setFilters }) => {
  return (
    <div className="section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-shield-lock-fill"></i>
          <span>Admin Login Logs</span>
          <span style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            {data.length}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="🔍 Search admin logs..."
          className="form-input"
          style={{ flex: '1', minWidth: '200px' }}
          value={filters.adminLogs?.search || ''}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            adminLogs: { ...prev.adminLogs, search: e.target.value }
          }))}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">#</th>
              <th className="table-header-cell">Email Address</th>
              <th className="table-header-cell">Login Time</th>
              <th className="table-header-cell">IP Address</th>
              <th className="table-header-cell">Device</th>
              <th className="table-header-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ color: '#6b7280' }}>
                    <i className="bi bi-inbox" style={{ 
                      fontSize: '48px', 
                      display: 'block', 
                      marginBottom: '12px',
                      opacity: 0.5 
                    }}></i>
                    <p style={{ margin: 0, fontSize: '14px' }}>No admin login logs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((log) => (
                <tr key={log.id}>
                  <td className="table-cell">
                    <span style={{ 
                      fontWeight: 600,
                      color: '#6b7280' 
                    }}>
                      {log.id}
                    </span>
                  </td>
                  
                  <td className="table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bi bi-person-circle" style={{ 
                        fontSize: '20px',
                        color: '#6B2C3E' 
                      }}></i>
                      <span style={{ fontWeight: 500 }}>{log.email}</span>
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        {log.timestamp}
                      </span>
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <span style={{ 
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: '#6b7280' 
                    }}>
                      {log.ipAddress}
                    </span>
                  </td>
                  
                  <td className="table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-laptop" style={{ 
                        fontSize: '16px',
                        color: '#6b7280' 
                      }}></i>
                      <span style={{ fontSize: '13px' }}>{log.device}</span>
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <span className="status-badge bg-success"
                      style={{ color: 'white' }}
                      >
                      <i className="bi bi-check-circle-fill" style={{ marginRight: '4px' }}></i>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Footer */}
      {data.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="bi bi-info-circle-fill"></i>
          <span>Showing {data.length} admin login {data.length === 1 ? 'entry' : 'entries'}</span>
        </div>
      )}
    </div>
  );
};

export default AdminLogsTable;