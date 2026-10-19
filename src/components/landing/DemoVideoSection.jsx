import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import DemoVideoPlayer from '../shared/DemoVideoPlayer';
import { useSiteMedia, hasVideo } from '../shared/useSiteContent';

// Landing page: the system demo video, between the carousel and "What you
// can do". Admins set or hide it under Content > Site Contents; until a
// video is added it shows a "coming soon" placeholder.
export default function DemoVideoSection() {
  const { t } = useLanguage();
  const { systemDemo } = useSiteMedia();

  if (!systemDemo?.showOnLanding) return null;

  const placeholder = (
    <div
      style={{
        aspectRatio: '16 / 9',
        borderRadius: 12,
        background: 'linear-gradient(135deg, #3b0d1b 0%, #6B2C3E 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
        padding: 24
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC107" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </div>
      <strong style={{ fontSize: 18 }}>{t('demoVideo.comingSoonTitle')}</strong>
      <span style={{ fontSize: 14, opacity: 0.8, maxWidth: 420 }}>{t('demoVideo.comingSoonText')}</span>
    </div>
  );

  return (
    <section id="demo" style={{ background: '#fff', padding: 'clamp(72px, 10vw, 112px) 0 clamp(80px, 11vw, 128px)' }}>
      <div className="container" style={{ maxWidth: 920 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', margin: '0 0 8px', color: '#1a1416' }}>
            {systemDemo.title || t('demoVideo.defaultTitle')}
          </h2>
          {systemDemo.caption && (
            <p style={{ color: '#6b7280', margin: '0 auto', maxWidth: 620, fontSize: 15.5 }}>{systemDemo.caption}</p>
          )}
        </div>
        <DemoVideoPlayer demo={systemDemo} showText={false} placeholder={hasVideo(systemDemo) ? null : placeholder} />
      </div>
    </section>
  );
}
