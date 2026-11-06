// The server sends a live "comments" event when anyone posts or deletes a
// comment; the pages turn it into this window event, and every open comment
// thread reloads, so comments appear and disappear without a refresh.
export const COMMENTS_CHANGED_EVENT = 'safeconnect:comments-changed';
export const announceCommentsChanged = () => window.dispatchEvent(new Event(COMMENTS_CHANGED_EVENT));
