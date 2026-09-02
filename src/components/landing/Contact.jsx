import React from 'react';

const MAROON      = '#6B2C3E';
const SECTION_PAD = '72px 0';
const CARD_RADIUS = '14px';

const contacts = [
  {
    id: 1,
    title: 'Barangay Santa Fe',
    subtitle: 'Barangay Emergency Line',
    icon: 'bi-house-fill',
    description: 'Direct line to the Barangay Santa Fe office for emergencies, assistance coordination, and general inquiries.',
    phone: '+63 992 947 4309',
    hours: '24/7',
    accent: MAROON,
  },
  {
    id: 2,
    title: '911 Emergency',
    subtitle: 'National Emergency Hotline',
    icon: 'bi-shield-fill-exclamation',
    description: 'For life-threatening emergencies requiring immediate national response — police, fire, or medical.',
    phone: '911',
    hours: '24/7',
    accent: '#dc2626',
  },
  {
    id: 3,
    title: 'Dasmariñas Police',
    subtitle: 'Dasmariñas City PNP',
    icon: 'bi-shield-fill',
    description: 'For law enforcement response, crime reports, and public safety concerns within Dasmariñas City.',
    phone: '+63 46 242 0002',
    hours: '24/7',
    accent: '#1d4ed8',
  },
  {
    id: 4,
    title: 'CDRMC',
    subtitle: 'Cavite Disaster Risk Mgmt.',
    icon: 'bi-heart-pulse-fill',
    description: 'Provincial disaster risk management office for coordinated disaster response across Cavite.',
    phone: '+63 46 230 0345',
    hours: '24/7',
    accent: '#059669',
  },
];

function Contact() {
  return (
    <section id="contact" style={{ background: '#fff', padding: SECTION_PAD }}>
      <div className="container">

        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: MAROON,
            margin: '0 0 10px', maxWidth: 'none',
          }}>
            Reach out
          </p>
          <h2 style={{
            fontWeight: 800, fontSize: 'clamp(1.7rem, 3.5vw, 2.3rem)',
            color: '#111', margin: '0 0 14px',
          }}>
            Emergency Contacts
          </h2>
          <div style={{
            width: '48px', height: '4px', background: MAROON,
            borderRadius: '2px', margin: '0 auto 20px',
          }} />
          <p style={{
            margin: '0 auto', color: '#666', fontSize: '0.97rem',
            lineHeight: '1.72', textAlign: 'center', maxWidth: 'none',
          }}>
            <span style={{ display: 'inline-block', maxWidth: '520px' }}>
              In an emergency, every second counts. Save these numbers — or tap the floating
              call button anywhere on the site to reach them instantly.
            </span>
          </p>
        </div>

        {/* 4 contact cards */}
        <div className="row g-3" style={{ marginBottom: '32px' }}>
          {contacts.map((c) => (
            <div key={c.id} className="col-12 col-sm-6 col-lg-3">
              <div style={{
                borderRadius: CARD_RADIUS,
                border: `1.5px solid ${c.accent}30`,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>

                {/* coloured top */}
                <div style={{
                  background: c.accent,
                  padding: '22px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${c.icon}`} style={{ color: '#fff', fontSize: '20px' }} />
                  </div>
                  <p style={{
                    margin: 0, fontWeight: 700, color: '#fff',
                    fontSize: '0.95rem', textAlign: 'center', maxWidth: 'none',
                  }}>
                    {c.title}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '0.74rem',
                    color: 'rgba(255,255,255,0.78)',
                    textAlign: 'center', maxWidth: 'none',
                  }}>
                    {c.subtitle}
                  </p>
                </div>

                {/* body */}
                <div style={{
                  padding: '18px 16px',
                  flex: 1,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <p style={{
                    color: '#555', fontSize: '0.82rem', lineHeight: '1.58',
                    margin: '0 0 14px', textAlign: 'left', maxWidth: 'none',
                  }}>
                    {c.description}
                  </p>

                  {/* phone */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <i className="bi bi-telephone-fill"
                      style={{ color: c.accent, fontSize: '12px', marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <p style={{
                        margin: 0, fontSize: '0.66rem', color: '#bbb',
                        fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.07em', maxWidth: 'none',
                      }}>Phone</p>
                      <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{
                        fontWeight: 700, color: c.accent,
                        fontSize: '0.88rem', textDecoration: 'none',
                      }}>
                        {c.phone}
                      </a>
                    </div>
                  </div>

                  {/* hours */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                    <i className="bi bi-clock-fill"
                      style={{ color: c.accent, fontSize: '12px', marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <p style={{
                        margin: 0, fontSize: '0.66rem', color: '#bbb',
                        fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.07em', maxWidth: 'none',
                      }}>Hours</p>
                      <p style={{
                        margin: 0, color: '#444', fontSize: '0.85rem',
                        fontWeight: 600, maxWidth: 'none',
                      }}>
                        {c.hours}
                      </p>
                    </div>
                  </div>

                  {/* call button pinned to bottom */}
                  <div style={{ marginTop: 'auto' }}>
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', padding: '8px 0', borderRadius: '8px',
                      background: c.accent, color: '#fff',
                      fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
                      transition: 'opacity 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.83'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <i className="bi bi-telephone-fill" style={{ fontSize: '12px' }} />
                      Call Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* bottom note — horizontal layout */}
        <div style={{
          borderRadius: CARD_RADIUS,
          background: '#fdf8f9',
          border: '1.5px solid #f0e4e8',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: MAROON, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="bi bi-laptop" style={{ color: '#fff', fontSize: '19px' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h6 style={{ fontWeight: 700, color: '#111', margin: '0 0 4px', fontSize: '0.95rem' }}>
              Report directly through SafeConnect
            </h6>
            <p style={{
              color: '#666', fontSize: '0.85rem', lineHeight: '1.62',
              margin: 0, textAlign: 'left', maxWidth: 'none',
            }}>
              Signed-in residents can submit emergency reports, assistance requests, and petty crime
              reports through the platform — with GPS location and media attachments automatically captured.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Contact;