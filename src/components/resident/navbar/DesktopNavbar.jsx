import React from "react";

import NotificationPanel from "./NotificationPanel";
import UserDropdown from "./UserDropdown";

export default function DesktopNavbar({

    username,

    dropdownRef,
    notificationsRef,

    showDropdown,
    showNotifications,

    notifications,
    announcements,
    announcementsLoading,
    announcementsError,

    unreadCount,
    totalBadgeCount,

    weather,
    showRainNotice,

    markAllAsRead,

    toggleDropdown,
    toggleNotifications,

    handleNotificationClick,
    handleWeatherNotificationClick,

    formatRelativeTime,
    describeWeatherCode,
    getCategoryIcon,

    handleHomeClick,
    handleNavClick,
    openNewsPage,
    openReportsPage,
    openSettingsPage,
    handleNavigation

}) {

    return (

        <div className="resident-nav-links">

            <button
                className="resident-nav-item active"
                onClick={handleHomeClick}
            >
                <i className="bi bi-house-door-fill"></i>
                <span>Home</span>
            </button>

            <button
                className="resident-nav-item"
                onClick={(e) =>
                    handleNavClick(
                        e,
                        "emergency-report"
                    )
                }
            >
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Emergency</span>
            </button>

            <button
                className="resident-nav-item"
                onClick={openNewsPage}
            >
                <i className="bi bi-newspaper"></i>
                <span>News</span>
            </button>

            <div
                className="icon-btn-wrapper"
                ref={notificationsRef}
            >

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

                    announcementsLoading={
                        announcementsLoading
                    }

                    announcementsError={
                        announcementsError
                    }

                    unreadCount={unreadCount}

                    totalBadgeCount={
                        totalBadgeCount
                    }

                    weather={weather}

                    showRainNotice={
                        showRainNotice
                    }

                    markAllAsRead={
                        markAllAsRead
                    }

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

            <UserDropdown

                username={username}

                dropdownRef={dropdownRef}

                showDropdown={showDropdown}

                onToggleDropdown={toggleDropdown}

                onOpenReports={
                    openReportsPage
                }

                onOpenSettings={
                    openSettingsPage
                }

                onLogout={() =>
                    handleNavigation("/")
                }

            />

        </div>

    );

}