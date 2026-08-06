import { useState, useMemo, useCallback, useEffect } from "react";
import { fetchMyNotifications, markAllMyNotificationsRead } from "../../../../Services/api";

const READ_STORAGE_KEY = "resident_read_announcements";

// Personal notification ids (from the backend, e.g. a "your report status
// changed" reply) are prefixed so they can be told apart from announcement
// ids when marking as read / handling clicks -- announcements use
// localStorage-based read tracking, personal notifications use the backend.
const PERSONAL_PREFIX = "personal-";

export default function useNotifications(
    announcements = [],
    showRainNotice = false,
    userId = null
) {

    function loadReadIds() {
        try {
            const stored =
                JSON.parse(
                    localStorage.getItem(
                        READ_STORAGE_KEY
                    )
                );
            return new Set(stored || []);
        }
        catch {
            return new Set();
        }
    }

    function saveReadIds(ids) {
        try {
            localStorage.setItem(
                READ_STORAGE_KEY,
                JSON.stringify(
                    [...ids]
                )
            );
        }
        catch {
            // Ignore storage errors
        }
    }

    const [showNotifications,
        setShowNotifications] = useState(false);

    const [readIds,
        setReadIds] = useState(loadReadIds);

    const [personalNotifications, setPersonalNotifications] = useState([]);

    const loadPersonalNotifications = useCallback(async () => {
        if (!userId) {
            setPersonalNotifications([]);
            return;
        }
        const list = await fetchMyNotifications();
        setPersonalNotifications(list);
    }, [userId]);

    useEffect(() => {
        loadPersonalNotifications();
    }, [loadPersonalNotifications]);

    const announcementNotifications = useMemo(() => {
        return announcements.map(item => ({
            id: item.id,
            title: item.title,
            message: item.message,
            date: item.date,
            category: item.category,
            unread: !readIds.has(item.id),
            isPersonal: false
        }));
    }, [announcements, readIds]);

    const mappedPersonalNotifications = useMemo(() => {
        return personalNotifications.map(item => ({
            id: `${PERSONAL_PREFIX}${item.id}`,
            title: item.title,
            message: item.message,
            date: item.createdAt,
            category: item.type,
            unread: !item.isRead,
            isPersonal: true
        }));
    }, [personalNotifications]);

    const notifications = useMemo(() => {
        return [...mappedPersonalNotifications, ...announcementNotifications]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [mappedPersonalNotifications, announcementNotifications]);

    const unreadCount = useMemo(() =>
        notifications.filter(
            notification => notification.unread
        ).length,
        [notifications]
    );

    const totalBadgeCount = useMemo(() => {
        return unreadCount +
            (showRainNotice ? 1 : 0);
    }, [unreadCount, showRainNotice]);

    const markOneAsRead = useCallback(id => {
        if (typeof id === "string" && id.startsWith(PERSONAL_PREFIX)) {
            const realId = id.slice(PERSONAL_PREFIX.length);
            setPersonalNotifications(prev =>
                prev.map(n => String(n.id) === realId ? { ...n, isRead: true } : n)
            );
            // Individual personal notifications don't have their own
            // mark-read endpoint wired up client-side yet -- "mark all"
            // (below) covers the common case. This just updates local state
            // so the badge/list reflect it was opened.
            return;
        }

        if (readIds.has(id)) {
            return;
        }

        const updated =
            new Set(readIds);
        updated.add(id);

        setReadIds(updated);

        saveReadIds(updated);
    }, [readIds]);

    const markAllAsRead = useCallback(() => {
        const updated =
            new Set(readIds);
        announcements.forEach(item =>
            updated.add(item.id)
        );
        setReadIds(updated);
        saveReadIds(updated);

        if (personalNotifications.some(n => !n.isRead)) {
            setPersonalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            markAllMyNotificationsRead();
        }
    }, [announcements, readIds, personalNotifications]);

    return {
        showNotifications,
        setShowNotifications,
        notifications,
        unreadCount,
        totalBadgeCount,
        markOneAsRead,
        markAllAsRead,
        reloadPersonalNotifications: loadPersonalNotifications
    };
}
