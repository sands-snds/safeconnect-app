import { useEffect } from "react";

export default function useClickOutside({

    dropdownRef,
    mobileMenuRef,
    notificationsRef,
    mobileNotificationsRef,

    setShowDropdown,
    setShowMobileMenu,
    setShowNotifications,

}) {

    useEffect(() => {

        function handleClickOutside(event) {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }

            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                !event.target.closest(".mobile-menu-toggle")
            ) {
                setShowMobileMenu(false);
            }

            const outsideDesktopPanel =
                !notificationsRef.current ||
                !notificationsRef.current.contains(event.target);

            const outsideMobilePanel =
                !mobileNotificationsRef.current ||
                !mobileNotificationsRef.current.contains(event.target);

            if (
                outsideDesktopPanel &&
                outsideMobilePanel
            ) {
                setShowNotifications(false);
            }

        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, [

        dropdownRef,
        mobileMenuRef,
        notificationsRef,
        mobileNotificationsRef,

        setShowDropdown,
        setShowMobileMenu,
        setShowNotifications,

    ]);

}