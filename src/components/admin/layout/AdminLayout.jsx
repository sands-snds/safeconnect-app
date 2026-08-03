import React from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({
    children,

    activeView,
    pageTitle,
    alerts,

    onNavigate,
    onLogout,

    showMobileMenu,
    onCloseMobileMenu,
    onToggleMobileMenu,

    onRefresh,
    isRefreshing,
    lastUpdate,
    notifications,
    unreadCount,
    onMarkAllRead
}) => {

    return (
        <div className="admin-container">

            <div
                style={{
                    display: "flex",
                    flex: 1
                }}
            >
                <AdminSidebar
                    activeView={activeView}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={onCloseMobileMenu}
                />

                <main className="main-content">
                    <AdminHeader
                        title={pageTitle}
                        alerts={alerts}
                        onToggleMobileMenu={onToggleMobileMenu}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        lastUpdate={lastUpdate}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAllRead={onMarkAllRead}
                    />

                    <div
                        style={{
                            padding: "24px 32px"
                        }}
                    >
                        {children}
                    </div>
                </main>

            </div>

        </div>
    );
};

export default AdminLayout;