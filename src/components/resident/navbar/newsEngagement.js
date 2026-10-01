// Local-only engagement data (likes + comments) for the News feed.
// Stored in this browser's localStorage, keyed by announcement id --
// there is no backend table for this yet, so counts/comments are
// per-device, not shared across residents.
const LIKES_KEY = 'sf_news_likes';
const COMMENTS_KEY = 'sf_news_comments';

const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage unavailable (private mode, quota) -- feature just won't persist.
    }
};

export const isLiked = (announcementId) => {
    const likes = readJSON(LIKES_KEY, {});
    return !!likes[announcementId];
};

export const toggleLike = (announcementId) => {
    const likes = readJSON(LIKES_KEY, {});
    const next = !likes[announcementId];
    likes[announcementId] = next;
    writeJSON(LIKES_KEY, likes);
    return next;
};

export const getComments = (announcementId) => {
    const all = readJSON(COMMENTS_KEY, {});
    return all[announcementId] || [];
};

export const addComment = (announcementId, text, authorName) => {
    const all = readJSON(COMMENTS_KEY, {});
    const list = all[announcementId] || [];
    const comment = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        text,
        author: authorName,
        date: new Date().toISOString(),
        mine: true
    };
    const next = [...list, comment];
    all[announcementId] = next;
    writeJSON(COMMENTS_KEY, all);
    return next;
};

export const deleteComment = (announcementId, commentId) => {
    const all = readJSON(COMMENTS_KEY, {});
    const list = (all[announcementId] || []).filter((c) => c.id !== commentId);
    all[announcementId] = list;
    writeJSON(COMMENTS_KEY, all);
    return list;
};

export const getCurrentResidentName = () => {
    try {
        const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        return raw.fullName || raw.full_name || raw.username
            || localStorage.getItem('residentName') || 'Resident';
    } catch {
        return 'Resident';
    }
};
