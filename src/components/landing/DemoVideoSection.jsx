import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import DemoVideoPlayer from '../shared/DemoVideoPlayer';
import { useSiteMedia, hasVideo } from '../shared/useSiteContent';

export default function DemoVideoSection() {
  const { t } = useLanguage();
  const { systemDemo } = useSiteMedia();

  if (!systemDemo?.showOnLanding) return null;

  const placeholder = (
    <div className="dm-placeholder">
      <div className="dm-play">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC107" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </div>
      <strong>{t('demoVideo.comingSoonTitle')}</strong>
      <span>{t('demoVideo.comingSoonText')}</span>
    </div>
  );

  return (
    <section id="demo" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .dm-outer { position: relative; padding: 110px 0; background: linear-gradient(180deg, #ffffff 0%, #fff6f8 100%); overflow: hidden; }

        .dm-blob { position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none; }
        .dm-blob-1 { width: 360px; height: 360px; background: #6B2C3E; opacity: 0.12; top: -120px; right: -110px; }
        .dm-blob-2 { width: 300px; height: 300px; background: #FFC107; opacity: 0.16; bottom: -130px; left: -90px; }

        .dm-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }

        .dm-intro { position: relative; z-index: 2; max-width: 620px; margin: 0 auto 48px; text-align: center; }
        .dm-intro h2 { margin: 0 0 16px; font-size: clamp(1.9rem, 3.8vw, 2.8rem); font-weight: 900; color: #111; line-height: 1.18; letter-spacing: -0.02em; }
        .dm-intro p { margin: 0; color: #777; line-height: 1.75; font-size: 1rem; }

        .dm-card { position: relative; z-index: 2; max-width: 880px; margin: 0 auto; background: #fff; border: 1.5px solid #f0eef0; border-radius: 24px; padding: 12px; box-shadow: 0 16px 40px rgba(107, 44, 62, 0.1); }

        .dm-placeholder { aspect-ratio: 16 / 9; border-radius: 14px; background: linear-gradient(135deg, #3b0d1b 0%, #6B2C3E 100%); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 24px; }
        .dm-placeholder strong { font-size: 18px; }
        .dm-placeholder span { font-size: 14px; opacity: 0.8; max-width: 420px; }
        .dm-play { width: 64px; height: 64px; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; }

        @media (max-width: 560px) {
          .dm-intro { margin-bottom: 32px; }
          .dm-card { padding: 8px; border-radius: 18px; }
          .dm-placeholder strong { font-size: 16px; }
          .dm-placeholder span { font-size: 13px; }
        }
      `}</style>
      <div className="dm-outer">
        <div className="dm-blob dm-blob-1" />
        <div className="dm-blob dm-blob-2" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="dm-intro">
            <div className="dm-badge">
              <i className="bi bi-play-circle-fill" /> {t('demoVideo.eyebrow')}
            </div>
            <h2>{systemDemo.title || t('demoVideo.defaultTitle')}</h2>
            <p>{systemDemo.caption || t('demoVideo.subtitle')}</p>
          </div>
          <div className="dm-card">
            <DemoVideoPlayer demo={systemDemo} showText={false} placeholder={hasVideo(systemDemo) ? null : placeholder} />
          </div>
        </div>
      </div>
    </section>
  );
}
