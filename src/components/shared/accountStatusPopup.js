import { showPopup } from './popup';




const STATUS_POPUPS = {
  ACCOUNT_CLOSED: { type: 'error', title: 'auth.accountClosedTitle', message: 'auth.accountClosedMessage' },
  ACCOUNT_SUSPENDED: { type: 'warning', title: 'auth.accountSuspendedTitle', message: 'auth.accountSuspendedMessage' },
  ACCOUNT_PENDING: { type: 'warning', title: 'auth.accountInactiveTitle', message: 'auth.accountInactiveMessage' },
  ACCOUNT_INACTIVE: { type: 'warning', title: 'auth.accountInactiveTitle', message: 'auth.accountInactiveMessage' },
  // Signed up with an ID that the barangay hasn't checked yet, or turned down.
  ACCOUNT_UNDER_REVIEW: { type: 'warning', title: 'auth.accountReviewTitle', message: 'auth.accountReviewMessage' },
  ACCOUNT_REJECTED: { type: 'error', title: 'auth.accountRejectedTitle', message: 'auth.accountRejectedMessage' }
};

export const showAccountStatusPopup = (code, t, email, reason) => {
  const popup = STATUS_POPUPS[code];
  if (!popup) return false;
  showPopup({
    type: popup.type,
    title: t(popup.title),
    message: t(popup.message, { email: email || 'safeconnect.brgy.santafe@gmail.com', reason: reason || t('auth.noReasonGiven') })
  });
  return true;
};
