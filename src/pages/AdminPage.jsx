import React, { useState, useEffect, useRef } from 'react';
import '../styles/admin.css';
import { getSeverityColor } from "../components/admin/shared/chartUtils";

import Dashboard from '../components/admin/dashboard/Dashboard';
import AdminLayout from "../components/admin/layout/AdminLayout";
import UsersPage from "../components/admin/users/UsersPage";
import LogsPage from "../components/admin/logs/LogsPage";
import ReportsPage from "../components/admin/reports/ReportsPage";
import AnnouncementsPage from "../components/admin/announcements/AnnouncementsPage";
import PettyCrimePage from '../components/admin/reports/pettyCrime';
import useAdminData from "../components/admin/hooks/useAdminData";
import useAdminAuth from "../components/admin/hooks/useAdminAuth";
import useAdminNavigation from "../components/admin/hooks/useAdminNavigation";
import FormModal from '../components/admin/AdminModals/FormModal';
import SignInModal from '../components/admin/AdminModals/SignInModal';

const AdminPage = () => {
  const {
    isAuthenticated,
    setIsAuthenticated,
    showSigninModal,
    setShowSignInModal,
    isSuperAdmin,
    sessionExpired,
    setSessionExpired,
    adminUser,
    setAdminUser,
    handleLogout
  } = useAdminAuth();
  
  const {
    isLoading,
    isRefreshing,
    lastUpdate,

    emergencyReports,
    assistanceRequests,
    registeredUsers,
    signInLogs,
    adminLogs,
    announcements,
    pettyCrimeReports,
    notifications,
    unreadCount,
    markAllRead,
    markOneRead,

    loadAllData,
    refreshAllData,   
    loadAnnouncements,
    handleRefresh,
    updateStatus,
    updateUserRole,
    handleFormSubmit
  } = useAdminData({ isSuperAdmin });

  const {
    activeView,
    setActiveView,
    showModal,
    setShowModal,
    showMobileMenu,
    editingAnnouncement,
    setEditingAnnouncement,
    toggleMobileMenu,
    closeMobileMenu,
    handleNavigation,
    handleStatCardClick
  } = useAdminNavigation();

  // Dashboard's "Create Announcement" shortcut needs to both navigate to the
  // Announcements tab and open the create modal once there -- navigation
  // alone would just land on the list. See AnnouncementsTable.jsx's
  // pendingCreateAnnouncement effect for the other half of this.
  const [pendingCreateAnnouncement, setPendingCreateAnnouncement] = useState(false);

  const handleCreateAnnouncementShortcut = () => {
    setPendingCreateAnnouncement(true);
    handleNavigation("announcement-page");
  };

  const [filters, setFilters] = useState({
    emergency: { status: 'All Items', search: '' },
    assistance: { status: 'All Items', search: '' },
    users: { status: 'All Items', search: '', role: 'All Roles' },
    signins: { status: 'All Items', search: '' },
    adminLogs: { status: 'All Items', search: '', admin: '' },
    announcements: { status: 'All Items', search: '' },
    pettyCrime: { status: 'All Items', search: '' }
  });

  const PAGE_TITLES = {
  dashboard: "Dashboard",
  "emergency-reports": "Emergency Reports",
  "assistance-requests": "Assistance Requests",
  "petty-crime-reports": "Petty Crime Reports",
  "announcement-page": "Announcements",
  "create-announcement": "Create Announcement",
  "registered-users": "Registered Users",
  "sign-in-logs": "Sign-in Logs",
  "admin-logs": "Admin Logs"
};

// Tabs under SYSTEM in the sidebar: super admin only.
const SYSTEM_VIEWS = ["registered-users", "sign-in-logs", "admin-logs"];

  const alerts = [];
    const emergencyPending =
        emergencyReports.filter(r => r.status !== "Resolved").length;

    if (emergencyPending > 0)
        alerts.push(`🚨 ${emergencyPending} Emergency Reports Pending`);

    const assistancePending =
        assistanceRequests.filter(r => r.status !== "Approved").length;

    if (assistancePending > 0)
        alerts.push(`🤝 ${assistancePending} Assistance Requests Pending`);

    const crimePending =
        pettyCrimeReports.filter(r => r.status !== "Resolved").length;

    if (crimePending > 0)
        alerts.push(`🚔 ${crimePending} Crime Reports Pending`);
  
  useEffect(() => {
    if (!showSigninModal && sessionStorage.getItem('adminAuthenticated') === 'true' && !isAuthenticated) {
        setIsAuthenticated(true);
    }
  }, [showSigninModal, isAuthenticated]);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMobileMenu]);

useEffect(() => {
    if (!isAuthenticated) return;

    // Initial load only
    loadAllData();
}, [isAuthenticated]);

// The role can arrive after the first load (it comes from the profile
// fetch), so load the System tab data once it turns out to be a super admin.
const wasSuperAdmin = useRef(isSuperAdmin);
useEffect(() => {
    if (isAuthenticated && isSuperAdmin && !wasSuperAdmin.current) {
        refreshAllData();
    }
    wasSuperAdmin.current = isSuperAdmin;
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated, isSuperAdmin]);

useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
        // Don't refresh while creating/editing announcements
        if (
            activeView !== "create-announcement" &&
            activeView !== "announcement-page"
        ) {
            refreshAllData();
        }
    }, 30000);

    return () => clearInterval(interval);
}, [isAuthenticated, activeView, refreshAllData]);

  if (!isAuthenticated && !showSigninModal) {
    return null;
  }
  
  if (isLoading && isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ 
          fontSize: '48px', 
          animation: 'spin 1s linear infinite' 
        }}>⟳</div>
        <p style={{ fontSize: '18px' }}>Loading data...</p>
      </div>
    );
  }

  const adminName =
    adminUser?.fullName || adminUser?.username || "Administrator";

  // Normal admins never see the System tabs; fall back to the dashboard if
  // one is somehow selected (e.g. a stat card or a demoted super admin).
  const visibleView = !isSuperAdmin && SYSTEM_VIEWS.includes(activeView)
    ? "dashboard"
    : activeView;

  const renderActiveView = () => {
    switch (visibleView) {
      case 'dashboard':
        return (
          <Dashboard
            emergencyReports={emergencyReports}
            assistanceRequests={assistanceRequests}
            registeredUsers={registeredUsers}
            signInLogs={signInLogs}
            adminLogs={adminLogs} 
            announcements={announcements}
            pettyCrimeReports={pettyCrimeReports}
            onShowSignInModal={() => setShowSignInModal(true)}
            onStatCardClick={handleStatCardClick}
            getSeverityColor={getSeverityColor}
            onNavigate={handleNavigation}
            onCreateAnnouncement={handleCreateAnnouncementShortcut}
            adminName={adminName}
            isSuperAdmin={isSuperAdmin}
          />
        );
      case "emergency-reports":
      case "assistance-requests":
      case "petty-crime-reports":
          return (
              <ReportsPage
                  activeView={activeView}

                  emergencyReports={emergencyReports}
                  assistanceRequests={assistanceRequests}
                  pettyCrimeReports={pettyCrimeReports}

                  filters={filters}
                  setFilters={setFilters}

                  onUpdateStatus={updateStatus}

                  getSeverityColor={getSeverityColor}
              />
          );

      case "create-announcement":
      case "announcement-page":
          return (
              <AnnouncementsPage
                  editingAnnouncement={
                      editingAnnouncement
                  }

                  setEditingAnnouncement={
                      setEditingAnnouncement
                  }

                  filters={filters}

                  setFilters={setFilters}

                  loadAnnouncements={
                      loadAnnouncements
                  }

                  pendingCreateAnnouncement={pendingCreateAnnouncement}
                  onConsumePendingCreateAnnouncement={() => setPendingCreateAnnouncement(false)}
              />
          );

      case "registered-users":
        return (
            <UsersPage
                registeredUsers={registeredUsers}
                filters={filters}
                setFilters={setFilters}
                onUpdateStatus={updateStatus}
                onUpdateRole={updateUserRole}
                currentAdminId={adminUser?.id}
            />
        );
      case "sign-in-logs":
      case "admin-logs":
          return (
              <LogsPage
                  activeView={activeView}
                  signInLogs={signInLogs}
                  adminLogs={adminLogs}
                  filters={filters}
                  setFilters={setFilters}
              />
          );
      default:

        return (
          <Dashboard
            emergencyReports={emergencyReports}
            assistanceRequests={assistanceRequests}
            registeredUsers={registeredUsers}
            signInLogs={signInLogs}
            adminLogs={adminLogs} 
            announcements={announcements}
            pettyCrimeReports={pettyCrimeReports}
            onShowSignInModal={() => setShowSignInModal(true)}
            onStatCardClick={handleStatCardClick}
            getSeverityColor={getSeverityColor}
            onNavigate={handleNavigation}
            onCreateAnnouncement={handleCreateAnnouncementShortcut}
            adminName={adminName}
            isSuperAdmin={isSuperAdmin}
          />
        );
    }
  };
  return (
      <>
          <AdminLayout
            activeView={visibleView}
            pageTitle={PAGE_TITLES[visibleView] || "Dashboard"}
            isSuperAdmin={isSuperAdmin}
            alerts={alerts}

            onNavigate={handleNavigation}
            onLogout={handleLogout}

            showMobileMenu={showMobileMenu}
            onCloseMobileMenu={closeMobileMenu}
            onToggleMobileMenu={toggleMobileMenu}

            onRefresh={() => handleRefresh(activeView)}
            isRefreshing={isRefreshing}
            lastUpdate={lastUpdate}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
            onMarkOneRead={markOneRead}
            adminUser={adminUser}
          >
              {isAuthenticated
                  ? renderActiveView()
                  : null}
          </AdminLayout>

          {showSigninModal && (
              <SignInModal
                  notice={sessionExpired
                      ? "Your session has ended. Please sign in again to continue. Anything you were typing is still there."
                      : ""}
                  onSuccess={(user) => {
                      setAdminUser(user || null);
                      setIsAuthenticated(true);
                      setShowSignInModal(false);
                      setSessionExpired(false);
                  }}
              />
          )}

          {showModal && (
              <FormModal
                  title={`Add New ${
                      showModal === "emergency"
                          ? "Emergency Report"
                          : "Assistance Request"
                  }`}
                  onClose={() => setShowModal(null)}
                  onSubmit={async (e) => {
                      await handleFormSubmit(e, showModal);
                      setShowModal(null);
                  }}
                  type={showModal}
              />
          )}

      </>
  );
};

export default AdminPage;