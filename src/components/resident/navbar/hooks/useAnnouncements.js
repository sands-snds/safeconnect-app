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

            const formatted = data.map(item => ({
                id:
                    item.id,
                title:
                    item.title || "",
                category:
                    item.category || "General",
                message:
                    item.message || "",
                date:
                    item.date_posted ||
                    item.date ||
                    item.created_at,
                imageUrl:
                    item.image_url ||
                    item.image ||
                    "",
                sourceUrl:
                    item.source_url ||
                    "",
                sourceSite:
                    item.source_site ||
                    ""
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