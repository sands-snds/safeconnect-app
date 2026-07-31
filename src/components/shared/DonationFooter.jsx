import React from "react";

export default function DonationFooter() {
  return (
    <footer className="footer-section bg-dark text-white py-4">
      <div className="container">
        <div className="row align-items-center">
          {/* Brand Section */}
          <div className="col-12 col-md-3 mb-4 d-flex justify-content-md-start justify-content-center align-items-center">
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  background: "#ff684d",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "10px",
                }}
              >
                <i className="bi bi-heart-fill text-white"></i>
              </div>
              <span className="footer-logo-text text-white fw-bold fs-5">Safe Connect</span>
            </div>
          </div>

          {/* Contact Us */}
          <div className="col-12 col-md-9 mb-4 mt-4">
            <h5 className="footer-heading mb-3 text-md-start text-center">Contact Us</h5>

            {/* Horizontal Contact Info */}
            <div className="d-flex flex-wrap justify-content-between text-white-50 small text-md-start text-center">
              {/* Emergency Response Center */}
              <div className="me-4 mb-2">
                <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                <strong>Emergency Response Center:</strong><br />
                <span className="ms-4">Dasmariñas Emergency Operations</span>
              </div>

              {/* Emergency Hotline */}
              <div className="me-4 mb-2">
                <i className="bi bi-telephone-fill me-2 text-danger"></i>
                <strong>Emergency Hotline:</strong><br />
                <span className="ms-4">(046) 435 0183 / (046) 481 0555</span><br />
                <span className="ms-4">091772188255 / 09988435477</span>
              </div>

              {/* Email Support */}
              <div className="mb-2">
                <i className="bi bi-envelope-fill me-2 text-danger"></i>
                <strong>Email Support:</strong><br />
                <span className="ms-4">help@safeconnect.org</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Bottom Section */}
        <div className="row align-items-center">
          <div className="col-12 text-center">
            <p className="mb-0 small text-white-50">
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
