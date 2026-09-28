import React from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({
    children,

    activeView,
    isSuperAdmin,
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
    onMarkAllRead,
    onMarkOneRead,
    adminUser
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
                    isSuperAdmin={isSuperAdmin}
                    onNavigate={onNavigate}
                    onLogout={onLogout}
                    showMobileMenu={showMobileMenu}
                    onCloseMobileMenu={onCloseMobileMenu}
                    adminUser={adminUser}
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
                        onMarkOneRead={onMarkOneRead}
                        onNavigate={onNavigate}
                        onLogout={onLogout}
                        isSuperAdmin={isSuperAdmin}
                        adminUser={adminUser}
                    />

                    {/* Padding lives in admin.css (.admin-page-body) so phones get narrower margins. */}
                    <div className="admin-page-body">
                        {children}
                    </div>
                </main>

            </div>

        </div>
    );
};

export default AdminLayout;