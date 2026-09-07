import React from 'react';

const STEPS = [
  { n:'01', icon:'bi-person-raise-hand',       title:'Resident submits a report',    body:'A community member opens SafeConnect and submits an emergency report, assistance request, or petty crime report — with GPS location and media attached.',  color:'#6B2C3E' },
  { n:'02', icon:'bi-bell-fill',               title:'Admin sees it instantly',      body:'The barangay admin receives the report on the live dashboard the moment it is submitted. Every detail — type, location, severity — is right there.',          color:'#f97316' },
  { n:'03', icon:'bi-arrow-repeat',            title:'Status is updated',            body:'The admin acts on the report, updates the status (Dispatched, In Progress, Resolved), and the resident can see the update in real time.',                    color:'#3b82f6' },
  { n:'04', icon:'bi-patch-check-fill',        title:'Community stays safe',         body:'The incident is resolved and logged. The barangay has a full record of every event, every action, and every outcome — ready for review anytime.',             color:'#10b981' },
];

const RESIDENTS = [
  { icon:'bi-exclamation-octagon-fill', label:'Emergency Reports',    color:'#ef4444' },
  { icon:'bi-hand-heart-fill',          label:'Assistance Requests',  color:'#f97316' },
  { icon:'bi-eye-slash-fill',           label:'Crime Reports',        color:'#8b5cf6' },
  { icon:'bi-megaphone-fill',           label:'Announcements',        color:'#0ea5e9' },
  { icon:'bi-cloud-lightning-rain-fill',label:'Live Weather',         color:'#14b8a6' },
  { icon:'bi-person-badge-fill',        label:'Profile Settings',     color:'#6366f1' },
];

const ADMINS = [
  { icon:'bi-graph-up-arrow',           label:'Live Dashboard',       color:'#ef4444' },
  { icon:'bi-clipboard2-pulse',         label:'Report Management',    color:'#f97316' },
  { icon:'bi-send-fill',                label:'Announcements',        color:'#0ea5e9' },
  { icon:'bi-person-lines-fill',        label:'User Management',      color:'#8b5cf6' },
  { icon:'bi-clock-history',            label:'Activity Logs',        color:'#14b8a6' },
  { icon:'bi-file-earmark-arrow-down-fill', label:'Data Export',     color:'#6366f1' },
];

