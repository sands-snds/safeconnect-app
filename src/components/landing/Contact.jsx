import React from 'react';

const HOTLINES = [
  { title: 'Barangay Santa Fe', sub: 'Primary line', phone: '+63 992 947 4309', icon: 'bi-house-fill',              color: '#6B2C3E', note: 'Emergencies, coordination & general inquiries' },
  { title: '911',               sub: 'National hotline', phone: '911',           icon: 'bi-telephone-outbound-fill', color: '#ef4444', note: 'Police, fire, and medical — nationwide response' },
  { title: 'Dasmariñas PNP',   sub: 'City police',   phone: '+63 46 242 0002',  icon: 'bi-shield-fill',             color: '#3b82f6', note: 'Crime, public safety & law enforcement' },
  { title: 'CDRMC Cavite',     sub: 'Disaster mgmt', phone: '+63 46 230 0345',  icon: 'bi-heart-pulse-fill',        color: '#10b981', note: 'Provincial disaster risk management & response' },
];

export default function Contact() {
  return (
    <section id="contact" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .ct-outer { padding: 90px 0; background: #faf8f9; }
        .ct-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }
        .ct-row { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; margin-bottom: 24px; }
        @media(max-width:768px){ .ct-row{ grid-template-columns:1fr; } }
        .ct-card { background: #fff; border-radius: 20px; padding: 24px; display: flex; gap: 18px; align-items: flex-start; border: 1.5px solid #f0f0f0; transition: box-shadow 0.2s, transform 0.2s; }
        .ct-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-3px); }
        .ct-icon-wrap { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ct-call { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 30px; font-weight: 700; font-size: 0.8rem; text-decoration: none; margin-top: 12px; transition: opacity 0.15s; }
        .ct-call:hover { opacity: 0.8; }
        .ct-banner { border-radius: 20px; padding: 28px 32px; background: #6B2C3E; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
      `}</style>
      <div className="ct-outer">
        <div className="container">

          <div className="ct-badge">
            <i className="bi bi-telephone-fill" /> Emergency Contacts
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 40 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, color: '#111', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Help is always<br />one call away.
            </h2>
            <p style={{ margin: 0, maxWidth: 340, color: '#888', lineHeight: 1.75, fontSize: '0.93rem' }}>
              Save these numbers now. In an emergency, every second counts. You can also tap the floating call button anywhere on this page.
            </p>
          </div>

          <div className="ct-row">
            {HOTLINES.map(h => (
              <div key={h.title} className="ct-card">
                <div className="ct-icon-wrap" style={{ background: h.color + '15' }}>
                  <i className={`bi ${h.icon}`} style={{ fontSize: 24, color: h.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#111' }}>{h.title}</p>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: h.color, background: h.color+'15', padding: '2px 10px', borderRadius: 20 }}>{h.sub}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6 }}>{h.note}</p>
                  <a href={`tel:${h.phone.replace(/\s/g,'')}`} className="ct-call" style={{ background: h.color, color: '#fff' }}>
                    <i className="bi bi-telephone-fill" style={{ fontSize: 11 }} />
                    {h.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="ct-banner">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bi bi-phone-fill" style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Signed in? Report through SafeConnect.</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem', lineHeight: 1.65 }}>Submit emergency reports, assistance requests, and petty crime reports — GPS and photos captured automatically.</p>
            </div>
            <a href="#home" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#fff', color: '#6B2C3E', fontWeight: 800, fontSize: '0.87rem', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Open SafeConnect <i className="bi bi-arrow-right" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}