import { showPopup } from '../shared/popup';
import { mediaCheckMessageKey } from '../shared/media/mediaCheck';

// Problems with a report's photo or video that the backend answers with a
// code, so the form can say exactly what's wrong instead of a general
// "couldn't submit":
//   MEDIA_TOO_LARGE (HTTP 413): too big to save.
//   MEDIA_REJECTED  (HTTP 422): not taken today or yesterday, no date in its
//                   details, or edited (reason: noDate, future, tooOld, edited).
export const MEDIA_TOO_LARGE = 'MEDIA_TOO_LARGE';
export const MEDIA_REJECTED = 'MEDIA_REJECTED';

// A failed API result as an Error that keeps the backend's code, reason and
// (for TEXT_INVALID) which fields failed.
export const resultError = (result, fallbackMessage) =>
  Object.assign(new Error((result && result.message) || fallbackMessage), {
    code: result && result.code,
    reason: result && result.reason,
    fields: result && result.fields
  });

// In a report form's catch: shows the matching popup and returns true when
// the problem was the photo or video.
export const showIfMediaProblem = (error, t) => {
  if (!error) return false;
  if (error.code === MEDIA_TOO_LARGE) {
    showPopup({ type: 'warning', title: t('reportForm.mediaTooLargeTitle'), message: t('reportForm.mediaTooLarge') });
    return true;
  }
  if (error.code === MEDIA_REJECTED) {
    showPopup({ type: 'warning', title: t('reportForm.mediaCheck.title'), message: t(mediaCheckMessageKey(error.reason || 'noDate')) });
    return true;
  }
  return false;
};
