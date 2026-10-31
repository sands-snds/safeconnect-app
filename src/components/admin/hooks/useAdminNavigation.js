import { useEffect, useState } from "react";

const VIEW_KEY = "sc_admin_view";
const RESTORE_AS = { "create-announcement": "announcement-page" };

const savedView = () => {
    try {
        const view = sessionStorage.getItem(VIEW_KEY);
        return view ? (RESTORE_AS[view] || view) : "dashboard";
    } catch {
        return "dashboard";
    }
};

export default function useAdminNavigation() {
    const [activeView, setActiveView] = useState(savedView);

    useEffect(() => {
        try {
            sessionStorage.setItem(VIEW_KEY, activeView);
        } catch {
        }
    }, [activeView]);


    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const [focus, setFocus] = useState(null);

    const toggleMobileMenu = () => {
        setShowMobileMenu(prev => !prev);
    };

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    const handleStatCardClick = (view) => {
        setActiveView(view);
        closeMobileMenu();
    };

    const handleNavigation = (view, options = {}) => {
        setEditingAnnouncement(null);

        setFocus(options.focusId ? { view, id: options.focusId, at: Date.now() } : null);

        setActiveView(view);

        closeMobileMenu();
    };

    return {
        activeView,
        setActiveView,


        showMobileMenu,
        setShowMobileMenu,

        editingAnnouncement,
        setEditingAnnouncement,

        toggleMobileMenu,
        closeMobileMenu,

        handleNavigation,
        handleStatCardClick,

        focus,
        clearFocus: () => setFocus(null)
    };
}