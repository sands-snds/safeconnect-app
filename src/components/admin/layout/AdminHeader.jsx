import React, { useState } from "react";

const AdminHeader = ({
    title = "Dashboard",
    alerts = [],
    onRefresh,
    isRefreshing,
    lastUpdate
}) => {

    const [showNotifications, setShowNotifications] =
        useState(false);

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

                <button onClick={onRefresh} disabled={isRefreshing}
                    style={{
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: "18px"
                    }} >
                    {isRefreshing ? "…" : "↻"}
                </button>

                <button onClick={() =>
                        setShowNotifications(!showNotifications) }
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

                    {alerts.length > 0 && (
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
                            {alerts.length}
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
                            width: 300,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            boxShadow:
                                "0 15px 30px rgba(0,0,0,.08)",
                            padding: 16
                        }}
                    >
                        <h3
                            style={{
                                marginTop: 0
                            }}
                        >
                            Notifications
                        </h3>

                        {alerts.length === 0 ? (
                            <p>No pending reports.</p>
                        ) : (
                            alerts.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: "10px 0",
                                        borderBottom:
                                            "1px solid #f3f4f6"
                                    }}
                                >
                                    {item}
                                </div>
                            ))
                        )}

                        {lastUpdate && (

                            <div
                                style={{
                                    marginTop: 15,
                                    color: "#6b7280",
                                    fontSize: 12
                                }}
                            >
                                Last updated{" "}
                                {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHeader;