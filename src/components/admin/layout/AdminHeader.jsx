import React, { useState } from "react";

const timeAgo = (isoString) => {
    if (!isoString) return "";
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const AdminHeader = ({
    title = "Dashboard",
    onRefresh,
    isRefreshing,
    lastUpdate,
    notifications = [],
    unreadCount = 0,
    onMarkAllRead
}) => {

const [showNotifications, setShowNotifications] = useState(false);

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
                .admin-header-refresh-icon.spinning {
                    display: inline-block;
                    animation: adminHeaderSpin 0.8s linear infinite;
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
                    gap: "18px",
                    position: "relative"
                }}
            >

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <button onClick={onRefresh} disabled={isRefreshing}
                        title="Refresh data"
                        style={{
                            border: "1px solid #e5e7eb",
                            background: isRefreshing ? "#f3f4f6" : "#fff",
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            cursor: isRefreshing ? "wait" : "pointer",
                            fontSize: "18px"
                        }} >
                        <span className={`admin-header-refresh-icon${isRefreshing ? " spinning" : ""}`}>
                            ↻
                        </span>
                    </button>
                    {lastUpdate && (
                        <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" }}>
                            {isRefreshing ? "Refreshing…" : `Updated ${timeAgo(lastUpdate)}`}
                        </span>
                    )}
                </div>

                <button onClick={() => setShowNotifications(!showNotifications)}
                    style={{
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        cursor: "pointer",
                        position: "relative",
                        fontSize: "18px"
                    }} > 🔔

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

                <div style={{ display: "flex",
                        alignItems: "center",
                        gap: 12
                    }} >

                    <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            background: "#6B2C3E",
                            color: "#fff",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontWeight: 700
                        }} >
                        A
                    </div>
                </div>

                {showNotifications && (
                    <div
                        style={{
                            position: "absolute",
                            top: 60,
                            right: 0,
                            width: 340,
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
                                notifications.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #f3f4f6",
                                            background: item.isRead ? "#fff" : "#fdf4f5",
                                            display: "flex",
                                            gap: 10,
                                            alignItems: "flex-start"
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
                                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                                                {timeAgo(item.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHeader;
