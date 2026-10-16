import React, { useEffect, useState } from 'react';
import ResultPopup from './ResultPopup';
import { useLanguage } from '../../i18n/LanguageContext';

// showPopup() replaces alert() with the app's styled popup. <PopupHost />
// (mounted once in App.js) listens for it and shows one popup at a time.
//
//   showPopup({ type: 'error', title: 'Couldn't Save', message: '...' })
//   showPopup({ type: 'success', message: '...', onClose: () => ... })
//
// Without a title, a default for the type is used ("Success",
// "Please Check", "Something Went Wrong") in the current language.

const POPUP_EVENT = 'safeconnect:popup';

export const showPopup = (options) => {
  window.dispatchEvent(new CustomEvent(POPUP_EVENT, { detail: options }));
};

// Styled replacement for window.confirm(). Resolves true when the main
// button is pressed, false on Cancel, Esc or clicking outside.
//
//   if (!(await confirmPopup({ type: 'danger', title: 'Delete this report?',
//         message: '...', confirmLabel: 'Delete' }))) return;
export const confirmPopup = ({ confirmLabel, cancelLabel, ...options } = {}) =>
  new Promise((resolve) => {
    showPopup({
      type: 'warning',
      ...options,
      buttonLabel: confirmLabel,
      cancelLabel,
      confirm: resolve
    });
  });

const DEFAULT_TITLES = {
  danger: 'popup.warningTitle',
  success: 'popup.successTitle',
  warning: 'popup.warningTitle',
  error: 'popup.errorTitle'
};

export const PopupHost = () => {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const onPopup = (e) => setQueue((q) => [...q, e.detail || {}]);
    window.addEventListener(POPUP_EVENT, onPopup);
    return () => window.removeEventListener(POPUP_EVENT, onPopup);
  }, []);

  const current = queue[0];
  if (!current) return null;

  const type = current.type || 'error';
  const isConfirm = typeof current.confirm === 'function';
  const close = () => {
    setQueue((q) => q.slice(1));
    if (isConfirm) current.confirm(true);
    if (current.onClose) current.onClose();
  };
  const cancel = () => {
    setQueue((q) => q.slice(1));
    current.confirm(false);
  };

  return (
    <ResultPopup
      type={type}
      title={current.title || t(DEFAULT_TITLES[type] || DEFAULT_TITLES.error)}
      message={current.message}
      buttonLabel={current.buttonLabel || t(type === 'success' ? 'popup.done' : 'popup.ok')}
      onClose={close}
      {...(isConfirm ? { cancelLabel: current.cancelLabel || t('popup.cancel'), onCancel: cancel } : {})}
    />
  );
};
