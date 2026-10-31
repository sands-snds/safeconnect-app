import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import LegalDocModal from './LegalDocModal';
import { TERMS_HASH, markTermsViewed } from './termsConsent';

// Terms and Conditions, opened from any page by a link to "#terms" (the
// footer and the Sign Up form use one), so it can also be shared as
// <site>/#terms. Mounted once in App.js. The text lives in translations.js
// under `terms` (English and Tagalog). Opening it counts as having viewed
// the Terms, which the Sign Up checkbox requires (termsConsent.js).

export default function TermsModal() {
  const { t } = useLanguage();
  return <LegalDocModal hash={TERMS_HASH} doc={t('terms')} idPrefix="terms" onOpen={markTermsViewed} />;
}
