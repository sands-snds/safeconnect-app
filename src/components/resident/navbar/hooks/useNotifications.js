import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { fetchMyNotifications, markAllMyNotificationsRead, markMyNotificationRead } from "../../../../Services/api";
import { markSyncedRead, useSyncedReadItems } from "../../../shared/useSyncedState";

// Announcements read before this was synced were kept per browser under
// this key; they're moved to the account once, then the key is removed.
const OLD_READ_STORAGE_KEY = "resident_read_announcements";

// Personal notification ids (from the backend, e.g. a "your report status
// changed" reply) are prefixed so they can be told apart from announcement
// ids when marking as read / handling clicks. Both are saved on the server
// for the account, so read/unread is the same on every device.
const PERSONAL_PREFIX = "personal-";

export const announcementKey = (id) => `announcement:${id}`;

export default function useNotifications(
    announcements = [],
    showRainNotice = false,
    userId = null
) {
    const readItems = useSyncedReadItems();

    const [showNotifications,
        setShowNotifications] = useState(false);

    const [personalNotifications, setPersonalNotifications] = useState([]);

    // Marked read on this page: kept read even if a refresh that started
    // before the server saved it comes back with the old value.
    const locallyRead = useRef(new Set());

    const loadPersonalNotifications = useCallback(async () => {
        if (!userId) {
            setPersonalNotifications([]);
            return;
        }
        const list = await fetchMyNotifications();
        setPersonalNotifications(list.map(n =>
            locallyRead.current.has(String(n.id)) ? { ...n, isRead: true } : n
        ));
    }, [userId]);

    useEffect(() => {
        loadPersonalNotifications();
    }, [loadPersonalNotifications]);

    // One-time move of this browser's old read list to the account.
    useEffect(() => {
        if (!userId) return;
        try {
            const old = JSON.parse(localStorage.getItem(OLD_READ_STORAGE_KEY) || "[]");
            if (Array.isArray(old) && old.length) markSyncedRead(old.map(announcementKey));
            localStorage.removeItem(OLD_READ_STORAGE_KEY);
        } catch {
            // storage unavailable: nothing to move
        }
    }, [userId]);

    const announcementNotifications = useMemo(() => {
        return announcements.map(item => ({
            id: item.id,
            title: item.title,
            message: item.message,
            date: item.date,
            category: item.category,
            unread: !readItems.has(announcementKey(item.id)),
            isPersonal: false
        }));
    }, [announcements, readItems]);

    const mappedPersonalNotifications = useMemo(() => {
        return personalNotifications.map(item => ({
            id: `${PERSONAL_PREFIX}${item.id}`,
            title: item.title,
            message: item.message,
            date: item.createdAt,
            category: item.type,
            referenceId: item.referenceId,
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

    // The bell's number: unread notifications plus today's rain advisory.
    const totalBadgeCount = useMemo(() => {
        return unreadCount +
            (showRainNotice ? 1 : 0);
    }, [unreadCount, showRainNotice]);

    const markOneAsRead = useCallback(id => {
        if (typeof id === "string" && id.startsWith(PERSONAL_PREFIX)) {
            const realId = id.slice(PERSONAL_PREFIX.length);
            locallyRead.current.add(realId);
            setPersonalNotifications(prev =>
                prev.map(n => String(n.id) === realId ? { ...n, isRead: true } : n)
            );
            // Saved on the backend too, otherwise the next poll would bring
            // it back as unread.
            markMyNotificationRead(realId).catch(() => {});
            return;
        }
        markSyncedRead([announcementKey(id)]);
    }, []);

    const markAllAsRead = useCallback(() => {
        markSyncedRead(announcements.map(item => announcementKey(item.id)));

        if (personalNotifications.some(n => !n.isRead)) {
            personalNotifications.forEach(n => locallyRead.current.add(String(n.id)));
            setPersonalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            Promise.resolve(markAllMyNotificationsRead()).catch(() => {});
        }
    }, [announcements, personalNotifications]);

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
