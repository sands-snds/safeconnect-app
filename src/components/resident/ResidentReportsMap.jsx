import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { fetchMyReports } from '../../Services/api';
import IncidentMap from '../shared/location/IncidentMap';
import { MAP_TYPES, LEGEND_TYPES, fromMyReport, isOpenStatus, timeAgo } from '../shared/location/mapReports';
import { REPORTS_CHANGED_EVENT } from './useCallAccess';

// "Your Reports on the Map", beside the list on the My Reports page (panel).
// Only the resident's own reports
// (the Privacy Policy keeps everyone else's private), each where it was
// pinned, blinking until the barangay resolves it. Reloads whenever the
// reports change (submit, edit, delete, or a status update pushed live).

export const OPEN_REPORTS_EVENT = 'safeconnect:open-my-reports';
const PHONE_QUERY = '(max-width: 767px)';
const STATUS_KEY = { Received: 'received', 'In Progress': 'inProgress', Resolved: 'resolved', Dismissed: 'dismissed' };
const STATUS_STYLE = {
  Received: { background: '#fef3c7', color: '#92400e' },
  'In Progress': { background: '#dbeafe', color: '#1e40af' },
  Resolved: { background: '#dcfce7', color: '#166534' },
  Dismissed: { background: '#fee2e2', color: '#991b1b' }
};

const currentUserId = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    return user.id ?? user.user_id ?? user.userId ?? null;
  } catch {
    return null;
  }
};

