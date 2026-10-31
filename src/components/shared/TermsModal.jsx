import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import LegalDocModal from './LegalDocModal';
import { TERMS_HASH, markTermsViewed } from './termsConsent';







export default function TermsModal() {
  const { t } = useLanguage();
  return <LegalDocModal hash={TERMS_HASH} doc={t('terms')} idPrefix="terms" onOpen={markTermsViewed} />;
}
