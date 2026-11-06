import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { fetchMyReports } from '../../Services/api';
import IncidentMap from '../shared/location/IncidentMap';
import { MAP_TYPES, fromMyReport, isOpenStatus, timeAgo } from '../shared/location/mapReports';
import { REPORTS_CHANGED_EVENT } from './useCallAccess';

// Resident home: "Your Reports on the Map". Only the resident's own reports
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

export default function ResidentReportsMap() {
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
        <button type="button" className="rm-pop-btn" onClick={() => openInMyReports(r)}>{t('reportsMap.openInMyReports')}</button>
      </div>
    );
  };

  return (
    <section className="resident-reports-map" aria-labelledby="rm-title">
      <style>{`
        /* Padding is on .rm-outer: styles/App.css zeroes every <section>'s padding. */
        .rm-outer { padding: 64px 0 72px; background: linear-gradient(180deg, #ffffff 0%, #fbf7f8 100%); }
        .rm-inner { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
        .rm-intro { max-width: 640px; margin: 0 auto 28px; text-align: center; }
        .rm-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 14px; }
        .rm-intro h2 { margin: 0 0 10px; font-size: clamp(1.65rem, 3.4vw, 2.3rem); font-weight: 900; color: #111; line-height: 1.2; letter-spacing: -0.02em; }
        .rm-intro p { margin: 0; color: #5b6170; line-height: 1.7; font-size: 0.98rem; }
        .rm-card { background: #fff; border: 1.5px solid #f0eaec; border-radius: 22px; box-shadow: 0 10px 30px rgba(107, 44, 62, 0.07); overflow: hidden; }
        .rm-pill { display: inline-block; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
        .rm-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 18px 0 0; color: #6b7280; font-size: 0.82rem; text-align: center; }
        .rm-pop-title { margin: 0 22px 4px 0; font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
        .rm-pop-meta { margin: 0 0 8px; font-size: 12px; color: #6b7280; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
        .rm-pop-addr { margin: 0 0 10px; font-size: 12.5px; color: #374151; line-height: 1.45; }
        .rm-pop-btn { border: 1px solid #6B2C3E; background: #FDECEC; color: #6B2C3E; border-radius: 6px; padding: 6px 10px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
        @media (max-width: 767px) {
          .rm-outer { padding: 44px 0 56px; }
          .rm-intro p { font-size: 0.9rem; }
          .rm-card { border-radius: 18px; }
        }
      `}</style>
      <div className="rm-outer">
        <div className="rm-inner">
          <div className="rm-intro">
            <div className="rm-badge"><i className="bi bi-geo-alt-fill" aria-hidden="true" /> {t('reportsMap.badge')}</div>
            <h2 id="rm-title">{t('reportsMap.title')}</h2>
            <p>{t('reportsMap.subtitle')}</p>
          </div>

          <div className="rm-card">
            <IncidentMap
              reports={active}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              renderPopup={renderPopup}
              height={phone ? 330 : 420}
              label={t('reportsMap.mapLabel')}
            />
          </div>
          <p className="rm-note"><i className="bi bi-shield-lock-fill" aria-hidden="true" /> {t('reportsMap.privateNote')}</p>
        </div>
      </div>
    </section>
  );
}
