import React, { useState } from 'react';

const residents = [
  { icon: 'bi-exclamation-octagon-fill', label: 'Emergency Reports',   color: '#ef4444', desc: 'Report fires, floods, or any life-threatening situation happening right now.' },
  { icon: 'bi-hand-heart-fill',          label: 'Assistance Requests', color: '#f97316', desc: 'Request rescue, relief goods, or support during or after a disaster.' },
  { icon: 'bi-eye-slash-fill',           label: 'Crime Reports',       color: '#8b5cf6', desc: 'Report theft, vandalism, or suspicious activity in your area.' },
  { icon: 'bi-megaphone-fill',           label: 'Announcements',       color: '#0ea5e9', desc: 'Read the latest barangay alerts, updates, and community news.' },
  { icon: 'bi-cloud-lightning-rain-fill',label: 'Live Weather',        color: '#14b8a6', desc: 'Check real-time weather conditions before heading out.' },
  { icon: 'bi-person-badge-fill',        label: 'Your Profile',        color: '#6366f1', desc: 'Manage your name, photo, and account password anytime.' },
];

const admins = [
  { icon: 'bi-graph-up-arrow',    label: 'Dashboard',        color: '#ef4444', desc: 'See all reports, status counts, and critical alerts the moment they arrive.' },
  { icon: 'bi-clipboard2-pulse',  label: 'Manage Reports',   color: '#f97316', desc: 'Open, assign, update, and close incoming reports from one screen.' },
  { icon: 'bi-send-fill',         label: 'Post Announcements', color: '#0ea5e9', desc: 'Publish barangay news with photos and source links in seconds.' },
  { icon: 'bi-person-lines-fill', label: 'Resident Accounts', color: '#8b5cf6', desc: 'View, activate, or suspend resident accounts as needed.' },
  { icon: 'bi-clock-history',     label: 'Activity Logs',    color: '#14b8a6', desc: 'Review a full record of every login and admin action taken.' },
  { icon: 'bi-file-earmark-arrow-down-fill', label: 'Export Data', color: '#6366f1', desc: 'Download reports as Excel or PDF for offline use and records.' },
];

export default function Services() {
  const [tab, setTab] = useState('residents');
  const items = tab === 'residents' ? residents : admins;

  return (
    <section id="services" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .svc-outer { padding: 90px 0; background: #fff; }
        .svc-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }
        .svc-toggle { display: inline-flex; background: #f4f4f6; border-radius: 14px; padding: 5px; gap: 4px; margin-bottom: 48px; }
        .svc-toggle-btn { padding: 10px 28px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.87rem; cursor: pointer; transition: all 0.2s; background: transparent; color: #888; }
        .svc-toggle-btn.active { background: #6B2C3E; color: #fff; box-shadow: 0 4px 16px rgba(107,44,62,0.3); }
        .svc-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media(max-width:768px){ .svc-grid{ grid-template-columns: repeat(2,1fr); } }
        @media(max-width:480px){ .svc-grid{ grid-template-columns: 1fr; } }
        .svc-item { border-radius: 20px; padding: 28px 24px; background: #fafafa; border: 1.5px solid #f0f0f0; transition: all 0.22s; cursor: default; }
        .svc-item:hover { background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-4px); border-color: #e0e0e0; }
        .svc-dot { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
      `}</style>
      <div className="svc-outer">
        <div className="container">

          <div className="svc-badge">
            <i className="bi bi-stars" /> What SafeConnect offers
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 40 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900, color: '#111', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              One platform.<br />Every tool you need.
            </h2>
            <p style={{ margin: 0, maxWidth: 340, color: '#888', lineHeight: 1.75, fontSize: '0.93rem' }}>
              Whether you're a resident staying safe or an admin keeping the barangay running — SafeConnect has exactly what you need.
            </p>
          </div>

          <div style={{ display: 'flex' }}>
            <div className="svc-toggle">
              {['residents','admins'].map(t => (
                <button key={t} className={`svc-toggle-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
                  <i className={`bi ${t==='residents'?'bi-house-door-fill':'bi-shield-lock-fill'} me-2`} />
                  {t === 'residents' ? 'For Residents' : 'For Admins'}
                </button>
              ))}
            </div>
          </div>

          <div className="svc-grid">
            {items.map(item => (
              <div key={item.label} className="svc-item">
                <div className="svc-dot" style={{ background: item.color + '18' }}>
                  <i className={`bi ${item.icon}`} style={{ fontSize: 22, color: item.color }} />
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '0.95rem', color: '#111' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#888', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}