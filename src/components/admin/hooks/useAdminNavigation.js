import { useState } from "react";

export default function useAdminNavigation() {

    const [activeView, setActiveView] = useState("dashboard");

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