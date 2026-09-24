import React, { useState, useEffect, useRef } from "react";
import { timeAgo } from "../shared/timeUtils";

// notification_type (set by the backend services) -> admin tab + link label.
const NOTIFICATION_TARGETS = {
    emergency:          { view: "emergency-reports",   label: "See report" },
    emergency_status:   { view: "emergency-reports",   label: "See report" },
    assistance:         { view: "assistance-requests", label: "See request" },
    assistance_status:  { view: "assistance-requests", label: "See request" },
    petty_crime:        { view: "petty-crime-reports", label: "See report" },
    petty_crime_status: { view: "petty-crime-reports", label: "See report" },
    announcement:       { view: "announcement-page",   label: "See announcement" }
};

const getInitials = (name) =>
    (name || "A")
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const Avatar = ({ photoUrl, name, size = 42 }) =>
    photoUrl ? (
        <img
            src={photoUrl}
            alt="Profile"
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0
            }}
        />
    ) : (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "#6B2C3E",
                color: "#fff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: 700,
                fontSize: size > 42 ? 18 : 15,
                flexShrink: 0
            }}
        >
            {getInitials(name)}
        </div>
    );

const AdminHeader = ({
    title = "Dashboard",
    onRefresh,
    isRefreshing,
    lastUpdate,
    notifications = [],
    unreadCount = 0,
    onMarkAllRead,
    onMarkOneRead,
    onNavigate,
    onLogout,
    adminUser
}) => {

const [showNotifications, setShowNotifications] = useState(false);
const [showUserMenu, setShowUserMenu] = useState(false);
const notificationsRef = useRef(null);
const userMenuRef = useRef(null);

    const adminName = adminUser?.fullName || adminUser?.username || "Administrator";

    // Close whichever dropdown is open when clicking anywhere outside it.
    useEffect(() => {
        if (!showNotifications && !showUserMenu) return;

        const handleClick = (e) => {
            if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showNotifications, showUserMenu]);

    const handleSeeReport = (item, target) => {
        onMarkOneRead?.(item.id);
        setShowNotifications(false);
        onNavigate?.(target.view);
    };

    return (
        <div
            style={{
                background: "#ffffff",
                borderBottom: "1px solid #e5e7eb",
                padding: "18px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                zIndex: 50
            }}
        >
            <style>{`
                @keyframes adminHeaderSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .admin-header-icon-btn {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 42px;
                    height: 42px;
                    padding: 0;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    background: #fff;
                    color: #374151;
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                    transition: background .15s, border-color .15s;
                }
                .admin-header-icon-btn:hover:not(:disabled) {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }
                .admin-header-icon-btn:disabled { background: #f3f4f6; }
                .admin-header-refresh-icon { display: inline-block; }
                .admin-header-refresh-icon.spinning {
                    animation: adminHeaderSpin 0.8s linear infinite;
                }
                .admin-notif-link:hover { text-decoration: underline; }
                .admin-user-menu-item:hover { background: #f9fafb; }
                @media (max-width: 640px) {
                    .admin-user-menu-name,
                    .admin-header-updated { display: none; }
                }
            `}</style>

            {/* Left */}
            <div>
                <h1 style={{
                        margin: 0,
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "#111827"
                    }} >
                    {title}
                </h1>

                <p style={{
                        margin: "4px 0 0",
                        color: "#6b7280",
                        fontSize: "14px"
                    }} >
                    SafeConnect Administration
                </p>
            </div>

            {/* Right */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}
            >

                {lastUpdate && (
                    <span
                        className="admin-header-updated"
                        style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}
                    >
                        {isRefreshing ? "Refreshing…" : `Updated ${timeAgo(lastUpdate)}`}
                    </span>
                )}

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Refresh data"
                    aria-label="Refresh data"
                    className="admin-header-icon-btn"
                    style={{ cursor: isRefreshing ? "wait" : "pointer" }}
                >
                    <i className={`bi bi-arrow-clockwise admin-header-refresh-icon${isRefreshing ? " spinning" : ""}`} />
                </button>

                {/* Notifications */}
                <div ref={notificationsRef} style={{ position: "relative" }}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowUserMenu(false);
                        }}
                        title="Notifications"
                        aria-label="Notifications"
                        className="admin-header-icon-btn"
                    >
                        <i className="bi bi-bell" />

                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: -5,
                                    right: -5,
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    background: "#dc2626",
                                    color: "#fff",
                                    fontSize: 11,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }} >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div
                            style={{
                                position: "absolute",
                                top: 52,
                                right: 0,
                                width: 340,
                                maxWidth: "calc(100vw - 32px)",
                                maxHeight: 420,
                                display: "flex",
                                flexDirection: "column",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                boxShadow:
                                    "0 15px 30px rgba(0,0,0,.08)",
                                overflow: "hidden"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "14px 16px",
                                    borderBottom: "1px solid #f3f4f6"
                                }}
                            >
                                <h3 style={{ margin: 0, fontSize: 15 }}>
                                    Notifications
                                </h3>

                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllRead}
                                        style={{
                                            border: "none",
                                            background: "none",
                                            color: "#6B2C3E",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            padding: 0
                                        }}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div style={{ overflowY: "auto" }}>
                                {notifications.length === 0 ? (
                                    <p style={{ padding: 16, margin: 0, color: "#6b7280", fontSize: 13 }}>
                                        Nothing yet.
                                    </p>
                                ) : (
                                    notifications.map((item) => {
                                        const target = NOTIFICATION_TARGETS[item.type];

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => onMarkOneRead?.(item.id)}
                                                style={{
                                                    padding: "12px 16px",
                                                    borderBottom: "1px solid #f3f4f6",
                                                    background: item.isRead ? "#fff" : "#fdf4f5",
                                                    display: "flex",
                                                    gap: 10,
                                                    alignItems: "flex-start",
                                                    cursor: item.isRead ? "default" : "pointer"
                                                }}
                                            >
                                                {!item.isRead && (
                                                    <span style={{
                                                        marginTop: 5,
                                                        width: 7,
                                                        height: 7,
                                                        borderRadius: "50%",
                                                        background: "#dc2626",
                                                        flexShrink: 0
                                                    }} />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: item.isRead ? 400 : 600, color: "#111827" }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{ fontSize: 12.5, color: "#4b5563", marginTop: 2 }}>
                                                        {item.message}
                                                    </div>
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginTop: 4
                                                    }}>
                                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                                            {timeAgo(item.createdAt)}
                                                        </span>
                                                        {target && (
                                                            <button
                                                                className="admin-notif-link"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSeeReport(item, target);
                                                                }}
                                                                style={{
                                                                    border: "none",
                                                                    background: "none",
                                                                    color: "#6B2C3E",
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: "pointer",
                                                                    padding: 0
                                                                }}
                                                            >
                                                                {target.label} →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin user menu */}
                <div ref={userMenuRef} style={{ position: "relative" }}>
                    <button
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowNotifications(false);
                        }}
                        title={adminName}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        <Avatar photoUrl={adminUser?.photoUrl} name={adminName} />
                        <span
                            className="admin-user-menu-name"
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#111827",
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {adminName}
                        </span>
                        <i className="bi bi-chevron-down" style={{ fontSize: "0.75rem", color: "#6b7280" }} />
                    </button>

                    {showUserMenu && (
                        <div
                            style={{
                                position: "absolute",
                                top: 52,
                                right: 0,
                                width: 260,
                                maxWidth: "calc(100vw - 32px)",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                boxShadow: "0 15px 30px rgba(0,0,0,.08)",
                                overflow: "hidden"
                            }}
                        >
                            {/* mini profile card */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: 16
                            }}>
                                <Avatar photoUrl={adminUser?.photoUrl} name={adminName} size={48} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: "#111827",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {adminName}
                                    </div>
                                    {adminUser?.email && (
                                        <div style={{
                                            fontSize: 12,
                                            color: "#6b7280",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}>
                                            {adminUser.email}
                                        </div>
                                    )}
                                    <span style={{
                                        display: "inline-block",
                                        marginTop: 6,
                                        background: "#FDECEC",
                                        color: "#6B2C3E",
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}>
                                        Administrator
                                    </span>
                                </div>
                            </div>

                            <div style={{ borderTop: "1px solid #f3f4f6" }} />

                            <button
                                className="admin-user-menu-item"
                                onClick={() => {
                                    setShowUserMenu(false);
                                    onNavigate?.("admin-logs");
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    fontSize: 13.5,
                                    color: "#374151",
                                    textAlign: "left"
                                }}
                            >
                                <i className="bi bi-shield-lock-fill" />
                                <span>Admin Logs</span>
                            </button>

                            <button
                                className="admin-user-menu-item"
                                onClick={() => {
                                    setShowUserMenu(false);
                                    onLogout?.();
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    fontSize: 13.5,
                                    color: "#dc2626",
                                    textAlign: "left"
                                }}
                            >
                                <i className="bi bi-box-arrow-right" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminHeader;
