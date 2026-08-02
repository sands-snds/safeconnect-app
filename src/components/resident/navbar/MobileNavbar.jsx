import React from "react";

import NotificationPanel from "./NotificationPanel";
import MobileMenu from "./MobileMenu";

export default function MobileNavbar({

    username,

    mobileMenuRef,
    mobileNotificationsRef,

    showMobileMenu,
    showNotifications,

    totalBadgeCount,

    notifications,
    announcements,

    announcementsLoading,
    announcementsError,

    unreadCount,

    weather,
    showRainNotice,

    toggleNotifications,

    markAllAsRead,

    handleNotificationClick,
    handleWeatherNotificationClick,

    formatRelativeTime,
    describeWeatherCode,
    getCategoryIcon,

    toggleMobileMenu,

    setShowMobileMenu,
    setShowNotifications,

    handleHomeClick,
    handleNavClick,

    openNewsPage,
    openReportsPage,
    openSettingsPage,

    handleNavigation

}) {

    return (

        <>

            {/* Notification Bell */}

            <div
                className="mobile-header-actions"
                ref={mobileNotificationsRef}
            >

                <div className="icon-btn-wrapper">

                    <button
                        className="icon-btn"
                        onClick={toggleNotifications}
                    >

                        <i className="bi bi-bell-fill"></i>

                        {totalBadgeCount > 0 && (

                            <span className="notification-badge">

                                {totalBadgeCount > 9
                                    ? "9+"
                                    : totalBadgeCount}

                            </span>

                        )}

                    </button>

                    <NotificationPanel

                        show={showNotifications}

                        notifications={notifications}

                        announcements={announcements}

                        announcementsLoading={announcementsLoading}

                        announcementsError={announcementsError}

                        unreadCount={unreadCount}

                        totalBadgeCount={totalBadgeCount}

                        weather={weather}

                        showRainNotice={showRainNotice}

                        markAllAsRead={markAllAsRead}

                        handleNotificationClick={
                            handleNotificationClick
                        }

                        handleWeatherNotificationClick={
                            handleWeatherNotificationClick
                        }

                        formatRelativeTime={
                            formatRelativeTime
                        }

                        describeWeatherCode={
                            describeWeatherCode
                        }

                        getCategoryIcon={
                            getCategoryIcon
                        }

                    />

                </div>

            </div>

            {/* Hamburger */}

            <button
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle Menu"
            >

                <i className="bi bi-list"></i>

            </button>

            {/* Mobile Drawer */}

            <MobileMenu

                username={username}

                mobileMenuRef={mobileMenuRef}

                showMobileMenu={showMobileMenu}

                setShowMobileMenu={
                    setShowMobileMenu
                }

                setShowNotifications={
                    setShowNotifications
                }

                totalBadgeCount={
                    totalBadgeCount
                }

                handleHomeClick={
                    handleHomeClick
                }

                handleNavClick={
                    handleNavClick
                }

                openNewsPage={
                    openNewsPage
                }

                openReportsPage={
                    openReportsPage
                }

                openSettingsPage={
                    openSettingsPage
                }

                handleNavigation={
                    handleNavigation
                }

            />

        </>

    );

}