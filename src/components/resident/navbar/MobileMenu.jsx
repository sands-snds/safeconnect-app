import React from "react";

export default function MobileMenu({

    username,

    mobileMenuRef,

    showMobileMenu,

    setShowMobileMenu,
    setShowNotifications,

    totalBadgeCount,

    handleHomeClick,
    handleNavClick,

    openNewsPage,
    openReportsPage,
    openSettingsPage,

    handleNavigation

}) {

    return (

        <>

            <div
                className={`mobile-nav-overlay ${
                    showMobileMenu
                        ? "show"
                        : ""
                }`}
                onClick={() =>
                    setShowMobileMenu(false)
                }
            />

            <div
                ref={mobileMenuRef}
                className={`mobile-nav-menu ${
                    showMobileMenu
                        ? "show"
                        : ""
                }`}
            >

                <button
                    className="mobile-close-button"
                    onClick={() =>
                        setShowMobileMenu(false)
                    }
                >
                    ×
                </button>

                <button
                    className="mobile-nav-item active"
                    onClick={handleHomeClick}
                >
                    <i className="bi bi-house-door-fill"></i>
                    <span>Home</span>
                </button>

                <button
                    className="mobile-nav-item"
                    onClick={(e)=>
                        handleNavClick(
                            e,
                            "emergency-report"
                        )
                    }
                >
                    <i className="bi bi-exclamation-triangle-fill"></i>

                    <span>
                        Emergency
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={(e)=>
                        handleNavClick(
                            e,
                            "assistance-request"
                        )
                    }
                >
                    <i className="bi bi-life-preserver"></i>

                    <span>
                        Assistance
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={openNewsPage}
                >
                    <i className="bi bi-newspaper"></i>

                    <span>
                        News
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={() => {

                        setShowMobileMenu(false);

                        setShowNotifications(true);

                    }}
                >

                    <i className="bi bi-bell-fill"></i>

                    <span>
                        Notifications
                    </span>

                    {totalBadgeCount > 0 && (

                        <span className="notification-badge">

                            {totalBadgeCount > 9
                                ? "9+"
                                : totalBadgeCount}

                        </span>

                    )}

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={openReportsPage}
                >
                    <i className="bi bi-file-earmark-text-fill"></i>

                    <span>
                        My Reports
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={openSettingsPage}
                >
                    <i className="bi bi-gear-fill"></i>

                    <span>
                        Settings
                    </span>

                </button>

                <div
                    className="mobile-user-section"
                >

                    <div
                        className="mobile-user-header"
                    >

                        {username.toUpperCase()}

                    </div>

                    <button
                        className="mobile-nav-item"
                        onClick={() =>
                            handleNavigation("/")
                        }
                    >

                        <i className="bi bi-box-arrow-right"></i>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </div>

        </>

    );

}