import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    fetchMyNotifications,
    markAllMyNotificationsRead,
    markMyNotificationRead,
    archiveMyNotifications,
    deleteMyNotifications
} from "../../../../Services/api";
import { markSyncedRead, unmarkSynced, useSyncedReadItems } from "../../../shared/useSyncedState";



const OLD_READ_STORAGE_KEY = "resident_read_announcements";





const PERSONAL_PREFIX = "personal-";

export const announcementKey = (id) => `announcement:${id}`;

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

    
    
    const locallyRead = useRef(new Set());
    
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

    
    
    const notifications = useMemo(() => allNotifications.filter(n => !n.archived), [allNotifications]);
    const archivedNotifications = useMemo(() => allNotifications.filter(n => n.archived), [allNotifications]);

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
            locallyRead.current.add(realId);
            setPersonalNotifications(prev =>
                prev.map(n => String(n.id) === realId ? { ...n, isRead: true } : n)
            );
            
            
            markMyNotificationRead(realId).catch(() => {});
            return;
        }
        markSyncedRead([announcementKey(id)]);
    }, []);

    
    
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
                    if (ok) personal.forEach(id => locallyArchived.current.delete(id));
                    return ok;
                })
                .catch(() => false);
        }
        return Promise.resolve(true);
    }, []);

    
    
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
