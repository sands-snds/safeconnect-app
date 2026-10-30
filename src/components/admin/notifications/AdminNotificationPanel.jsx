import React, { useState } from 'react';
import { timeAgo } from '../shared/timeUtils';
import { notificationType } from './notificationTypes';

// The admin bell's dropdown, in the same style as the residents' bell
// (.panel-* / .notification-* classes in components/resident/navbar/NavbarStyle.css).
// Only recent notifications: everything else is on the Notifications page.
const RECENT = 8;

export default function AdminNotificationPanel({ notifications, unreadCount, onMarkAllRead, onOpen, onSeeAll, onClose }) {
  const [tab, setTab] = useState('unread');

  const list = notifications.filter((n) => (tab === 'unread' ? !n.isRead : n.isRead)).slice(0, RECENT);

  return (
    <div className="panel-dropdown show admin-notif-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <h4>Notifications</h4>
          {unreadCount > 0 && <span className="panel-unread-badge">{unreadCount}</span>}
        </div>
        <div className="panel-header-actions">
          {unreadCount > 0 && (
            <button type="button" onClick={onMarkAllRead}>
              <i className="bi bi-check2-all"></i> Mark all as read
            </button>
          )}
          <button type="button" className="panel-close-btn" onClick={onClose} aria-label="Close notifications">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
        <button type="button" className={`panel-tab ${tab === 'read' ? 'active' : ''}`} onClick={() => setTab('read')}>
          Read
        </button>
      </div>

      <div className="panel-list">
        {list.length === 0 && (
          <div className="notification-empty">
            <i className={`bi ${tab === 'unread' ? 'bi-check2-circle' : 'bi-bell-slash'}`}></i>
            <p>{tab === 'unread' ? "You're all caught up." : 'No read notifications yet.'}</p>
          </div>
        )}

        {list.map((n) => {
          const { icon, color } = notificationType(n.type);
          return (
            <div key={n.id} className={`notification-item ${n.isRead ? '' : 'unread'}`} onClick={() => onOpen(n)}>
              <div className="notification-icon" style={n.isRead ? { background: `${color}18`, color } : { background: color, color: '#fff' }}>
                <i className={`bi ${icon}`} />
              </div>
              <div className="notification-text">
                <p className="n-title">{n.title}</p>
                <p className="n-message">{n.message}</p>
                <span className="n-time">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.isRead && <span className="unread-dot"></span>}
            </div>
          );
        })}
      </div>

      <button type="button" className="panel-footer-link" onClick={onSeeAll}>
        See all notifications <i className="bi bi-arrow-right"></i>
      </button>
    </div>
  );
}
