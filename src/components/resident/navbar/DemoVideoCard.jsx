import React from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import DemoVideoPlayer from '../../shared/DemoVideoPlayer';
import { useSiteMedia, hasVideo } from '../../shared/useSiteContent';

export default function DemoVideoCard() {
  const { t } = useLanguage();
  const { systemDemo } = useSiteMedia();

  if (!systemDemo?.showInNews || !hasVideo(systemDemo)) return null;

  return (
    <div id="news-item-demo" className="news-card" style={{ '--news-accent': '#6B2C3E' }}>
      <div className="news-card-content">
        <div className="news-card-top-row">
          <span className="news-card-category" style={{ background: '#6B2C3E18', color: '#6B2C3E' }}>
            <i className="bi bi-play-circle-fill" />
            {t('demoVideo.newsBadge')}
          </span>
        </div>
        <h3>{systemDemo.title || t('demoVideo.defaultTitle')}</h3>
        <DemoVideoPlayer demo={systemDemo} showText={false} />
        {systemDemo.caption && <p style={{ marginTop: 12 }}>{systemDemo.caption}</p>}
      </div>
    </div>
  );
}
