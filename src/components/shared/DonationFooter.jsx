import React from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import useSiteContent from "./useSiteContent";
import { formatMobile, hasChoices } from "./EmergencyContactList";
import { MAIN_LOGO, FOOTER_LOGO } from "./logos";

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

// Sized by .footer-logo in styles/resident.css (64px, 88px from 992px).
// The logo is white: no circle behind it on the dark footer.
const FooterLogo = () => (
  <div className="footer-logo">
    <img
      src={FOOTER_LOGO}
      // Until "Safe Connect Logo 3.png" is in public/images/logos/.
      onError={(e) => { if (!e.currentTarget.src.endsWith(MAIN_LOGO)) e.currentTarget.src = MAIN_LOGO; }}
      alt="Safe Connect logo"
      style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
    />
  </div>
);

// Officials, hotlines and socials are edited by Admins under Content > Page
// Contacts. The hotlines are the same list as the floating call button.
export default function DonationFooter() {
  const { t } = useLanguage();
  const { emergencyContacts = [], officials = [], socials = {} } = useSiteContent();
  return (
    <footer className="footer-section bg-dark text-white py-4">
      <div className="container">
        {/* Three columns from 992px: brand | Contact Us + officials | hotlines + socials.
            Tablets: brand on top, the other two side by side. Phones: stacked. */}
        <div className="row gy-4 align-items-lg-center">
          {/* 1. Brand: logo beside the name and description (stacked and centered below 992px) */}
          <div className="col-12 col-lg-4 footer-brand d-flex flex-column flex-lg-row align-items-center gap-3 gap-lg-4 text-center text-lg-start">
            <FooterLogo />
            <div>
              <div className="footer-logo-text text-white fs-2 lh-sm">Safe Connect</div>
              <p className="footer-about small text-white-50 mt-2 mb-0">
                {t("footer.description")}
              </p>
            </div>
          </div>

          {/* 2. Contact Us: barangay officials */}
          <div className="col-12 col-md-6 col-lg-4 footer-contact">
            <h5 className="footer-heading mb-3 text-md-start text-center">{t("footer.contactUs")}</h5>
            <div className="small text-white-50 footer-contact-list">
              <p className="footer-subheading text-white fw-semibold mb-2">
                <i className="bi bi-people-fill me-2 text-danger"></i>
                {t("footer.barangayOfficials")}
              </p>
              <div className="footer-officials">
                {officials.map((o) => (
                  <div key={o.name}>
                    <div className="text-white-50">{o.name}</div>
                    <PhoneLink number={o.number} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Emergency hotlines (same numbers as the floating call button) and socials */}
          <div className="col-12 col-md-6 col-lg-4 small text-white-50 footer-contact-list">
            {emergencyContacts.length > 0 && (
              <div className="mb-3">
                <p className="footer-subheading text-white fw-semibold mb-2">
                  <i className="bi bi-telephone-fill me-2 text-danger"></i>
                  {t("footer.emergencyHotline")}
                </p>
                {emergencyContacts.map((c) => (hasChoices(c) ? (
                  <div key={c.id}>
                    {c.label}:
                    {c.choices.map((p) => (
                      <div key={`${p.name}-${p.number}`} className="ps-3">
                        {p.name}: <PhoneLink number={p.number}>{formatMobile(p.number)}</PhoneLink>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={c.id}>
                    {c.label}: <PhoneLink number={c.number}>{formatPhone(c.number)}</PhoneLink>
                  </div>
                )))}
              </div>
            )}

            <p className="footer-subheading text-white fw-semibold mb-2">
              <i className="bi bi-share-fill me-2 text-danger"></i>
              {t("footer.socials")}
            </p>
            {socials.email && (
              <div className="mb-1">
                <i className="bi bi-envelope-fill me-2"></i>
                <a href={`mailto:${socials.email}`} className="footer-link text-white-50 text-decoration-none">
                  {socials.email}
                </a>
              </div>
            )}
            {socials.facebookUrl && (
              <div>
                <i className="bi bi-facebook me-2"></i>
                <a
                  href={socials.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link text-white-50"
                >
                  Facebook: {socials.facebookLabel || "Barangay Sta. Fe"}
                </a>
              </div>
            )}
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
