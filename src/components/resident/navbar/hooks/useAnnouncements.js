import { useEffect, useReducer } from "react";
import { fetchAnnouncements } from "../../../../Services/api";

// One shared copy for the whole resident page (the navbar's News page and
// the resident page's news widget), so a reload -- e.g. from a live update --
// reaches both and the list is fetched once. It resets when nothing uses it.
const store = { announcements: [], loading: true, error: "", started: false, seq: 0, listeners: new Set() };

const update = (patch) => {
    Object.assign(store, patch);
    store.listeners.forEach((listener) => listener());
};

const loadAnnouncements = async () => {
    const seq = ++store.seq;
    update({ loading: true, error: "" });
    try {
        const data = await fetchAnnouncements();
        if (!Array.isArray(data)) throw new Error("Unexpected response");

        const formatted = data.map(item => ({
            id: item.id,
            title: item.title || "",
            category: item.category || "General",
            message: item.message || "",
            date: item.publishedAt || item.rawDate || item.date,
            imageUrl: item.imageUrl || "",
            sourceUrl: item.sourceUrl || "",
            sourceTitle: item.sourceTitle || "",
            sourceImage: item.sourceImage || "",
            sourceSite: item.sourceSite || "",
            likeCount: item.likeCount || 0,
            commentCount: item.commentCount || 0,
            likedByMe: !!item.likedByMe
        }));

        formatted.sort((a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );
        if (seq === store.seq) update({ announcements: formatted });
    }

    catch (err) {
        console.error(err);
        if (seq === store.seq) {
            update({
                error: err?.response?.data?.message ||
                    "Unable to load announcements."
            });
        }
    }

    finally {
        if (seq === store.seq) update({ loading: false });
    }
};

export default function useAnnouncements() {
    const [, rerender] = useReducer((n) => n + 1, 0);

    useEffect(() => {
        store.listeners.add(rerender);
        if (!store.started) {
            store.started = true;
            loadAnnouncements();
        }
        return () => {
            store.listeners.delete(rerender);
            if (!store.listeners.size) Object.assign(store, { announcements: [], loading: true, error: "", started: false });
        };
    }, []);

    return {
        announcements: store.announcements,
        announcementsLoading: store.loading,
        announcementsError: store.error,
        reloadAnnouncements: loadAnnouncements
    };
}
