import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

function ResidentHero() {
  const { t } = useLanguage();
  const heroImages = [
    "/images/resident-background.jpg",
    "/images/resident-background2.jpg",
    "/images/resident-background3.jpg",
  ];

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
                style={{ backgroundImage: `url(${image})` }}
              >
                {/* Dark Overlay */}
                <div className="resident-hero-overlay">
                  <div className="container hero-content text-center">
                    <h3 className="hero-title">
                      <span className="hero-title-line">{t('residentHero.titleLine1')}</span>
                      <span className="hero-title-line">{t('residentHero.titleLine2')}</span>
                    </h3>

                    <p className="hero-subtitle">
                      {t('residentHero.subtitleLine1')}
                      <br />
                      {t('residentHero.subtitleLine2')}
                    </p>
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

      {/* Emergency Banner -- kept outside the carousel so the indicators and
          arrows don't sit on top of it */}
      <div className="emergency-banner text-center text-lg-start">
        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-telephone-forward-fill me-2"></i>
          <span>{t('residentHero.hotline')}</span>
        </div>

        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-clock-fill me-2"></i>
          {t('residentHero.available247')}
        </div>
      </div>
    </>
  );
}

export default ResidentHero;
