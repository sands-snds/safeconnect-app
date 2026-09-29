import React from 'react';

const STEPS = [
  {
    icon: 'bi-send-fill',
    title: 'Submit a report',
    body: 'Open SafeConnect and report an emergency, request assistance, or flag a petty crime — your location and photos are attached automatically.'
  },
  {
    icon: 'bi-bell-fill',
    title: 'Your barangay responds',
    body: 'Your report reaches the barangay response team the moment you send it, any hour of the day.'
  },
  {
    icon: 'bi-check-circle-fill',
    title: 'Stay updated',
    body: 'Follow your report in real time — from received, to in progress, to resolved.'
  },
];

export default function About() {
  return (
    <section id="about" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .ab-outer { padding: 90px 0; background: #fff; }
        .ab-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }

        .ab-intro { max-width: 620px; margin: 0 auto 72px; text-align: center; }
        .ab-intro h2 { margin: 0 0 16px; font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; color: #111; line-height: 1.15; letter-spacing: -0.02em; }
        .ab-intro p { margin: 0; color: #888; line-height: 1.75; font-size: 1rem; }

        .ab-timeline { display: flex; justify-content: space-between; position: relative; max-width: 900px; margin: 0 auto; }
        .ab-timeline::before { content: ''; position: absolute; top: 26px; left: 60px; right: 60px; height: 2px; background: #f0e4e7; }
        @media (max-width: 820px) {
          .ab-timeline { flex-direction: column; gap: 36px; }
          .ab-timeline::before { display: none; }
        }

        .ab-step { flex: 1; text-align: center; padding: 0 16px; position: relative; }
        @media (max-width: 820px) {
          .ab-step { text-align: left; display: flex; gap: 18px; align-items: flex-start; padding: 0; }
        }

        .ab-step-icon { width: 52px; height: 52px; border-radius: 50%; background: #6B2C3E; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 18px; position: relative; z-index: 1; box-shadow: 0 0 0 6px #fff; flex-shrink: 0; }
        @media (max-width: 820px) {
          .ab-step-icon { margin: 0; }
        }

        .ab-step h3 { margin: 0 0 8px; font-size: 1rem; font-weight: 800; color: #111; }
        .ab-step p { margin: 0; font-size: 0.86rem; color: #888; line-height: 1.65; }
      `}</style>
      <div className="ab-outer">
        <div className="container">

          <div className="ab-intro">
            <div className="ab-badge" style={{ margin: '0 auto 18px' }}>
              <i className="bi bi-info-circle-fill" /> About SafeConnect
            </div>
            <h2>One app. A safer Barangay Santa Fe.</h2>
            <p>
              SafeConnect connects every resident directly to the barangay's emergency response
              team — report incidents, request help, and stay informed, all in one place.
            </p>
          </div>

          <div className="ab-timeline">
            {STEPS.map((step) => (
              <div key={step.title} className="ab-step">
                <div className="ab-step-icon">
                  <i className={`bi ${step.icon}`} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
