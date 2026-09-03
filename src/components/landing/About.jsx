import React from 'react';

const MAROON = '#6B2C3E';

const roles = [
  {
    title: 'Residents',
    icon: 'bi-house-door-fill',
    tagline: 'Community members of Barangay Santa Fe',
    accent: MAROON,
    features: [
      { icon: 'bi-exclamation-triangle-fill', label: 'Report Emergencies',   desc: 'Fire, flood, medical, and other life-threatening incidents' },
      { icon: 'bi-life-preserver',            label: 'Request Assistance',   desc: 'Food, shelter, medical supplies, and disaster support' },
      { icon: 'bi-eye-fill',                  label: 'Report Petty Crimes',  desc: 'Theft, vandalism, and local disturbances' },
      { icon: 'bi-megaphone-fill',            label: 'View Announcements',   desc: 'Real-time barangay news and advisories' },
      { icon: 'bi-cloud-sun-fill',            label: 'Weather Updates',      desc: 'Live local weather from the dashboard' },
      { icon: 'bi-person-gear',               label: 'Manage Profile',       desc: 'Photo, username, and password settings' },
    ],
  },
  {
    title: 'Barangay Admins',
    icon: 'bi-shield-lock-fill',
    tagline: 'Authorized barangay officials',
    accent: '#1d4ed8',
    features: [
      { icon: 'bi-speedometer2',   label: 'Live Dashboard',     desc: 'All reports, stats, and alerts in one view' },
      { icon: 'bi-card-checklist', label: 'Report Management',  desc: 'Update statuses across all report types' },
      { icon: 'bi-newspaper',      label: 'Announcements',      desc: 'Publish news with images and link previews' },
      { icon: 'bi-people-fill',    label: 'User Management',    desc: 'Activate, suspend, and manage accounts' },
      { icon: 'bi-journal-text',   label: 'Activity Logs',      desc: 'Full audit trail of sign-ins and admin actions' },
      { icon: 'bi-download',       label: 'Data Export',        desc: 'Export reports as Excel or PDF' },
    ],
  },
];

function About() {
  return (
    <section id="about" style={{ margin: 0, padding: '80px 0', background: '#fff' }}>
      <div className="container" style={{ padding: '0 24px' }}>

        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fdf0f3', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: MAROON }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MAROON }}>About SafeConnect</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#111', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Connecting communities.<br />Saving lives.
          </h2>
          <p style={{ margin: '0 auto', color: '#888', fontSize: '0.95rem', maxWidth: '460px', lineHeight: '1.7' }}>
            A web-based disaster response system built for <strong style={{ color: '#444' }}>Barangay Santa Fe, Dasmariñas, Cavite</strong> — so the right help reaches the right people, fast.
          </p>
        </div>

        {/* mission + vision */}
        <div className="row g-3" style={{ marginBottom: '48px' }}>
          <div className="col-md-6">
            <div style={{
              borderRadius: '20px', height: '100%', overflow: 'hidden',
              background: `linear-gradient(135deg, ${MAROON} 0%, #9b2335 100%)`,
              padding: '36px 32px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
              }} />
              <div style={{
                position: 'absolute', bottom: '-30px', left: '-10px',
                width: '140px', height: '140px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
              }} />
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
              }}>
                <i className="bi bi-bullseye" style={{ color: '#fff', fontSize: '20px' }} />
              </div>
              <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Our Mission</p>
              <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', lineHeight: '1.72' }}>
                To empower Barangay Santa Fe residents with a reliable, always-on platform for reporting
                emergencies, requesting help, and receiving real-time updates — ensuring no call for
                assistance ever goes unanswered.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[{ n: '24/7', l: 'Always on' }, { n: '3', l: 'Report types' }, { n: '1', l: 'Platform' }].map(s => (
                  <div key={s.l}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#fff' }}>{s.n}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div style={{
              borderRadius: '20px', height: '100%',
              border: '1.5px solid #f0f0f0', padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#fdf0f3',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-eye-fill" style={{ color: MAROON, fontSize: '20px' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: '1.1rem', color: '#111' }}>Our Vision</p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.88rem', lineHeight: '1.72' }}>
                  A fully connected community where technology closes the gap between danger and
                  help — and every resident has a direct line to the people who can protect them.
                </p>
              </div>
              {/* step list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                {['Resident reports an incident', 'Admin receives it instantly', 'Response is coordinated', 'Community stays safe'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? MAROON : '#f4f4f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: i === 0 ? '#fff' : '#999' }}>{i + 1}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.83rem', color: i === 0 ? '#111' : '#aaa', fontWeight: i === 0 ? 700 : 400 }}>{step}</p>
                    {i < 3 && <div style={{ marginLeft: 'auto', width: '1px', display: 'none' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* who uses safeconnect */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: '#111', letterSpacing: '-0.01em' }}>
            Who uses SafeConnect?
          </h3>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
            Two roles. One connected platform.
          </p>
        </div>

        <div className="row g-3">
          {roles.map(role => (
            <div key={role.title} className="col-md-6">
              <div style={{
                borderRadius: '20px', border: '1.5px solid #f0f0f0',
                overflow: 'hidden', height: '100%',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 12px 40px ${role.accent}15`;
                  e.currentTarget.style.borderColor = `${role.accent}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                {/* header */}
                <div style={{
                  padding: '20px 24px',
                  background: `${role.accent}08`,
                  borderBottom: `1.5px solid ${role.accent}18`,
                  display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '13px',
                    background: role.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 4px 14px ${role.accent}40`,
                  }}>
                    <i className={`bi ${role.icon}`} style={{ color: '#fff', fontSize: '20px' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>{role.title}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>{role.tagline}</p>
                  </div>
                </div>

                {/* features */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {role.features.map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          background: `${role.accent}10`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`bi ${f.icon}`} style={{ color: role.accent, fontSize: '14px' }} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#222' }}>{f.label}</p>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#999', lineHeight: '1.5' }}>{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default About;