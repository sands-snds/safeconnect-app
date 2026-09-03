import React, { useState } from 'react';

const MAROON = '#6B2C3E';

const groups = [
  {
    id: 'residents',
    label: 'Residents',
    icon: 'bi-house-door-fill',
    accent: MAROON,
    features: [
      { icon: 'bi-exclamation-triangle-fill', label: 'Report Emergencies',  desc: 'Fire, flood, medical emergencies with GPS and photo/video.' },
      { icon: 'bi-life-preserver',            label: 'Request Assistance',  desc: 'Ask for food, shelter, or medical support during disasters.' },
      { icon: 'bi-eye-fill',                  label: 'Report Petty Crimes', desc: 'Flag theft, vandalism, or local disturbances quickly.' },
      { icon: 'bi-megaphone-fill',            label: 'View Announcements',  desc: 'Real-time barangay advisories and community updates.' },
      { icon: 'bi-cloud-sun-fill',            label: 'Weather Updates',     desc: 'Live local weather directly on your dashboard.' },
      { icon: 'bi-person-gear',               label: 'Manage Profile',      desc: 'Update photo, username, and password anytime.' },
    ],
  },
  {
    id: 'admins',
    label: 'Barangay Admins',
    icon: 'bi-shield-lock-fill',
    accent: '#1d4ed8',
    features: [
      { icon: 'bi-speedometer2',   label: 'Live Dashboard',    desc: 'All reports, stats, and urgent alerts in one place.' },
      { icon: 'bi-card-checklist', label: 'Report Management', desc: 'Update statuses and respond to all report types.' },
      { icon: 'bi-newspaper',      label: 'Announcements',     desc: 'Publish news with images and external link previews.' },
      { icon: 'bi-people-fill',    label: 'User Management',   desc: 'Activate, suspend, and manage resident accounts.' },
      { icon: 'bi-journal-text',   label: 'Activity Logs',     desc: 'Full audit trail of sign-ins and admin actions.' },
      { icon: 'bi-download',       label: 'Data Export',       desc: 'Export reports as Excel or PDF for documentation.' },
    ],
  },
];

function Services() {
  const [active, setActive] = useState('residents');
  const group = groups.find(g => g.id === active);

  return (
    <section id="services" style={{ margin: 0, padding: '80px 0', background: '#fff' }}>
      <div className="container" style={{ padding: '0 24px' }}>

        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fdf0f3', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: MAROON }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MAROON }}>Platform Features</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#111', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Everything your role needs,<br />in one place.
          </h2>
          <p style={{ margin: '0 auto', color: '#888', fontSize: '0.95rem', maxWidth: '420px', lineHeight: '1.7' }}>
            Select your role to explore the tools built specifically for you.
          </p>
        </div>

        {/* tab pills */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', background: '#f4f4f5', borderRadius: '14px', padding: '5px', gap: '4px' }}>
            {groups.map(g => {
              const on = active === g.id;
              return (
                <button key={g.id} onClick={() => setActive(g.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: on ? g.accent : 'transparent',
                  color: on ? '#fff' : '#666',
                  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                  boxShadow: on ? `0 4px 14px ${g.accent}40` : 'none',
                  transition: 'all 0.22s',
                }}>
                  <i className={`bi ${g.icon}`} />
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* feature cards */}
        <div className="row g-3">
          {group.features.map((f, i) => (
            <div key={f.label} className="col-12 col-sm-6 col-lg-4">
              <div style={{
                position: 'relative', borderRadius: '18px',
                border: '1.5px solid #f0f0f0', padding: '24px',
                height: '100%', background: '#fff', overflow: 'hidden',
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 12px 40px ${group.accent}18`;
                  e.currentTarget.style.borderColor = `${group.accent}40`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* bg number */}
                <span style={{
                  position: 'absolute', bottom: '-8px', right: '14px',
                  fontSize: '5rem', fontWeight: 900, color: '#f5f5f5',
                  lineHeight: 1, userSelect: 'none', letterSpacing: '-0.04em',
                  pointerEvents: 'none',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${group.accent}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <i className={`bi ${f.icon}`} style={{ color: group.accent, fontSize: '18px' }} />
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '0.92rem', color: '#111' }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: '0.81rem', color: '#888', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Services;