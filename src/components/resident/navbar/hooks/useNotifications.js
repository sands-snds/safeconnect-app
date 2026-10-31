import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    fetchMyNotifications,
    markAllMyNotificationsRead,
    markMyNotificationRead,
    archiveMyNotifications,
    deleteMyNotifications
} from "../../../../Services/api";
import { markSyncedRead, unmarkSynced, useSyncedReadItems } from "../../../shared/useSyncedState";

// Announcements read before this was synced were kept per browser under
// this key; they're moved to the account once, then the key is removed.
const OLD_READ_STORAGE_KEY = "resident_read_announcements";

// Personal notification ids (from the backend, e.g. a "your report status
// changed" reply) are prefixed so they can be told apart from announcement
// ids when marking as read / handling clicks. Both are saved on the server
// for the account, so read/unread is the same on every device.
const PERSONAL_PREFIX = "personal-";

export const announcementKey = (id) => `announcement:${id}`;
// Announcements archived / deleted from the bell, saved for the account.
export const archivedKey = (id) => `notif-archived:${id}`;
export const deletedKey = (id) => `notif-deleted:${id}`;

const isPersonalId = (id) => typeof id === "string" && id.startsWith(PERSONAL_PREFIX);
const personalRealId = (id) => id.slice(PERSONAL_PREFIX.length);

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
    // Same for archive / restore (id -> true | false) and delete.
    const locallyArchived = useRef(new Map());
    const locallyDeleted = useRef(new Set());

    const loadPersonalNotifications = useCallback(async () => {
        if (!userId) {
            setPersonalNotifications([]);
            return;
        }
        const list = await fetchMyNotifications();
        setPersonalNotifications(list
            .filter(n => !locallyDeleted.current.has(String(n.id)))
            .map(n => {
                const id = String(n.id);
                let next = locallyRead.current.has(id) ? { ...n, isRead: true } : n;
                if (locallyArchived.current.has(id)) next = { ...next, archived: locallyArchived.current.get(id) };
                return next;
            }));
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
        return announcements
            .filter(item => !readItems.has(deletedKey(item.id)))
            .map(item => ({
                id: item.id,
                title: item.title,
                message: item.message,
                date: item.date,
                category: item.category,
                unread: !readItems.has(announcementKey(item.id)),
                archived: readItems.has(archivedKey(item.id)),
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
            commentId: item.commentId || null,
            unread: !item.isRead,
            archived: Boolean(item.archived),
            isPersonal: true
        }));
    }, [personalNotifications]);

    const allNotifications = useMemo(() => {
        return [...mappedPersonalNotifications, ...announcementNotifications]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [mappedPersonalNotifications, announcementNotifications]);

    // The bell (and its count) shows the inbox; archived ones live on the
    // Notifications page's Archived tab.
    const notifications = useMemo(() => allNotifications.filter(n => !n.archived), [allNotifications]);
    const archivedNotifications = useMemo(() => allNotifications.filter(n => n.archived), [allNotifications]);

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

    // Archive (archived = true) or restore notifications. Archiving also
    // marks them read.
    const archiveNotifications = useCallback((ids, archived = true) => {
        const personal = ids.filter(isPersonalId).map(personalRealId);
        const announcementIds = ids.filter(id => !isPersonalId(id));

        if (announcementIds.length) {
            if (archived) {
                markSyncedRead(announcementIds.flatMap(id => [archivedKey(id), announcementKey(id)]));
            } else {
                unmarkSynced(announcementIds.map(archivedKey));
            }
        }
        if (personal.length) {
            personal.forEach(id => {
                locallyArchived.current.set(id, archived);
                if (archived) locallyRead.current.add(id);
            });
            setPersonalNotifications(prev => prev.map(n => personal.includes(String(n.id))
                ? { ...n, archived, isRead: archived ? true : n.isRead }
                : n));
            return archiveMyNotifications(personal.map(Number), archived)
                .then(ok => {
                    // Saved: later refreshes already carry it (and may carry
                    // a restore made on another device).
                    if (ok) personal.forEach(id => locallyArchived.current.delete(id));
                    return ok;
                })
                .catch(() => false);
        }
        return Promise.resolve(true);
    }, []);

    // Deletes notifications for good. Announcements themselves stay on the
    // News page; they just no longer show in this account's notifications.
    const deleteNotifications = useCallback((ids) => {
        const personal = ids.filter(isPersonalId).map(personalRealId);
        const announcementIds = ids.filter(id => !isPersonalId(id));

        if (announcementIds.length) {
            markSyncedRead(announcementIds.flatMap(id => [deletedKey(id), announcementKey(id)]));
        }
        if (personal.length) {
            personal.forEach(id => locallyDeleted.current.add(id));
            setPersonalNotifications(prev => prev.filter(n => !personal.includes(String(n.id))));
            return deleteMyNotifications(personal.map(Number)).catch(() => false);
        }
        return Promise.resolve(true);
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
        archivedNotifications,
        unreadCount,
        totalBadgeCount,
        markOneAsRead,
        markAllAsRead,
        archiveNotifications,
        deleteNotifications,
        reloadPersonalNotifications: loadPersonalNotifications
    };
}