export default function About() {
  return (
    <section id="about" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .ab-outer { padding: 90px 0; background: #fff; }
        .ab-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }
        .ab-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; position: relative; margin-bottom: 72px; }
        @media(max-width:900px){ .ab-steps{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:500px){ .ab-steps{ grid-template-columns:1fr; } }
        .ab-step { padding: 32px 24px; position: relative; }
        .ab-step:not(:last-child)::after { content:''; position:absolute; top:52px; right:0; width:1px; height:60px; background:#efefef; }
        @media(max-width:900px){ .ab-step:nth-child(2)::after,.ab-step:nth-child(4)::after{ display:none; } }
        @media(max-width:500px){ .ab-step::after{ display:none; } }
        .ab-num { font-size: 3.5rem; font-weight: 900; line-height: 1; letter-spacing: -0.04em; margin-bottom: 10px; }
        .ab-roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media(max-width:768px){ .ab-roles-grid{ grid-template-columns:1fr; } }
        .ab-role-box { border-radius: 20px; overflow: hidden; border: 1.5px solid #f0f0f0; }
        .ab-role-head { padding: 20px 24px; display: flex; align-items: center; gap: 14px; }
        .ab-role-body { padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #fafafa; }
        @media(max-width:480px){ .ab-role-body{ grid-template-columns:1fr; } }
        .ab-feat { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border-radius: 10px; border: 1px solid #f0f0f0; }
      `}</style>
      <div className="ab-outer">
        <div className="container">

          {/* badge */}
          <div className="ab-badge">
            <i className="bi bi-info-circle-fill" /> About SafeConnect
          </div>

          {/* headline */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:24, marginBottom:56 }}>
            <h2 style={{ margin:0, fontSize:'clamp(1.8rem,3.5vw,2.6rem)', fontWeight:900, color:'#111', lineHeight:1.15, letterSpacing:'-0.02em' }}>
              Built for Barangay Santa Fe.<br />Ready when you need it most.
            </h2>
            <div style={{ maxWidth:360 }}>
              <p style={{ margin:'0 0 16px', color:'#888', lineHeight:1.75, fontSize:'0.93rem' }}>
                SafeConnect is a web-based disaster response platform connecting residents and barangay administrators in Dasmariñas, Cavite.
              </p>
              <div style={{ display:'flex', gap:24 }}>
                {[{n:'24/7',l:'Always on'},{n:'3',l:'Report types'},{n:'2',l:'User roles'}].map(s=>(
                  <div key={s.l}>
                    <p style={{ margin:0, fontWeight:900, fontSize:'1.6rem', color:'#6B2C3E', lineHeight:1 }}>{s.n}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'#aaa' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* divider label */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:'0.78rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#bbb', whiteSpace:'nowrap' }}>How it works</p>
            <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
          </div>

          {/* steps */}
          <div className="ab-steps" style={{ border:'1.5px solid #f0f0f0', borderRadius:20, marginBottom:72, overflow:'hidden' }}>
            {STEPS.map((step,i) => (
              <div key={step.n} className="ab-step" style={{ background: i%2===0?'#fff':'#fafafa' }}>
                <p className="ab-num" style={{ color: step.color + '30' }}>{step.n}</p>
                <div style={{ width:38, height:38, borderRadius:10, background:step.color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <i className={`bi ${step.icon}`} style={{ color:step.color, fontSize:16 }} />
                </div>
                <p style={{ margin:'0 0 6px', fontWeight:800, fontSize:'0.9rem', color:'#111' }}>{step.title}</p>
                <p style={{ margin:0, fontSize:'0.79rem', color:'#aaa', lineHeight:1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>

          {/* who uses it */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:'0.78rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#bbb', whiteSpace:'nowrap' }}>Who uses it</p>
            <div style={{ flex:1, height:1, background:'#f0f0f0' }} />
          </div>

          <div className="ab-roles-grid">
            {/* residents */}
            <div className="ab-role-box">
              <div className="ab-role-head" style={{ background:'#6B2C3E' }}>
                <div style={{ width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <i className="bi bi-house-door-fill" style={{ color:'#fff',fontSize:18 }} />
                </div>
                <div>
                  <p style={{ margin:0,fontWeight:800,color:'#fff',fontSize:'1rem' }}>Residents</p>
                  <p style={{ margin:0,fontSize:'0.75rem',color:'rgba(255,255,255,0.7)' }}>Community members of Barangay Santa Fe</p>
                </div>
              </div>
              <div className="ab-role-body">
                {RESIDENTS.map(f=>(
                  <div key={f.label} className="ab-feat">
                    <i className={`bi ${f.icon}`} style={{ color:f.color,fontSize:15,flexShrink:0 }} />
                    <p style={{ margin:0,fontSize:'0.8rem',fontWeight:600,color:'#333' }}>{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* admins */}
            <div className="ab-role-box">
              <div className="ab-role-head" style={{ background:'#1d4ed8' }}>
                <div style={{ width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <i className="bi bi-shield-lock-fill" style={{ color:'#fff',fontSize:18 }} />
                </div>
                <div>
                  <p style={{ margin:0,fontWeight:800,color:'#fff',fontSize:'1rem' }}>Barangay Admins</p>
                  <p style={{ margin:0,fontSize:'0.75rem',color:'rgba(255,255,255,0.7)' }}>Authorized barangay officials</p>
                </div>
              </div>
              <div className="ab-role-body">
                {ADMINS.map(f=>(
                  <div key={f.label} className="ab-feat">
                    <i className={`bi ${f.icon}`} style={{ color:f.color,fontSize:15,flexShrink:0 }} />
                    <p style={{ margin:0,fontSize:'0.8rem',fontWeight:600,color:'#333' }}>{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}