// panel: the map card alone (no section heading), for the My Reports page.
export default function ResidentReportsMap({ panel = false, height } = {}) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [phone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    const userId = currentUserId();
    if (!userId) return;
    try {
      const data = await fetchMyReports(userId);
      if (Array.isArray(data)) setReports(data.map(fromMyReport).filter((r) => !r.archived && r.status !== 'Dismissed'));
    } catch {
      // keep what is showing
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(REPORTS_CHANGED_EVENT, load);
    const tick = setInterval(() => setTick((n) => n + 1), 30000);
    return () => { window.removeEventListener(REPORTS_CHANGED_EVENT, load); clearInterval(tick); };
  }, [load]);

  // Only reports still being worked on; a resolved one leaves the map.
  const active = useMemo(() => reports.filter((r) => isOpenStatus(r.status)), [reports]);

  const typeName = (r) => t(`reportsMap.types.${r.type}`);
  const statusText = (s) => t(`reportsMap.status.${STATUS_KEY[s] || 'received'}`);
  const openInMyReports = (r) => window.dispatchEvent(new CustomEvent(OPEN_REPORTS_EVENT, { detail: { type: r.reportType, id: r.id } }));

  const renderPopup = (r) => {
    const type = MAP_TYPES[r.type] || MAP_TYPES.emergency;
    return (
      <div style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <p className="rm-pop-title"><i className={`bi ${type.icon}`} style={{ color: type.color }} aria-hidden="true" /> {typeName(r)}</p>
        <p className="rm-pop-meta">{r.reference}{r.at ? ` · ${timeAgo(r.at)}` : ''} <span className="rm-pill" style={STATUS_STYLE[r.status]}>{statusText(r.status)}</span></p>
        <p className="rm-pop-addr">{r.location}</p>
        <button type="button" className="rm-pop-btn" onClick={() => openInMyReports(r)}>{t(panel ? 'reportsMap.showInList' : 'reportsMap.openInMyReports')}</button>
      </div>
    );
  };

  const style = (
    <style>{`
        /* Padding is on .rm-outer: styles/App.css zeroes every <section>'s padding. */
        .rm-outer { padding: 64px 0 72px; background: linear-gradient(180deg, #ffffff 0%, #fbf7f8 100%); }
        .rm-inner { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
        .rm-intro { max-width: 640px; margin: 0 auto 28px; text-align: center; }
        .rm-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 14px; }
        .rm-intro h2 { margin: 0 0 10px; font-size: clamp(1.65rem, 3.4vw, 2.3rem); font-weight: 900; color: #111; line-height: 1.2; letter-spacing: -0.02em; }
        .rm-intro p { margin: 0; color: #5b6170; line-height: 1.7; font-size: 0.98rem; }
        .rm-card { background: #fff; border: 1.5px solid #f0eaec; border-radius: 22px; box-shadow: 0 10px 30px rgba(107, 44, 62, 0.07); overflow: hidden; }
        /* Legend: what each marker means, under the map */
        .rm-legend { padding: 16px 20px 18px; border-top: 1.5px solid #f0eaec; display: flex; flex-direction: column; gap: 12px; }
        .rm-legend-title { margin: 0; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B2C3E; }
        .rm-legend-items { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 16px; }
        .rm-legend-items li { display: flex; align-items: center; gap: 10px; font-size: 0.86rem; font-weight: 600; color: #1f2937; min-width: 0; }
        .rm-mk { position: relative; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--c); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
        .rm-mk.quake { border-radius: 6px; transform: rotate(45deg) scale(.9); }
        .rm-mk.quake i { transform: rotate(-45deg); }
        .rm-legend-blink { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 0.84rem; color: #4b5563; line-height: 1.45; }
        .rm-blink { position: relative; width: 26px; height: 26px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
        .rm-blink::before { content: ""; width: 12px; height: 12px; border-radius: 50%; background: #dc2626; }
        .rm-blink::after { content: ""; position: absolute; inset: 3px; border-radius: 50%; border: 2px solid #dc2626; animation: rm-ping 1.4s ease-out infinite; }
        @keyframes rm-ping { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(1.6); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .rm-blink::after { animation: none; opacity: .5; } }
        .rm-pill { display: inline-block; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
        .rm-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 18px 0 0; color: #6b7280; font-size: 0.82rem; text-align: center; }
        .rm-panel .rm-note { margin-top: 12px; }
        .rm-panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #1f2937; }
        .rm-panel-title .bi { color: #6B2C3E; }
        .rm-pop-title { margin: 0 22px 4px 0; font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
        .rm-pop-meta { margin: 0 0 8px; font-size: 12px; color: #6b7280; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
        .rm-pop-addr { margin: 0 0 10px; font-size: 12.5px; color: #374151; line-height: 1.45; }
        .rm-pop-btn { border: 1px solid #6B2C3E; background: #FDECEC; color: #6B2C3E; border-radius: 6px; padding: 6px 10px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
        @media (max-width: 767px) {
          .rm-outer { padding: 44px 0 56px; }
          .rm-intro p { font-size: 0.9rem; }
          .rm-card { border-radius: 18px; }
          .rm-legend { padding: 14px 16px 16px; }
          .rm-legend-items { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
        }
      `}</style>
  );
  const card = (
    <>
          <div className="rm-card">
            <IncidentMap
              reports={active}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              renderPopup={renderPopup}
              height={height || (phone ? 330 : 420)}
              label={t('reportsMap.mapLabel')}
            />
            <div className="rm-legend">
              <p className="rm-legend-title" id="rm-legend-title">{t('reportsMap.legendTitle')}</p>
              <ul className="rm-legend-items" aria-labelledby="rm-legend-title">
                {LEGEND_TYPES.map((k) => (
                  <li key={k}>
                    <span className={`rm-mk ${k}`} style={{ '--c': MAP_TYPES[k].color }} aria-hidden="true"><i className={`bi ${MAP_TYPES[k].icon}`} /></span>
                    {t(`reportsMap.types.${k}`)}
                  </li>
                ))}
              </ul>
              <p className="rm-legend-blink"><span className="rm-blink" aria-hidden="true" />{t('reportsMap.legendBlink')}</p>
            </div>
          </div>
          <p className="rm-note"><i className="bi bi-shield-lock-fill" aria-hidden="true" /> {t('reportsMap.privateNote')}</p>
    </>
  );

  if (panel) {
    return (
      <div className="rm-panel" role="region" aria-labelledby="rm-panel-title">
        {style}
        <h3 className="rm-panel-title" id="rm-panel-title"><i className="bi bi-geo-alt-fill" aria-hidden="true" /> {t('reportsMap.title')}</h3>
        {card}
      </div>
    );
  }

  return (
    <section className="resident-reports-map" aria-labelledby="rm-title">
      {style}
      <div className="rm-outer">
        <div className="rm-inner">
          <div className="rm-intro">
            <div className="rm-badge"><i className="bi bi-geo-alt-fill" aria-hidden="true" /> {t('reportsMap.badge')}</div>
            <h2 id="rm-title">{t('reportsMap.title')}</h2>
            <p>{t('reportsMap.subtitle')}</p>
          </div>

          {card}
        </div>
      </div>
    </section>
  );
}
