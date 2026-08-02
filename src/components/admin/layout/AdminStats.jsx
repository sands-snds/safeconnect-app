import React from 'react';

const StatCard = ({ label, value, color, onClick }) => (
  <div 
    className="stat-card" 
    onClick={onClick}
    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
  >
    <div className="text-gray-500 text-sm">{label}</div>
    <div className="font-bold text-xl">{value}</div>
    <div style={{ height: '4px', borderRadius: '2px', background: color }}></div>
  </div>
);

const AdminStats = ({ 
  emergencyReports, 
  assistanceRequests, 
  registeredUsers, 
  signInLogs, 
  adminLogs,
  announcements,
  pettyCrimeReports,
  onStatCardClick 
}) => {
  return (
    <div className="stats-grid">
      <StatCard 
        label="TOTAL INCIDENTS REPORTED" 
        value={emergencyReports.length} 
        color="#dbeafe" 
        onClick={() => onStatCardClick('emergency-reports')}
      />
      <StatCard 
        label="ASSISTANCE REQUESTS" 
        value={assistanceRequests.length} 
        color="#fef3c7" 
        onClick={() => onStatCardClick('assistance-requests')}
      />
      <StatCard 
        label="PETTY CRIME REPORTS" 
        value={pettyCrimeReports.length} 
        color="#fee2e2" 
        onClick={() => onStatCardClick('petty-crime-reports')}
      />
      <StatCard 
        label="TOTAL ANNOUNCEMENTS" 
        value={announcements.length} 
        color="#e0f2fe" 
        onClick={() => onStatCardClick('announcement-page')}
      />
      <StatCard 
        label="REGISTERED USERS" 
        value={registeredUsers.length} 
        color="#e9d5ff" 
        onClick={() => onStatCardClick('registered-users')}
      />
      <StatCard 
        label="TOTAL SIGN INS" 
        value={signInLogs.length} 
        color="#fecaca" 
        onClick={() => onStatCardClick('sign-in-logs')}
      />
      <StatCard 
        label="ADMIN LOGINS" 
        value={adminLogs.length} 
        color="#ddd6fe" 
        onClick={() => onStatCardClick('admin-logs')}
      />
    </div>
  );
};

export default AdminStats;
