import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import SwipeToArchive from "./SwipeToArchive";

const UNDO_MS = 5000;

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

    onViewAll,
    onClose,
    onArchive
}) {
    const { t } = useLanguage();
    const [tab, setTab] = useState('all');
    // The last notification swiped away, for "Undo".
    const [undoId, setUndoId] = useState(null);

    useEffect(() => {
        if (undoId === null) return undefined;
        const timer = setTimeout(() => setUndoId(null), UNDO_MS);
        return () => clearTimeout(timer);
    }, [undoId]);

    const archiveOne = (id) => {
        onArchive([id], true);
        setUndoId(id);
    };

    const undoArchive = () => {
        if (undoId === null) return;
        onArchive([undoId], false);
        setUndoId(null);
    };

    if (!show) return null;

    const colorOf = (category) => (getCategoryColor ? getCategoryColor(category) : '#6B2C3E');
    
    const hasWeather = Boolean(showRainNotice && weather);
    const badgeCount = totalBadgeCount ?? unreadCount;
    const visibleNotifications = tab === 'unread' ? notifications.filter((n) => n.unread) : notifications;
    const isLoadingFirstLoad = announcementsLoading && notifications.length === 0;
    const hasError = !announcementsLoading && announcementsError && notifications.length === 0;
    const isEmpty = !isLoadingFirstLoad && !hasError && visibleNotifications.length === 0 && !hasWeather;

    return (
        <div className="panel-dropdown show">
            <div className="panel-header">
                <div className="panel-header-title">
                    <h4>{t('notificationPanel.title')}</h4>
                    {badgeCount > 0 && <span className="panel-unread-badge">{badgeCount}</span>}
                </div>
                <div className="panel-header-actions">
                    {badgeCount > 0 && (
                        <button onClick={markAllAsRead}>
                            <i className="bi bi-check2-all"></i> {t('notificationPanel.markAllRead')}
                        </button>
                    )}
                    {onClose && (
                        <button className="panel-close-btn" onClick={onClose} aria-label="Close notifications">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="panel-tabs">
                <button className={`panel-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                    {t('notificationPanel.all')}
                </button>
                <button className={`panel-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
                    {t('notificationPanel.unread')}{badgeCount > 0 ? ` (${badgeCount})` : ''}
                </button>
            </div>

            <div className="panel-list">
                {hasWeather && (
                    <div className="notification-item unread" onClick={handleWeatherNotificationClick}>
                        <div className="notification-icon" style={{ background: '#3b82f6', color: '#fff' }}>
                            <i className={`bi ${describeWeatherCode(weather.code).icon}`} />
                        </div>
                        <div className="notification-text">
                            <p className="n-title">{t('notificationPanel.weatherAdvisory')}</p>
                            <p className="n-message">
                                {t('notificationPanel.weatherBody', { chance: weather.rainChance, tMax: weather.tMax, tMin: weather.tMin })}
                            </p>
                            <span className="n-time">{t('notificationPanel.today')}</span>
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
                        <p>{tab === 'unread' ? t('notificationPanel.caughtUp') : t('notificationPanel.noNotifications')}</p>
                    </div>
                )}

                {visibleNotifications.map((n) => {
                    const color = colorOf(n.category);
                    return (
                        <SwipeToArchive key={n.id} onArchive={onArchive ? () => archiveOne(n.id) : null} label={t('notificationPanel.archive')}>
                        <div
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
                                    {n.isPersonal && <span className="n-tag">{t('notificationPanel.yourReport')}</span>}
                                </div>
                                <p className="n-message">{n.message}</p>
                                <span className="n-time">{formatRelativeTime(n.date)}</span>
                            </div>

                            {n.unread && <span className="unread-dot"></span>}
                        </div>
                        </SwipeToArchive>
                    );
                })}
            </div>

            {undoId !== null && (
                <div className="panel-undo" role="status">
                    <span><i className="bi bi-archive-fill" aria-hidden="true"></i> {t('notificationPanel.archived')}</span>
                    <button type="button" onClick={undoArchive}>{t('notificationsPage.undo')}</button>
                </div>
            )}

            {onViewAll && (
                <button className="panel-footer-link" onClick={onViewAll}>
                    {t('notificationPanel.viewAll')} <i className="bi bi-arrow-right"></i>
                </button>
            )}
        </div>
    );
}
