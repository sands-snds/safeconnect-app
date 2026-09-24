import React, { useState, useMemo } from 'react';
import GenerateReportButton from '../shared/GenerateReportButton';
import { timeAgo, formatDateTime } from '../shared/timeUtils';
import Pagination from '../shared/Pagination';

const DEFAULT_PAGE_SIZE = 25;

const ACTION_STYLES = {
  'Logged in':         { bg: '#d1fae5', color: '#065f46', icon: 'bi-box-arrow-in-right' },
  'Logged out':        { bg: '#f3f4f6', color: '#374151', icon: 'bi-box-arrow-right' },
  'Changed user role': { bg: '#ede9fe', color: '#5b21b6', icon: 'bi-person-badge-fill' },
  'Changed user status': { bg: '#fef3c7', color: '#92400e', icon: 'bi-person-fill-gear' },
  'Generated report':  { bg: '#e0f2fe', color: '#075985', icon: 'bi-file-earmark-arrow-down-fill' },
  'Deleted announcement': { bg: '#fee2e2', color: '#991b1b', icon: 'bi-trash-fill' }
};
const DEFAULT_ACTION_STYLE = { bg: '#dbeafe', color: '#1e40af', icon: 'bi-pencil-square' };

const ActionBadge = ({ action }) => {
  const style = ACTION_STYLES[action] || DEFAULT_ACTION_STYLE;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap'
    }}>
      <i className={`bi ${style.icon}`} />
      {action}
    </span>
  );
};

const initials = (name) =>
  (name || 'A').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

const AdminAvatar = ({ admin }) =>
  admin.photoUrl ? (
    <img src={admin.photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: '#6B2C3E', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0
    }}>
      {initials(admin.username || admin.fullName || admin.email)}
    </div>
  );

const PresenceLabel = ({ admin }) => {
  if (admin.online) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#065f46', fontWeight: 600, fontSize: 13 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
        Online now
      </span>
    );
  }

  const text = admin.latestAction === 'Logged out'
    ? `Logged out ${timeAgo(admin.latestAt)}`
    : admin.lastSeen
      ? `Last seen ${timeAgo(admin.lastSeen)}`
      : 'Offline';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d1d5db' }} />
      {text}
    </span>
  );
};

const AdminLogsTable = ({ admins = [], activity = [], filters, setFilters }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const search = filters.adminLogs?.search || '';
  const adminFilter = filters.adminLogs?.admin || '';

  const setAdminLogsFilter = (patch) => {
    setPage(1);
    setFilters(prev => ({ ...prev, adminLogs: { ...prev.adminLogs, ...patch } }));
  };

  const onlineCount = admins.filter(a => a.online).length;

  // Every admin who shows up in the log, including ones since demoted.
  const adminOptions = useMemo(() => {
    const emails = new Set([...admins.map(a => a.email), ...activity.map(l => l.email)]);
    return [...emails].filter(Boolean).sort();
  }, [admins, activity]);

  const filteredActivity = useMemo(() => {
    let result = activity;
    if (adminFilter) result = result.filter(l => l.email === adminFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        [l.username, l.email, l.action, l.details].some(v => String(v || '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [activity, adminFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleActivity = filteredActivity.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* ── Admin accounts ─────────────────────────────────────────────── */}
      <div className="section" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-shield-lock-fill"></i>
            <span>Admin Accounts</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {admins.length}
            </span>
          </div>
          <span style={{ fontSize: 13, opacity: 0.9 }}>
            {onlineCount} online now
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Admin</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Last Login</th>
                <th className="table-header-cell">Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    No admin accounts found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="table-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AdminAvatar admin={admin} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{admin.username || admin.fullName || '—'}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <PresenceLabel admin={admin} />
                    </td>
                    <td className="table-cell" style={{ fontSize: 13 }}>
                      {admin.lastLogin ? (
                        <>
                          <div>{formatDateTime(admin.lastLogin)}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(admin.lastLogin)}</div>
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No login recorded yet</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {admin.latestAction ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <ActionBadge action={admin.latestAction} />
                          {admin.latestDetails && (
                            <span style={{ fontSize: 12.5, color: '#4b5563' }}>{admin.latestDetails}</span>
                          )}
                          <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{timeAgo(admin.latestAt)}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>No activity yet</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Activity log ───────────────────────────────────────────────── */}
      <div className="section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-clock-history"></i>
            <span>Activity Log</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {filteredActivity.length}
            </span>
          </div>
        </div>

        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search activity..."
            className="form-input"
            style={{ flex: '1', minWidth: '200px' }}
            value={search}
            onChange={(e) => setAdminLogsFilter({ search: e.target.value })}
          />

          <select
            className="form-select"
            value={adminFilter}
            onChange={(e) => setAdminLogsFilter({ admin: e.target.value })}
          >
            <option value="">All admins</option>
            {adminOptions.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>

          <GenerateReportButton
            type="adminLogs"
            filters={{ search: search || undefined, admin: adminFilter || undefined }}
          />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Time</th>
                <th className="table-header-cell">Admin</th>
                <th className="table-header-cell">Action</th>
                <th className="table-header-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: '#6b7280' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.5 }}></i>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        {activity.length === 0
                          ? 'No admin activity recorded yet. Actions will appear here as admins log in and make changes.'
                          : 'No activity matches your filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleActivity.map((log) => (
                  <tr key={log.id}>
                    <td className="table-cell" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDateTime(log.createdAt)}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{timeAgo(log.createdAt)}</div>
                    </td>
                    <td className="table-cell">
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{log.username || log.email}</div>
                      {log.username && <div style={{ fontSize: 12, color: '#6b7280' }}>{log.email}</div>}
                    </td>
                    <td className="table-cell">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="table-cell" style={{ fontSize: 13, color: '#374151' }}>
                      {log.details || <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredActivity.length}
          pageSize={pageSize}
          onPageChange={(next) => setPage(Math.max(1, Math.min(totalPages, next)))}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          itemLabel="entries"
          style={{ margin: 0, padding: '12px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}
        />
      </div>
    </div>
  );
};

export default AdminLogsTable;
