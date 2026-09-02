import React from 'react';

const MAROON = '#6B2C3E';
const MAROON_LIGHT = '#f5eaed';

const stats = [
  { value: '24/7', label: 'Emergency response' },
  { value: '3',   label: 'Report types supported' },
  { value: '1',   label: 'Unified platform' },
];

const roles = [
  {
    id: 1,
    title: 'Residents',
    icon: 'bi-house-door-fill',
    description: 'Community members of Barangay Santa Fe who can register, submit reports, request assistance, and stay informed.',
    items: [
      { icon: 'bi-exclamation-triangle-fill', text: 'Submit emergency reports' },
      { icon: 'bi-life-preserver',            text: 'Request assistance' },
      { icon: 'bi-eye-fill',                  text: 'Report petty crimes' },
      { icon: 'bi-megaphone-fill',            text: 'View announcements & alerts' },
      { icon: 'bi-person-gear',              text: 'Manage personal profile' },
    ],
  },
  {
    id: 2,
    title: 'Barangay Admins',
    icon: 'bi-shield-lock-fill',
    description: 'Authorized barangay officials who manage all reports, publish announcements, and oversee system activity.',
    items: [
      { icon: 'bi-speedometer2',   text: 'Monitor live dashboard' },
      { icon: 'bi-card-checklist', text: 'Manage all report types' },
      { icon: 'bi-newspaper',      text: 'Publish announcements' },
      { icon: 'bi-people-fill',    text: 'Manage registered users' },
      { icon: 'bi-journal-text',   text: 'Review sign-in & admin logs' },
    ],
  },
];

function About() {
  return (
    <section id="about" style={{ background: '#fafafa', padding: '60px 0' }}>
      <div className="container">

        {/* ── header ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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
            Who we are
          </span>
          <h2 style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#111' }}>
            About SafeConnect
          </h2>
          <p style={{ margin: '0 auto', fontSize: '0.9rem', color: '#777', maxWidth: '480px', lineHeight: '1.65' }}>
            A web-based disaster response system built for <strong style={{ color: '#333' }}>Barangay Santa Fe,
            Dasmariñas, Cavite</strong> — connecting residents and administrators when it matters most.
          </p>
        </div>

        {/* ── stats row ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          marginBottom: '36px',
          background: MAROON,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              flex: 1,
              textAlign: 'center',
              padding: '20px 16px',
              borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
            }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1.6rem', color: '#fff' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── mission + vision side by side ── */}
        <div className="row g-3" style={{ marginBottom: '32px' }}>
          {[
            {
              icon: 'bi-bullseye',
              label: 'Our Mission',
              text: 'To empower Barangay Santa Fe residents with a reliable platform for reporting emergencies, requesting help, and receiving real-time updates — ensuring no call for assistance goes unanswered.',
            },
            {
              icon: 'bi-eye-fill',
              label: 'Our Vision',
              text: 'A fully connected community where technology closes the gap between danger and help, and every resident has a direct line to the people who can protect them.',
            },
          ].map(card => (
            <div key={card.label} className="col-12 col-md-6">
              <div style={{
                background: '#fff',
                border: '1.5px solid #ede4e7',
                borderRadius: '12px',
                padding: '20px',
                height: '100%',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '9px',
                  background: MAROON, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${card.icon}`} style={{ color: '#fff', fontSize: '17px' }} />
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '0.95rem', color: MAROON }}>
                    {card.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#555', lineHeight: '1.6' }}>
                    {card.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── section label ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#ede4e7' }} />
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            Who uses SafeConnect
          </p>
          <div style={{ flex: 1, height: '1px', background: '#ede4e7' }} />
        </div>

        {/* ── role cards ── */}
        <div className="row g-3">
          {roles.map(role => (
            <div key={role.id} className="col-12 col-md-6">
              <div style={{
                background: '#fff',
                border: '1.5px solid #ede4e7',
                borderRadius: '12px',
                overflow: 'hidden',
                height: '100%',
              }}>
                {/* card top bar */}
                <div style={{
                  background: MAROON,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={`bi ${role.icon}`} style={{ color: '#fff', fontSize: '15px' }} />
                  </div>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    {role.title}
                  </p>
                </div>

                {/* card body */}
                <div style={{ padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '0.83rem', color: '#666', lineHeight: '1.58' }}>
                    {role.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {role.items.map(item => (
                      <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '6px',
                          background: MAROON_LIGHT, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`bi ${item.icon}`} style={{ color: MAROON, fontSize: '12px' }} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.83rem', color: '#333' }}>{item.text}</p>
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