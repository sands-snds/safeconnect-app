import { showPopup } from '../shared/popup';

// The backend answers MEDIA_TOO_LARGE (HTTP 413) when a report's photo or
// video is too big to save, so the form can say that instead of a general
// "couldn't submit".
export const MEDIA_TOO_LARGE = 'MEDIA_TOO_LARGE';

// A failed API result as an Error that keeps the backend's code.
export const resultError = (result, fallbackMessage) =>
  Object.assign(new Error((result && result.message) || fallbackMessage), { code: result && result.code });

// In a report form's catch: shows the "file too large" popup and returns
// true when that was the problem.
export const showIfMediaTooLarge = (error, t) => {
  if (!error || error.code !== MEDIA_TOO_LARGE) return false;
  showPopup({
    type: 'warning',
    title: t('reportForm.mediaTooLargeTitle'),
    message: t('reportForm.mediaTooLarge')
  });
  return true;
};
