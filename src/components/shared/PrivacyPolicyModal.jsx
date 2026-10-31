import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import LegalDocModal from './LegalDocModal';
import useSiteContent, { officialName } from './useSiteContent';

// Privacy Policy, opened from any page by a link to "#privacy" (the footer
// has one). Mounted once in App.js. The text lives in translations.js under
// `privacy` (English and Tagalog). The contact section also lists the
// barangay's current email, Facebook page and officials (Content > Page
// Contacts), so it stays in step with the footer.
export const PRIVACY_HASH = '#privacy';

function PrivacyContacts() {
  const { t } = useLanguage();
  const { socials = {}, officials = [] } = useSiteContent();
  const hasAny = socials.email || socials.facebookUrl || officials.length > 0;
  if (!hasAny) return null;
  return (
    <div className="tc-extra">
      {socials.email && (
        <div>{t('privacy.contactEmail')}: <a href={`mailto:${socials.email}`}>{socials.email}</a></div>
      )}
      {socials.facebookUrl && (
        <div>
          {t('privacy.contactFacebook')}:{' '}
          <a href={socials.facebookUrl} target="_blank" rel="noopener noreferrer">{socials.facebookLabel || socials.facebookUrl}</a>
        </div>
      )}
      {officials.length > 0 && (
        <div>
          {t('privacy.contactOfficials')}:{' '}
          {officials.map((o, i) => (
            <span key={`${officialName(o)}-${o.number}`}>
              {i > 0 && '; '}
              {officialName(o)} (<a href={`tel:${String(o.number).replace(/\s/g, '')}`}>{o.number}</a>)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicyModal() {
  const { t } = useLanguage();
  return (
    <LegalDocModal
      hash={PRIVACY_HASH}
      doc={t('privacy')}
      idPrefix="privacy"
      renderAfterSection={(section) => (section.id === 'contact' ? <PrivacyContacts /> : null)}
    />
  );
}
