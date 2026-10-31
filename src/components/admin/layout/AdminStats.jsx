import React from 'react';
import { tx } from "../../../i18n/adminText";

const StatCard = ({ label, value, icon, variant, theme, onClick }) => (
  <button
    type="button"
    className={`dash-stat dash-stat-${variant}`}
    onClick={onClick}
    style={theme ? { '--stat-color': theme.color, '--stat-rgb': theme.rgb } : undefined}
  >
    <span className="dash-stat-label">{tx(label)}</span>
    <span className="dash-stat-bottom">
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-icon" aria-hidden="true"><i className={`bi ${icon}`} /></span>
    </span>
  </button>
);

const REPORT_THEMES = {
  emergency: { color: '#dc2626', rgb: '220, 38, 38' },
  assistance: { color: '#ea580c', rgb: '234, 88, 12' },
  pettyCrime: { color: '#7c3aed', rgb: '124, 58, 237' }
};

const AdminStats = ({
  emergencyReports = [],
  assistanceRequests = [],
  registeredUsers = [],
  signInLogs = [],
  adminLogs = { admins: [] },
  announcements = [],
  pettyCrimeReports = [],
  onStatCardClick = () => {},
  onCreateAnnouncement,
  isSuperAdmin = false,
  compact = false
}) => {
  const reports = [
    { label: 'Emergency Reports', value: emergencyReports.length, icon: 'bi-exclamation-triangle-fill', view: 'emergency-reports', theme: REPORT_THEMES.emergency },
    { label: 'Assistance Requests', value: assistanceRequests.length, icon: 'bi-box2-heart-fill', view: 'assistance-requests', theme: REPORT_THEMES.assistance },
    { label: 'Petty Crime Reports', value: pettyCrimeReports.length, icon: 'bi-shield-fill-exclamation', view: 'petty-crime-reports', theme: REPORT_THEMES.pettyCrime }
  ];
  const others = [
    { label: 'Total Announcements', value: announcements.length, icon: 'bi-megaphone-fill', view: 'announcement-page' },

    ...(isSuperAdmin ? [
      { label: 'Registered Users', value: registeredUsers.length, icon: 'bi-people-fill', view: 'registered-users' },
      { label: 'Resident Sign-ins', value: signInLogs.length, icon: 'bi-box-arrow-in-right', view: 'sign-in-logs' },
      { label: 'Admins & Officials', value: adminLogs.admins?.length || 0, icon: 'bi-person-badge-fill', view: 'admin-logs' }
    ] : [])
  ];
  const totalReports = emergencyReports.length + assistanceRequests.length + pettyCrimeReports.length;

  return (
    <div className={`dash-stats${compact ? ' is-compact' : ''}`}>
      {!compact && (
        <div className="dash-stats-reports">
          {reports.map((c) => (
            <StatCard key={c.view} {...c} variant="filled" onClick={() => onStatCardClick(c.view)} />
          ))}
        </div>
      )}

      <div className="dash-stats-side">
        {onCreateAnnouncement && (
          <button type="button" className="button dash-stats-create" onClick={onCreateAnnouncement}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> {tx("Create Announcement")}
          </button>
        )}
        <div className="dash-stats-total">
          <span className="dash-stats-total-head">
            <i className="bi bi-clipboard-data-fill dash-stats-total-icon" aria-hidden="true" />
            <span className="dash-stats-total-label">{tx("Total Reports")}</span>
          </span>
          <span className="dash-stats-total-value">{totalReports}</span>
        </div>
      </div>

      {!compact && (
        <div className={`dash-stats-others${others.length === 1 ? ' is-single' : ''}`}>
          {others.map((c) => (
            <StatCard key={c.view} {...c} variant="outline" onClick={() => onStatCardClick(c.view)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStats;
