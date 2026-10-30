import React, { useCallback, useEffect, useState } from 'react';
import ListView, { allOption } from '../shared/ListView';
import StatusBadge from '../shared/StatusBadge';
import ArchiveToolbar from '../reports/shared/ArchiveToolbar';
import { fetchSignInLogs, fetchLogArchiveSettings, updateLogArchiveSettings } from '../../../Services/api';
import { LOG_PERIOD_OPTIONS } from './logArchive';

const filterLogs = (logs, filter = {}) => {
  let result = logs;
  if (filter.status && filter.status !== 'All Items') {
    result = result.filter((l) => l.status === filter.status);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter((l) =>
      [l.fullName, l.email, l.loginTime, l.ipAddress, l.location, l.device, l.status,
        ...l.activity.map((a) => `${a.action} ${a.details}`)]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }
  return result;
};

// System > Resident Sign-in Logs (residents only; Officials and Admins are in
// Admin Logs). Each sign-in lists what the resident did afterwards, until
// their next sign-in. Entries older than the auto-archive period (default
// 90 days) move to the Archived tab; they aren't deleted.

const ACTIVITY_SHOWN = 3;

// The ACTIVITY cell: the first few actions, the rest behind "Show N more".
const ActivityCell = ({ activity }) => {
  const [open, setOpen] = useState(false);
  if (!activity.length) return <span className="text-gray-500 text-xs">—</span>;
  const shown = open ? activity : activity.slice(0, ACTIVITY_SHOWN);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {shown.map((a, i) => (
        <div key={i} className="text-sm" title={a.time}>
          <span style={{ fontWeight: 600, color: a.action === 'Signed out' ? '#6b7280' : '#111827' }}>{a.action}</span>
          {a.details && <span style={{ color: '#6B2C3E' }}> · {a.details}</span>}
          <div className="text-gray-500 text-xs">{a.time}</div>
        </div>
      ))}
      {activity.length > ACTIVITY_SHOWN && (
        <button type="button" onClick={() => setOpen((v) => !v)}
          style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: '#6B2C3E', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {open ? 'Show less' : `Show ${activity.length - ACTIVITY_SHOWN} more`}
        </button>
      )}
    </div>
  );
};
const SignInLogsTable = ({ data, filters, setFilters, isSuperAdmin, onRefresh }) => {
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState(null); // null = not loaded yet

  const loadArchived = useCallback(() => {
    fetchSignInLogs({ archived: true }).then(setArchived).catch(() => setArchived([]));
  }, []);

  useEffect(() => { loadArchived(); }, [loadArchived]);

  const renderRow = (log) => (
    <tr key={log.id}>
      <td className="table-cell">
        <div className="font-medium text-sm">{log.fullName}</div>
        <div className="text-gray-500 text-xs">{log.email}</div>
      </td>
      <td className="table-cell text-sm">{log.loginTime}</td>
      <td className="table-cell"><ActivityCell activity={log.activity} /></td>
      <td className="table-cell">
        <div className="text-sm">{log.device}</div>
        <div className="text-sm" style={{ color: '#4b5563' }}>{log.ipAddress}</div>
        {log.location && <div className="text-gray-500 text-xs">{log.location}</div>}
      </td>
      <td className="table-cell">
        <StatusBadge status={log.status} />
      </td>
    </tr>
  );

  const list = showArchived ? (archived || []) : data;

  return (
    <>
      <ArchiveToolbar
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        activeCount={data.length}
        archivedCount={archived ? archived.length : null}
        isSuperAdmin={isSuperAdmin}
        onSettingsChanged={() => { onRefresh && onRefresh(); loadArchived(); }}
        loadSetting={() => fetchLogArchiveSettings('signin')}
        saveSetting={(days) => updateLogArchiveSettings('signin', days)}
        periodOptions={LOG_PERIOD_OPTIONS}
        settingLabel="Auto-archive sign-ins:"
      />

      {showArchived && archived === null ? (
        <p className="text-gray-500 text-sm">Loading archived sign-ins...</p>
      ) : (
        <ListView
          data={filterLogs(list, filters.signins)}
          filterType="signins"
          filters={filters}
          setFilters={setFilters}
          headers={['USER', 'LOGIN TIME', 'ACTIVITY', 'DEVICE & IP ADDRESS', 'STATUS']}
          renderRow={renderRow}
          statusOptions={[allOption('All Statuses'), 'Success', 'Failed']}
          exportType="signinLogs"
          exportWithOptions
          exportTitle={showArchived ? 'Archived Resident Sign-in Logs' : 'Resident Sign-in Logs'}
          exportFilters={showArchived ? { archived: '1' } : {}}
          itemLabel="sign-ins"
        />
      )}
    </>
  );
};

export default SignInLogsTable;
