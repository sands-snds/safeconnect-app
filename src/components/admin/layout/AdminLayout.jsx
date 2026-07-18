import React from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({
    children,

    activeView,
    onNavigate,

    onLogout,

    showMobileMenu,
    onCloseMobileMenu,
    onToggleMobileMenu,

    onRefresh,
    isRefreshing,
    lastUpdate
}) => {
    return (
        <div className="admin-container">

            <AdminHeader
                onToggleMobileMenu={onToggleMobileMenu}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                lastUpdate={lastUpdate}
            />

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

                <div className="main-content">
                    {children}
                </div>

            </div>

        </div>
    );
};

export default AdminLayout;