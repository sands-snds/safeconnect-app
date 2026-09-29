import React from 'react';

const FEATURES = [
  { icon: 'bi-exclamation-octagon-fill', label: 'Emergency Reports',   color: '#ef4444', desc: 'Report fires, floods, or any life-threatening situation happening right now.' },
  { icon: 'bi-hand-heart-fill',          label: 'Assistance Requests', color: '#f97316', desc: 'Request rescue, relief goods, or support during or after a disaster.' },
  { icon: 'bi-eye-slash-fill',           label: 'Crime Reports',       color: '#8b5cf6', desc: 'Report theft, vandalism, or suspicious activity in your area.' },
  { icon: 'bi-megaphone-fill',           label: 'Announcements',       color: '#0ea5e9', desc: 'Read the latest barangay alerts, updates, and community news.' },
  { icon: 'bi-cloud-lightning-rain-fill',label: 'Live Weather',        color: '#14b8a6', desc: 'Check real-time weather conditions before heading out.' },
  { icon: 'bi-person-badge-fill',        label: 'Your Profile',        color: '#6366f1', desc: 'Manage your name, photo, and account password anytime.' },
];

export default function Services() {
  return (
    <section id="services" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .svc-outer { padding: 90px 0; background: #faf8f9; }
        .svc-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }

        .svc-intro { max-width: 620px; margin: 0 auto 56px; text-align: center; }
        .svc-intro h2 { margin: 0 0 16px; font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; color: #111; line-height: 1.15; letter-spacing: -0.02em; }
        .svc-intro p { margin: 0; color: #888; line-height: 1.75; font-size: 1rem; }

        .svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 768px) { .svc-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .svc-grid { grid-template-columns: 1fr; } }

        .svc-item { border-radius: 20px; padding: 28px; background: #fff; border: 1.5px solid #f0f0f0; transition: all 0.22s; }
        .svc-item:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-4px); border-color: #e0e0e0; }
        .svc-dot { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .svc-item h3 { margin: 0 0 6px; font-weight: 800; font-size: 0.95rem; color: #111; }
        .svc-item p { margin: 0; font-size: 0.82rem; color: #888; line-height: 1.65; }
      `}</style>
      <div className="svc-outer">
        <div className="container">

          <div className="svc-intro">
            <div className="svc-badge" style={{ margin: '0 auto 18px' }}>
              <i className="bi bi-stars" /> What You Can Do
            </div>
            <h2>Everything you need, in one place.</h2>
            <p>
              From reporting an emergency to checking the weather — here's what's waiting for
              you the moment you sign in.
            </p>
          </div>

          <div className="svc-grid">
            {FEATURES.map(item => (
              <div key={item.label} className="svc-item">
                <div className="svc-dot" style={{ background: item.color + '18' }}>
                  <i className={`bi ${item.icon}`} style={{ fontSize: 22, color: item.color }} />
                </div>
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
