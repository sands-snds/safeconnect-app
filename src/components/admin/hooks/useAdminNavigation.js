import { useEffect, useState } from "react";

// The open tab survives a browser reload (F5) in this browser tab. Editor
// views can't be restored without their announcement, so they reopen the list.
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
            // storage blocked (private mode): just don't remember the tab
        }
    }, [activeView]);

    const [showModal, setShowModal] = useState(null);

    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

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

    const handleNavigation = (view) => {

        setEditingAnnouncement(null);

        setActiveView(view);

        closeMobileMenu();
    };

    return {

        activeView,
        setActiveView,

        showModal,
        setShowModal,

        showMobileMenu,
        setShowMobileMenu,

        editingAnnouncement,
        setEditingAnnouncement,

        toggleMobileMenu,
        closeMobileMenu,

        handleNavigation,
        handleStatCardClick

    };

}