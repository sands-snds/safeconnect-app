import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { fetchMyReports } from '../../Services/api';
import useAnnouncements from './navbar/hooks/useAnnouncements';
import useWeather from './navbar/hooks/useWeather';
import { describeWeatherCode, openResidentView } from './navbar/weatherCodes';

// Resident home: "At a glance" -- the resident's reports by status, the
// newest barangay update and today's weather, each with a link into
// My Reports / News. Refreshes when the resident comes back to the tab.
// (Cards are divs, not <section>s: styles/App.css zeroes every section's padding.)

const stageOf = (status) => {
  if (status === 'Received' || status === 'Pending') return 'received';
  if (status === 'In Progress') return 'inProgress';
  if (status === 'Resolved' || status === 'Completed') return 'resolved';
  return null;
};

const timeAgo = (dateStr, language) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const rtf = new Intl.RelativeTimeFormat(language === 'tl' ? 'fil' : 'en', { numeric: 'auto' });
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
};

export default function ResidentGlance({ userId }) {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState(null); // null = loading
  const { announcements, announcementsLoading, reloadAnnouncements } = useAnnouncements();
  const { weather } = useWeather();

  const loadReports = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchMyReports(userId);
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports((prev) => prev || []);
    }
  }, [userId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      loadReports();
      reloadAnnouncements();
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [loadReports, reloadAnnouncements]);

  const counts = useMemo(() => {
    const c = { received: 0, inProgress: 0, resolved: 0 };
    (reports || []).forEach((r) => { const s = stageOf(r.status); if (s) c[s] += 1; });
    return c;
  }, [reports]);

  const latest = announcements[0];
  const weatherInfo = weather ? describeWeatherCode(weather.code) : null;

  return (
    <div className="rg-outer">
      <style>{`
        .rg-outer { background: #fff; padding: 56px 0 8px; }
        .rg-inner { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
        .rg-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .rg-head h2 { margin: 0; font-size: clamp(1.35rem, 2.6vw, 1.75rem); font-weight: 900; color: #111; letter-spacing: -0.02em; }
        .rg-head p { margin: 4px 0 0; color: #5b6170; font-size: 0.95rem; }
        .rg-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
        .rg-card { background: #fff; border: 1px solid #efe7ea; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 8px 24px rgba(107, 44, 62, 0.06); min-width: 0; }
        .rg-card-head { display: flex; align-items: center; gap: 10px; }
        .rg-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .rg-card-head h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #111; }
        .rg-body { flex: 1; min-width: 0; }
        .rg-muted { margin: 0; color: #6b7280; font-size: 0.9rem; line-height: 1.5; }
        .rg-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .rg-stat { border-radius: 14px; padding: 10px 6px; text-align: center; }
        .rg-stat strong { display: block; font-size: 1.5rem; font-weight: 900; line-height: 1.1; }
        .rg-stat span { display: block; font-size: 0.72rem; font-weight: 700; margin-top: 2px; }
        .rg-news-title { margin: 0 0 4px; font-size: 1rem; font-weight: 800; color: #111; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .rg-news-msg { margin: 0 0 6px; color: #4b5563; font-size: 0.88rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .rg-news-time { font-size: 0.78rem; color: #6b7280; font-weight: 600; }
        .rg-weather { display: flex; align-items: center; gap: 14px; }
        .rg-weather i { font-size: 2.4rem; color: #f59e0b; line-height: 1; }
        .rg-weather strong { display: block; font-size: 1.6rem; font-weight: 900; color: #111; line-height: 1.1; }
        .rg-weather span { display: block; font-size: 0.88rem; color: #4b5563; font-weight: 600; }
        .rg-rain { margin-top: 10px; font-size: 0.85rem; color: #1e3a8a; background: #eff6ff; border-radius: 10px; padding: 8px 10px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .rg-link { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; border: none; background: none; padding: 0; color: #6B2C3E; font-weight: 800; font-size: 0.88rem; cursor: pointer; }
        .rg-link:hover { text-decoration: underline; }
        .rg-link:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 3px; border-radius: 4px; }
        @media (max-width: 900px) { .rg-grid { grid-template-columns: 1fr 1fr; } .rg-card.rg-weather-card { grid-column: span 2; } }
        @media (max-width: 600px) { .rg-outer { padding-top: 40px; } .rg-grid { grid-template-columns: 1fr; gap: 14px; } .rg-card.rg-weather-card { grid-column: auto; } }
      `}</style>
      <div className="rg-inner">
        <div className="rg-head">
          <div>
            <h2>{t('residentGlance.title')}</h2>
            <p>{t('residentGlance.subtitle')}</p>
          </div>
        </div>

        <div className="rg-grid">
          {/* My reports */}
          <div role="region" className="rg-card" aria-labelledby="rg-reports">
            <div className="rg-card-head">
              <span className="rg-icon" style={{ background: '#fdf0f3', color: '#6B2C3E' }}><i className="bi bi-file-earmark-text-fill" aria-hidden="true" /></span>
              <h3 id="rg-reports">{t('residentGlance.reportsTitle')}</h3>
            </div>
            <div className="rg-body">
              {reports === null ? (
                <p className="rg-muted">{t('residentGlance.loading')}</p>
              ) : reports.length === 0 ? (
                <p className="rg-muted">{t('residentGlance.noReports')}</p>
              ) : (
                <div className="rg-stats">
                  <div className="rg-stat" style={{ background: '#fef3c7', color: '#92400e' }}><strong>{counts.received}</strong><span>{t('myReports.status.received')}</span></div>
                  <div className="rg-stat" style={{ background: '#dbeafe', color: '#1e40af' }}><strong>{counts.inProgress}</strong><span>{t('myReports.status.inProgress')}</span></div>
                  <div className="rg-stat" style={{ background: '#dcfce7', color: '#166534' }}><strong>{counts.resolved}</strong><span>{t('myReports.status.resolved')}</span></div>
                </div>
              )}
            </div>
            <button type="button" className="rg-link" onClick={() => openResidentView('reports')}>
              {t('residentGlance.viewReports')} <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>

          {/* Latest update */}
          <div role="region" className="rg-card" aria-labelledby="rg-news">
            <div className="rg-card-head">
              <span className="rg-icon" style={{ background: '#eef2ff', color: '#4338ca' }}><i className="bi bi-megaphone-fill" aria-hidden="true" /></span>
              <h3 id="rg-news">{t('residentGlance.newsTitle')}</h3>
            </div>
            <div className="rg-body">
              {announcementsLoading && !latest ? (
                <p className="rg-muted">{t('residentGlance.loading')}</p>
              ) : !latest ? (
                <p className="rg-muted">{t('residentGlance.noNews')}</p>
              ) : (
                <>
                  <p className="rg-news-title">{latest.title}</p>
                  {latest.message && <p className="rg-news-msg">{latest.message}</p>}
                  <span className="rg-news-time"><i className="bi bi-clock" aria-hidden="true" /> {timeAgo(latest.date, language)}</span>
                </>
              )}
            </div>
            <button type="button" className="rg-link" onClick={() => openResidentView('news')}>
              {t('residentGlance.viewNews')} <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>

          {/* Weather */}
          <div role="region" className="rg-card rg-weather-card" aria-labelledby="rg-weather">
            <div className="rg-card-head">
              <span className="rg-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><i className="bi bi-cloud-sun-fill" aria-hidden="true" /></span>
              <h3 id="rg-weather">{t('weather.widgetTitle')}</h3>
            </div>
            <div className="rg-body">
              {!weather ? (
                <p className="rg-muted">{t('residentGlance.loading')}</p>
              ) : (
                <>
                  <div className="rg-weather">
                    <i className={`bi ${weatherInfo.icon}`} aria-hidden="true" />
                    <div>
                      <strong>{weather.tMax}°C</strong>
                      <span>{t(`weather.codes.${weatherInfo.key}`)} · {t('weather.low')} {weather.tMin}°C</span>
                    </div>
                  </div>
                  <p className="rg-rain"><i className="bi bi-droplet-fill" aria-hidden="true" /> {t('weather.rainChance')}: {weather.rainChance}%</p>
                </>
              )}
            </div>
            <button type="button" className="rg-link" onClick={() => openResidentView('news')}>
              {t('residentGlance.viewForecast')} <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
