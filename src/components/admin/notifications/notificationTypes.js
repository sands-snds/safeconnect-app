// Admin notifications by notification_type (set by the backend): icon,
// color, and where "See ..." takes you. focus: "report" opens that report on
// its tab (referenceId = report id); "notification" opens the notification
// itself on the Notifications page (to reply to a comment).
const TYPES = {
  emergency:            { icon: 'bi-exclamation-triangle-fill', color: '#dc2626', view: 'emergency-reports',   label: 'See report',  focus: 'report' },
  emergency_status:     { icon: 'bi-exclamation-triangle-fill', color: '#dc2626', view: 'emergency-reports',   label: 'See report',  focus: 'report' },
  assistance:           { icon: 'bi-box2-heart-fill',           color: '#ea580c', view: 'assistance-requests', label: 'See request', focus: 'report' },
  assistance_status:    { icon: 'bi-box2-heart-fill',           color: '#ea580c', view: 'assistance-requests', label: 'See request', focus: 'report' },
  petty_crime:          { icon: 'bi-shield-fill-exclamation',   color: '#7c3aed', view: 'petty-crime-reports', label: 'See report',  focus: 'report' },
  petty_crime_status:   { icon: 'bi-shield-fill-exclamation',   color: '#7c3aed', view: 'petty-crime-reports', label: 'See report',  focus: 'report' },
  announcement:         { icon: 'bi-megaphone-fill',            color: '#6B2C3E', view: 'announcement-page',   label: 'See announcement' },
  announcement_comment: { icon: 'bi-chat-left-text-fill',       color: '#2563eb', view: 'notifications',       label: 'Reply',       focus: 'notification' }
};

const FALLBACK = { icon: 'bi-bell-fill', color: '#6B2C3E' };

export const notificationType = (type) => TYPES[type] || FALLBACK;

// Where opening this notification goes: { view, focusId } or null.
export const notificationTarget = (item) => {
  const t = TYPES[item.type];
  if (!t || !t.view) return null;
  if (t.focus === 'report') return { view: t.view, focusId: item.referenceId };
  if (t.focus === 'notification') return { view: t.view, focusId: item.id };
  return { view: t.view };
};
