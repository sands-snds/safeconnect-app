import React from "react";

export default function NotificationPanel({
    show,
    notifications,

    announcements,
    announcementsLoading,
    announcementsError,

    unreadCount,
    showRainNotice,

    weather,

    totalBadgeCount,

    markAllAsRead,

    handleNotificationClick,
    handleWeatherNotificationClick,

    formatRelativeTime,
    describeWeatherCode,
    getCategoryIcon
}) {
    if (!show) return null;
    return (
        <div className="panel-dropdown show">
            <div className="panel-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>
                        Mark all as read
                    </button>
                )}

            </div>
            {/* WEATHER */}
            {showRainNotice && weather && (
                <div
                    className="notification-item unread"
                    onClick={handleWeatherNotificationClick}
                >
                    <div className="notification-icon">
                        <i
                            className={`bi ${describeWeatherCode(weather.code).icon}`}
                        />
                    </div>

                    <div className="notification-text">
                        <p className="n-title">
                            Weather Advisory
                        </p>

                        <p className="n-message">
                            It's possible to rain today
                            {" "}
                            ({weather.rainChance}% chance).
                            High {weather.tMax}°C,
                            low {weather.tMin}°C.
                        </p>

                        <span className="n-time">
                            Today
                        </span>
                    </div>
                    <span className="unread-dot"></span>
                </div>
            )}

            {announcementsLoading &&
                notifications.length === 0 && (

                <div className="notification-empty">
                    Loading...
                </div>

            )}

            {!announcementsLoading &&
                announcementsError &&
                notifications.length === 0 && (

                <div className="notification-empty">
                    {announcementsError}
                </div>

            )}

            {!announcementsLoading &&
                !announcementsError &&
                notifications.length === 0 &&
                !showRainNotice && (

                <div className="notification-empty">
                    No announcements yet.
                </div>

            )}

            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={`notification-item ${n.unread ? "unread" : ""}`}
                    onClick={() =>
                        handleNotificationClick(n.id)
                    }
                >
                    <div className="notification-icon">
                        <i
                            className={`bi ${getCategoryIcon(n.category)}`}
                        />
                    </div>

                    <div className="notification-text">
                        <p className="n-title">
                            {n.title}
                        </p>

                        <p className="n-message">
                            {n.message}
                        </p>

                        <span className="n-time">
                            {formatRelativeTime(n.date)}
                        </span>
                    </div>

                    {n.unread && (
                        <span className="unread-dot"></span>
                    )}
                </div>
            ))}
        </div>
    );

}