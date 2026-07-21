import { useState, useMemo, useCallback } from "react";

const READ_STORAGE_KEY = "resident_read_announcements";

export default function useNotifications(
    announcements = [],
    weatherNotification = null
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

    const notifications = useMemo(() => {

        return announcements.map(item => ({

            ...item,

            unread:
                !readIds.has(item.id)

        }));

    }, [announcements, readIds]);

    const unreadCount = useMemo(() =>

        notifications.filter(
            notification => notification.unread
        ).length,

        [notifications]

    );

    const totalBadgeCount = useMemo(() => {

        return unreadCount +

            (weatherNotification?.show ? 1 : 0);

    }, [unreadCount, weatherNotification]);

    const markOneAsRead = useCallback(id => {

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

    }, [announcements, readIds]);

    return {

        showNotifications,

        setShowNotifications,

        notifications,

        unreadCount,

        totalBadgeCount,

        markOneAsRead,

        markAllAsRead

    };

}