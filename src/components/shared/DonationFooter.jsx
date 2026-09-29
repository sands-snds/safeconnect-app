import React from "react";

export default function DonationFooter() {
  return (
    <footer className="footer-section bg-dark text-white py-4">
      <div className="container">
        <div className="row align-items-center">
          {/* Brand Section */}
          <div className="col-12 col-md-3 mb-3 mb-md-4 d-flex justify-content-start align-items-center footer-brand">
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  background: "#fff",
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  marginRight: "10px",
                }}
              >
                <img
                  src="/images/safeconnect-logo.svg"
                  alt="Safe Connect logo"
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </div>
              <span className="footer-logo-text text-white fw-bold fs-5">Safe Connect</span>
            </div>
          </div>

          {/* Contact Us */}
          <div className="col-12 col-md-9 mb-4 mt-md-4 footer-contact">
            <h5 className="footer-heading mb-3 text-md-start text-center">Contact Us</h5>

            {/* Horizontal Contact Info */}
            <div className="d-flex flex-column flex-md-row flex-md-wrap align-items-center align-items-md-start justify-content-md-between text-white-50 small text-md-start text-center gap-3 footer-contact-list">
              {/* Emergency Response Center */}
              <div className="mb-2">
                <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                <strong>Emergency Response Center:</strong><br />
                <span>Dasmariñas Emergency Operations</span>
              </div>

              {/* Emergency Hotline */}
              <div className="mb-2">
                <i className="bi bi-telephone-fill me-2 text-danger"></i>
                <strong>Emergency Hotline:</strong><br />
                <span>(046) 435 0183 / (046) 481 0555</span><br />
                <span>091772188255 / 09988435477</span>
              </div>

              {/* Email Support */}
              <div className="mb-2">
                <i className="bi bi-envelope-fill me-2 text-danger"></i>
                <strong>Email Support:</strong><br />
                <span>safeconnect.brgy.santafe@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Bottom Section */}
        <div className="row align-items-center">
          <div className="col-12 text-center">
            <p className="mb-0 small text-white-50 footer-copy">
              © 2025 Safe Connect. All rights reserved. |{" "}
              <a href="#privacy" className="footer-link ms-2 text-white-50 text-decoration-none">
                Privacy Policy
              </a>{" "}
              |{" "}
              <a href="#terms" className="footer-link ms-2 text-white-50 text-decoration-none">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
