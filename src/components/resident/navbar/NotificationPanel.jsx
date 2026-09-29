import React, { useState } from "react";

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
    getCategoryIcon,
    getCategoryColor,

    onViewAll
}) {
    const [tab, setTab] = useState('all');

    if (!show) return null;

    const colorOf = (category) => (getCategoryColor ? getCategoryColor(category) : '#6B2C3E');
    const hasWeather = tab === 'all' && showRainNotice && weather;
    const visibleNotifications = tab === 'unread' ? notifications.filter((n) => n.unread) : notifications;
    const isLoadingFirstLoad = announcementsLoading && notifications.length === 0;
    const hasError = !announcementsLoading && announcementsError && notifications.length === 0;
    const isEmpty = !isLoadingFirstLoad && !hasError && visibleNotifications.length === 0 && !hasWeather;

    return (
        <div className="panel-dropdown show">
            <div className="panel-header">
                <div className="panel-header-title">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && <span className="panel-unread-badge">{unreadCount}</span>}
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>
                        <i className="bi bi-check2-all"></i> Mark all read
                    </button>
                )}
            </div>

            <div className="panel-tabs">
                <button className={`panel-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                    All
                </button>
                <button className={`panel-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
                    Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
            </div>

            <div className="panel-list">
                {hasWeather && (
                    <div className="notification-item unread" onClick={handleWeatherNotificationClick}>
                        <div className="notification-icon" style={{ background: '#3b82f6', color: '#fff' }}>
                            <i className={`bi ${describeWeatherCode(weather.code).icon}`} />
                        </div>
                        <div className="notification-text">
                            <p className="n-title">Weather Advisory</p>
                            <p className="n-message">
                                It's possible to rain today ({weather.rainChance}% chance).
                                High {weather.tMax}°C, low {weather.tMin}°C.
                            </p>
                            <span className="n-time">Today</span>
                        </div>
                        <span className="unread-dot"></span>
                    </div>
                )}

                {isLoadingFirstLoad && (
                    <div className="notification-skeleton">
                        {[1, 2, 3].map((i) => (
                            <div className="skeleton-row" key={i}>
                                <div className="skeleton-dot"></div>
                                <div className="skeleton-lines">
                                    <div className="skeleton-bar" style={{ width: '55%' }}></div>
                                    <div className="skeleton-bar" style={{ width: '88%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasError && (
                    <div className="notification-empty">
                        <i className="bi bi-exclamation-circle"></i>
                        <p>{announcementsError}</p>
                    </div>
                )}

                {isEmpty && (
                    <div className="notification-empty">
                        <i className={`bi ${tab === 'unread' ? 'bi-check2-circle' : 'bi-bell-slash'}`}></i>
                        <p>{tab === 'unread' ? "You're all caught up!" : 'No notifications yet.'}</p>
                    </div>
                )}

                {visibleNotifications.map((n) => {
                    const color = colorOf(n.category);
                    return (
                        <div
                            key={n.id}
                            className={`notification-item ${n.unread ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(n.id)}
                        >
                            <div
                                className="notification-icon"
                                style={n.unread ? { background: color, color: '#fff' } : { background: `${color}18`, color }}
                            >
                                <i className={`bi ${getCategoryIcon(n.category)}`} />
                            </div>

                            <div className="notification-text">
                                <div className="n-title-row">
                                    <p className="n-title">{n.title}</p>
                                    {n.isPersonal && <span className="n-tag">Your Report</span>}
                                </div>
                                <p className="n-message">{n.message}</p>
                                <span className="n-time">{formatRelativeTime(n.date)}</span>
                            </div>

                            {n.unread && <span className="unread-dot"></span>}
                        </div>
                    );
                })}
            </div>

            {onViewAll && (
                <button className="panel-footer-link" onClick={onViewAll}>
                    View all announcements <i className="bi bi-arrow-right"></i>
                </button>
            )}
        </div>
    );
}
