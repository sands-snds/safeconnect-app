import React, { useState } from 'react';

const MAROON = '#6B2C3E';
const MAROON_LIGHT = '#f5eaed';

const groups = [
  {
    id: 'residents',
    icon: 'bi-house-door-fill',
    title: 'For Residents',
    subtitle: 'After signing in to your resident account',
    features: [
      { icon: 'bi-exclamation-triangle-fill', label: 'Report Emergencies',  desc: 'Submit fire, flood, medical, or life-threatening incidents with GPS location and photo or video.' },
      { icon: 'bi-life-preserver',            label: 'Request Assistance',  desc: 'Ask for food, shelter, medical supplies, or other support during and after a disaster.' },
      { icon: 'bi-eye-fill',                  label: 'Report Petty Crimes', desc: 'Flag theft, vandalism, or disturbances so the barangay can respond quickly.' },
      { icon: 'bi-megaphone-fill',            label: 'View Announcements',  desc: 'Stay informed with real-time barangay announcements, advisories, and community news.' },
      { icon: 'bi-cloud-sun-fill',            label: 'Weather Updates',     desc: 'Check live local weather conditions directly from the resident dashboard.' },
      { icon: 'bi-person-gear',              label: 'Manage Profile',      desc: 'Update your username, contact photo, and password from your settings page.' },
    ],
  },
  {
    id: 'admins',
    icon: 'bi-shield-lock-fill',
    title: 'For Barangay Admins',
    subtitle: 'On the barangay administrator dashboard',
    features: [
      { icon: 'bi-speedometer2',   label: 'Live Dashboard',    desc: 'See all incoming reports, live stats, and urgent alerts in one place.' },
      { icon: 'bi-card-checklist', label: 'Report Management', desc: 'Review, update statuses, and respond to all report types from one panel.' },
      { icon: 'bi-newspaper',      label: 'Announcements',     desc: 'Create and publish community announcements with images and link previews.' },
      { icon: 'bi-people-fill',    label: 'User Management',   desc: 'View and manage all registered residents — activate, suspend, or update statuses.' },
      { icon: 'bi-journal-text',   label: 'Activity Logs',     desc: 'Audit every sign-in attempt and admin action through dedicated log views.' },
      { icon: 'bi-download',       label: 'Data Export',       desc: 'Export report data as Excel or PDF for documentation and archiving.' },
    ],
  },
];

function Services() {
  const [activeTab, setActiveTab] = useState('residents');
  const activeGroup = groups.find(g => g.id === activeTab);

  return (
    <section id="services" style={{ background: '#fff', padding: '60px 0' }}>
      <div className="container">

        {/* ── header ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-block',
            background: MAROON_LIGHT,
            color: MAROON,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '12px',
          }}>
            What we offer
          </span>
          <h2 style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#111' }}>
            Platform Features
          </h2>
          <p style={{ margin: '0 auto', fontSize: '0.9rem', color: '#888', maxWidth: '420px', lineHeight: '1.6' }}>
            Choose a user type below to see the tools available to them.
          </p>
        </div>

        {/* ── tab switcher ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '28px',
        }}>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: activeTab === g.id ? `2px solid ${MAROON}` : '2px solid #e5e5e5',
                background: activeTab === g.id ? MAROON : '#fff',
                color: activeTab === g.id ? '#fff' : '#555',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <i className={`bi ${g.icon}`} style={{ fontSize: '15px' }} />
              {g.title}
            </button>
          ))}
        </div>

        {/* ── active group subtitle ── */}
        <p style={{
          margin: '0 0 20px',
          fontSize: '0.82rem',
          color: '#999',
          textAlign: 'center',
        }}>
          {activeGroup.subtitle}
        </p>

        {/* ── feature cards ── */}
        <div className="row g-3">
          {activeGroup.features.map(f => (
            <div key={f.label} className="col-12 col-sm-6 col-lg-4">
              <div style={{
                background: '#fff',
                border: '1.5px solid #ede4e7',
                borderRadius: '12px',
                padding: '18px',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                transition: 'box-shadow 0.18s, border-color 0.18s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,44,62,0.1)';
                  e.currentTarget.style.borderColor = '#c08090';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#ede4e7';
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '9px',
                  background: MAROON_LIGHT, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${f.icon}`} style={{ color: MAROON, fontSize: '16px' }} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>
                    {f.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#777', lineHeight: '1.55' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Services;