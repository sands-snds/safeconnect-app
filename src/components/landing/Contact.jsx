import React from 'react';

const MAROON = '#6B2C3E';

const contacts = [
  {
    id: 1,
    title: 'Barangay Santa Fe',
    subtitle: 'Barangay Emergency Line',
    icon: 'bi-house-fill',
    phone: '+63 992 947 4309',
    accent: MAROON,
    desc: 'Direct line to the Barangay Santa Fe office for emergencies and coordination.',
  },
  {
    id: 2,
    title: '911 Emergency',
    subtitle: 'National Emergency Hotline',
    icon: 'bi-shield-fill-exclamation',
    phone: '911',
    accent: '#dc2626',
    desc: 'Immediate national response for life-threatening incidents — police, fire, or medical.',
  },
  {
    id: 3,
    title: 'Dasmariñas PNP',
    subtitle: 'Dasmariñas City Police',
    icon: 'bi-shield-fill',
    phone: '+63 46 242 0002',
    accent: '#1d4ed8',
    desc: 'Law enforcement and public safety concerns within Dasmariñas City.',
  },
  {
    id: 4,
    title: 'CDRMC',
    subtitle: 'Cavite Disaster Risk Mgmt.',
    icon: 'bi-heart-pulse-fill',
    phone: '+63 46 230 0345',
    accent: '#059669',
    desc: 'Provincial office for coordinated disaster response across Cavite.',
  },
];

function Contact() {
  return (
    <section id="contact" style={{ margin: 0, padding: '80px 0', background: '#fafafa' }}>
      <div className="container" style={{ padding: '0 24px' }}>

        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fdf0f3', borderRadius: '20px', padding: '6px 16px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: MAROON }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MAROON }}>Emergency Contacts</span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#111', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Help is always<br />one call away.
          </h2>
          <p style={{ margin: '0 auto', color: '#888', fontSize: '0.95rem', maxWidth: '400px', lineHeight: '1.7' }}>
            Save these numbers or tap the call button on this page to reach them instantly.
          </p>
        </div>

        {/* contact cards */}
        <div className="row g-3" style={{ marginBottom: '24px' }}>
          {contacts.map(c => (
            <div key={c.id} className="col-12 col-sm-6 col-lg-3">
              <div style={{
                borderRadius: '20px', background: '#fff',
                border: '1.5px solid #efefef',
                overflow: 'hidden', height: '100%',
                display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 16px 48px ${c.accent}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* gradient top */}
                <div style={{
                  padding: '28px 20px 24px',
                  background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accent}cc 100%)`,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <i className={`bi ${c.icon}`} style={{ color: '#fff', fontSize: '24px' }} />
                  </div>
                  <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.97rem', color: '#fff' }}>{c.title}</p>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255,255,255,0.78)' }}>{c.subtitle}</p>
                </div>

                {/* body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ margin: '0 0 16px', fontSize: '0.81rem', color: '#777', lineHeight: '1.6', flex: 1 }}>
                    {c.desc}
                  </p>

                  {/* phone chip */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: `${c.accent}0f`, borderRadius: '10px',
                    padding: '10px 12px', marginBottom: '12px',
                  }}>
                    <i className="bi bi-telephone-fill" style={{ color: c.accent, fontSize: '13px', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone</p>
                      <p style={{ margin: 0, fontWeight: 800, color: '#111', fontSize: '0.9rem' }}>{c.phone}</p>
                    </div>
                    <span style={{
                      marginLeft: 'auto', background: `${c.accent}18`, color: c.accent,
                      fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: '20px', flexShrink: 0,
                    }}>24/7</span>
                  </div>

                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '7px', padding: '11px', borderRadius: '10px',
                    background: c.accent, color: '#fff',
                    fontWeight: 700, fontSize: '0.86rem', textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="bi bi-telephone-fill" style={{ fontSize: '13px' }} />
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* bottom banner */}
        <div style={{
          borderRadius: '18px',
          background: `linear-gradient(135deg, ${MAROON} 0%, #9b2335 100%)`,
          padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.15)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-laptop" style={{ color: '#fff', fontSize: '20px' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#fff', fontSize: '0.97rem' }}>
              Already a resident? Report directly through SafeConnect.
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.83rem', lineHeight: '1.6' }}>
              Submit emergency reports, assistance requests, and petty crime reports — with GPS and media automatically captured.
            </p>
          </div>
          <a href="#home" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '10px',
            background: '#fff', color: MAROON,
            fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
            flexShrink: 0, transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign In to Report
            <i className="bi bi-arrow-right" />
          </a>
        </div>

      </div>
    </section>
  );
}

export default Contact;