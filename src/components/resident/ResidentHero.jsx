import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSiteMedia, mediaSrc, DEFAULT_SITE_MEDIA } from "../shared/useSiteContent";

function ResidentHero() {
  const { t } = useLanguage();

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

      <div className="emergency-banner text-center text-lg-start">
        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-telephone-forward-fill me-2"></i>
          <span>{t('residentHero.hotline')}</span>
        </div>

        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-people-fill me-2"></i>
          {t('residentHero.community')}
        </div>
      </div>
    </>
  );
}

export default ResidentHero;
