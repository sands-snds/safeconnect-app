import React from "react";

function ResidentHero() {
  const heroImages = [
    "/images/resident-background.jpg",
    "/images/resident-background2.jpg",
    "/images/resident-background3.jpg",
  ];

  return (
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
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%",
              }}
            >
              {/* Dark Overlay */}
              <div
                style={{
                  background: "rgba(0,0,0,0.45)",
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div className="container hero-content text-center text-lg-start">
                  <h1 className="hero-title" style={{ marginTop: 0 }}>
                    SAFE CONNECT
                  </h1>

                  <p className="hero-subtitle">
                    Be part of our emergency response network and stand ready
                    to save lives when it matters most.
                    <br />
                    Your action can bring hope in times of crisis.
                  </p>
                </div>

                {/* Emergency Banner */}
                <div className="emergency-banner text-center text-lg-start">
                  <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
                    <i className="bi bi-telephone-forward-fill me-2"></i>
                    <span>Emergency Hotline: 911</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
                    <i className="bi bi-clock-fill me-2"></i>
                    Available 24/7 for immediate emergencies
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
  );
}

export default ResidentHero;