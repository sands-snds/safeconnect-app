import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSiteMedia, mediaSrc, DEFAULT_SITE_MEDIA } from "../shared/useSiteContent";
import { openCallPanel } from "./navbar/weatherCodes";

function ResidentHero({ onReportEmergency, onRequestHelp }) {
  const { t } = useLanguage();
  // Admins change these under Content > Site Contents.
  const { residentCarousel } = useSiteMedia();
  const heroImages = (residentCarousel?.length ? residentCarousel : DEFAULT_SITE_MEDIA.residentCarousel)
    .map((slide) => mediaSrc(slide.src));

  return (
    <>
      <div
        id="residentHeroCarousel"
        className="carousel slide hero-section position-relative"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        {/* Carousel Images */}
        <div className="carousel-inner">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`carousel-item ${index === 0 ? "active" : ""}`}
            >
              <div
                className="resident-hero-slide"
                style={{ backgroundImage: `url("${image}")` }}
              >
                {/* Dark Overlay */}
                <div className="resident-hero-overlay">
                  <div className="container hero-content text-center">
                    <p className="resident-hero-eyebrow">{t('residentHero.eyebrow')}</p>
                    <h3 className="hero-title">
                      <span className="hero-title-line">{t('residentHero.titleLine1')}</span>
                      <span className="hero-title-line hero-title-accent">{t('residentHero.titleLine2')}</span>
                    </h3>

                    <p className="hero-subtitle">{t('residentHero.subtitle')}</p>

                    <div className="resident-hero-actions">
                      <button type="button" className="rh-btn rh-btn-primary" onClick={onReportEmergency}>
                        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {t('residentHero.ctaReport')}
                      </button>
                      <button type="button" className="rh-btn rh-btn-outline" onClick={onRequestHelp}>
                        <i className="bi bi-life-preserver" aria-hidden="true" /> {t('residentHero.ctaAssist')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous Button */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#residentHeroCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon"></span>
        </button>

        {/* Next Button */}
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#residentHeroCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon"></span>
        </button>

        {/* Indicators */}
        <div className="carousel-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              data-bs-target="#residentHeroCarousel"
              data-bs-slide-to={index}
              className={index === 0 ? "active" : ""}
            ></button>
          ))}
        </div>
      </div>

      {/* Hotline strip -- outside the carousel so its arrows and indicators
          don't sit on top of it. No 24/7 promise: for life-threatening
          emergencies residents call 911. */}
      <div className="resident-hotline-strip">
        <div className="rhs-inner">
          <p className="rhs-text">
            <i className="bi bi-telephone-fill" aria-hidden="true" />
            <span>{t('residentHero.lifeThreatening')}</span>
          </p>
          <div className="rhs-actions">
            <a className="rhs-btn rhs-btn-solid" href="tel:911">{t('residentHero.call911')}</a>
            <button type="button" className="rhs-btn rhs-btn-ghost" onClick={openCallPanel}>{t('residentHero.hotlinesButton')}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResidentHero;
