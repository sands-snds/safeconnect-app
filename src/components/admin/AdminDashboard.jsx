import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminStats from './AdminStats';
import Section from '../shared/Section';

const STATUS_COLORS = {
  'Received': '#fbbf24',
  'Pending': '#fbbf24',
  'In Progress': '#3b82f6',
  'Resolved': '#10b981',
  'Approved': '#10b981',
  'Rejected': '#ef4444'
};

const SEVERITY_COLORS = {
  'Low': '#16a34a',
  'Medium': '#ca8a04',
  'High': '#ea580c',
  'Critical': '#dc2626'
};

const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

// Groups a list of records by a field and returns [{ name, value }] for the pie chart
const buildPieData = (items, key) => {
  const counts = {};
  items.forEach(item => {
    const val = item[key] || 'Unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const PieChartCard = ({ data, colorMap }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7280' }}>
        No data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((entry, index) => (
            <Cell 
              key={entry.name} 
              fill={colorMap[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const AdminDashboard = ({ 
  emergencyReports, 
  assistanceRequests, 
  registeredUsers,
  signInLogs,
  adminLogs,
  announcements,
  pettyCrimeReports,
  onStatCardClick 
}) => {
  const emergencyStatusData = buildPieData(emergencyReports, 'status');
  const emergencySeverityData = buildPieData(emergencyReports, 'severity');
  const assistanceStatusData = buildPieData(assistanceRequests, 'status');

  return (
    <div>
      <h1 className="font-bold text-2xl mb-5">DASHBOARD</h1>

      <AdminStats
        emergencyReports={emergencyReports}
        assistanceRequests={assistanceRequests}
        registeredUsers={registeredUsers}
        signInLogs={signInLogs || []}
        adminLogs={adminLogs}
        announcements={announcements || []}
        pettyCrimeReports={pettyCrimeReports || []}
        onStatCardClick={onStatCardClick}
      />

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px', 
          marginTop: '24px' 
        }}
      >
        <Section title="Incidents by Status">
          <PieChartCard data={emergencyStatusData} colorMap={STATUS_COLORS} />
        </Section>

        <Section title="Incidents by Severity">
          <PieChartCard data={emergencySeverityData} colorMap={SEVERITY_COLORS} />
        </Section>

        <Section title="Assistance Requests by Status">
          <PieChartCard data={assistanceStatusData} colorMap={STATUS_COLORS} />
        </Section>
      </div>
    </div>
  );
};

export default AdminDashboard;
