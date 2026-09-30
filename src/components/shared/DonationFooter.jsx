import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100080219150790";
const SUPPORT_EMAIL = "safeconnect.brgy.santafe@gmail.com";

// Numbers are shown exactly as the barangay provided them.
const BARANGAY_OFFICIALS = [
  { name: "PB Emmanuel B. Noora", number: "09354984838" },
  { name: "Chief Tanod Gaudencio C. Dela Cruz", number: "0993611340" },
  { name: "Sec Hazel R. Adriano", number: "09456355303" },
  { name: "BHW Cecilia T. De Quiros", number: "09381259351" },
  { name: "Kagawad Rolando Noora", number: "09683200779" },
  { name: "BNS Myrna T. Dellomas", number: "09069709313" },
];

// "+63464165393" -> "+63 46 416 5393", "+639929474309" -> "+63 992 947 4309".
// Anything else (e.g. "911") is shown as-is.
const formatPhone = (number) => {
  const m = String(number).match(/^\+63(\d+)$/);
  if (!m) return number;
  const d = m[1];
  if (d.length === 9) return `+63 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  if (d.length === 10) return `+63 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return number;
};

// Plain-looking tel: link, so numbers can be tapped on phones.
const PhoneLink = ({ number, children }) => (
  <a href={`tel:${String(number).replace(/\s/g, "")}`} className="footer-phone text-white-50 text-decoration-none">
    {children || number}
  </a>
);

const FooterLogo = ({ size }) => (
  <div
    style={{
      width: `${size}px`,
      height: `${size}px`,
      background: "#fff",
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <img
      src="/images/safeconnect-logo.svg"
      alt="Safe Connect logo"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  </div>
);

// emergencyContacts: the same list the page's floating call button uses
// (EMERGENCY_CONTACTS in Hero.jsx / EmergencyReportSection.jsx), so the
// footer hotlines always match the button.
export default function DonationFooter({ emergencyContacts = [] }) {
  const { t } = useLanguage();
  return (
    <footer className="footer-section bg-dark text-white py-4">
      <div className="container">
        <div className="row align-items-lg-center">
          {/* Brand Section, desktop: large logo on its own on the left,
              name + description beside it. */}
          <div className="d-none d-lg-flex col-lg-4 align-items-center gap-4 footer-brand">
            <FooterLogo size={96} />
            <div>
              <div className="footer-logo-text text-white fs-2 lh-sm">Safe Connect</div>
              <p className="footer-about small text-white-50 mt-3 mb-0">
                {t("footer.description")}
              </p>
            </div>
          </div>

          {/* Brand Section, phones/tablets: logo + name centered, description below. */}
          <div className="col-12 d-lg-none mb-4 footer-brand">
            <div className="d-flex align-items-center justify-content-center gap-3">
              <FooterLogo size={64} />
              <span className="footer-logo-text text-white fw-bold fs-4">Safe Connect</span>
            </div>
            <p className="footer-about small text-white-50 mt-3 mb-0 text-center">
              {t("footer.description")}
            </p>
          </div>

          {/* Contact Us */}
          <div className="col-12 col-lg-8 footer-contact">
            <h5 className="footer-heading mb-3 text-lg-start text-center">{t("footer.contactUs")}</h5>

            <div className="row small text-white-50 footer-contact-list">
              {/* Barangay officials */}
              <div className="col-12 col-md-7 mb-3">
                <p className="footer-subheading text-white fw-semibold mb-2">
                  <i className="bi bi-people-fill me-2 text-danger"></i>
                  {t("footer.barangayOfficials")}
                </p>
                <div className="footer-officials">
                  {BARANGAY_OFFICIALS.map((o) => (
                    <div key={o.name}>
                      <div className="text-white-50">{o.name}</div>
                      <PhoneLink number={o.number} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12 col-md-5 mb-3">
                {/* Emergency hotlines (same numbers as the floating call button) */}
                {emergencyContacts.length > 0 && (
                  <div className="mb-3">
                    <p className="footer-subheading text-white fw-semibold mb-2">
                      <i className="bi bi-telephone-fill me-2 text-danger"></i>
                      {t("footer.emergencyHotline")}
                    </p>
                    {emergencyContacts.map((c) => (
                      <div key={c.id}>
                        {c.label}: <PhoneLink number={c.number}>{formatPhone(c.number)}</PhoneLink>
                      </div>
                    ))}
                  </div>
                )}

                {/* Socials */}
                <p className="footer-subheading text-white fw-semibold mb-2">
                  <i className="bi bi-share-fill me-2 text-danger"></i>
                  {t("footer.socials")}
                </p>
                <div className="mb-1">
                  <i className="bi bi-envelope-fill me-2"></i>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="footer-link text-white-50 text-decoration-none">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <div>
                  <i className="bi bi-facebook me-2"></i>
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link text-white-50"
                  >
                    Facebook: SafeConnect – Brgy. Sta. Fe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Bottom Section */}
        <div className="row align-items-center">
          <div className="col-12 text-center">
            <p className="mb-0 small text-white-50 footer-copy">
              {t("footer.copyright")} |{" "}
              <a href="#privacy" className="footer-link ms-2 text-white-50 text-decoration-none">
                {t("footer.privacyPolicy")}
              </a>{" "}
              |{" "}
              <a href="#terms" className="footer-link ms-2 text-white-50 text-decoration-none">
                {t("footer.termsOfService")}
              </a>
            </p>
            <p className="mb-0 small text-white-50 footer-credits">
              {t("footer.createdBy")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
