import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import LanguageToggle from "../../shared/LanguageToggle";

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

    const { t } = useLanguage();

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
                    <span>{t('residentNav.home')}</span>
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
                        {t('residentNav.emergency')}
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={openNewsPage}
                >
                    <i className="bi bi-newspaper"></i>

                    <span>
                        {t('residentNav.news')}
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
                        {t('residentNav.notifications')}
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
                        {t('residentNav.myReports')}
                    </span>

                </button>

                <button
                    className="mobile-nav-item"
                    onClick={openSettingsPage}
                >
                    <i className="bi bi-gear-fill"></i>

                    <span>
                        {t('residentNav.settings')}
                    </span>

                </button>

                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <LanguageToggle variant="light" />
                </div>

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
                            {t('residentNav.logout')}
                        </span>

                    </button>

                </div>

            </div>

        </>

    );

}