import { useState, useEffect, useCallback } from "react";
import { fetchAnnouncements } from "../../../../Services/api";

export default function useAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const loadAnnouncements = useCallback(async () => {

        try {
            setLoading(true);
            setError("");
            const data = await fetchAnnouncements();
            if (!Array.isArray(data)) throw new Error("Unexpected response");

            // fetchAnnouncements() already returns camelCase fields with the
            // image URL resolved. This used to re-map snake_case keys
            // (image_url, source_url, ...) that no longer exist, which left
            // every image and article link empty on the News page.
            const formatted = data.map(item => ({
                id: item.id,
                title: item.title || "",
                category: item.category || "General",
                message: item.message || "",
                date: item.rawDate || item.date,
                imageUrl: item.imageUrl || "",
                sourceUrl: item.sourceUrl || "",
                sourceTitle: item.sourceTitle || "",
                sourceImage: item.sourceImage || "",
                sourceSite: item.sourceSite || ""
            }));

            formatted.sort((a, b) =>
                new Date(b.date) -
                new Date(a.date)
            );
            setAnnouncements(formatted);
        }

        catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to load announcements."
            );
        }

        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    return {
        announcements,
        announcementsLoading: loading,
        announcementsError: error,
        reloadAnnouncements: loadAnnouncements
    };
}