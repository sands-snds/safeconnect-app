// In-memory "last seen" per admin, updated on every admin-authenticated
// request (see verifyAdmin). The admin panel polls every 30s while open, so
// a recent timestamp means that admin currently has the panel open.
// Presence is ephemeral by nature, so it's fine that this resets on restart.
const lastSeen = new Map();

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

module.exports = {
    touch(adminId) {
        lastSeen.set(String(adminId), new Date());
    },

    clear(adminId) {
        lastSeen.delete(String(adminId));
    },

    getLastSeen(adminId) {
        return lastSeen.get(String(adminId)) || null;
    },

    isOnline(adminId) {
        const seen = lastSeen.get(String(adminId));
        return Boolean(seen && Date.now() - seen.getTime() < ONLINE_WINDOW_MS);
    }
};
