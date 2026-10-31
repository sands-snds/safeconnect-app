import React, { useState, useEffect, useRef } from 'react';
import '../styles/admin.css';

import Dashboard from '../components/admin/dashboard/Dashboard';
import AdminLayout from "../components/admin/layout/AdminLayout";
import UsersPage from "../components/admin/users/UsersPage";
import LogsPage from "../components/admin/logs/LogsPage";
import SiteContactsPage from "../components/admin/settings/SiteContactsPage";
import SiteContentsPage from "../components/admin/settings/SiteContentsPage";
import AccountSettingsPage from "../components/admin/settings/AccountSettingsPage";
import AdminDemoPopup from "../components/admin/AdminModals/AdminDemoPopup";
import ReportsPage from "../components/admin/reports/ReportsPage";
import AnnouncementsPage from "../components/admin/announcements/AnnouncementsPage";
import NotificationsPage from "../components/admin/notifications/NotificationsPage";
import useAdminData from "../components/admin/hooks/useAdminData";
import useAdminAuth from "../components/admin/hooks/useAdminAuth";
import useAdminNavigation from "../components/admin/hooks/useAdminNavigation";
import SignInModal from '../components/admin/AdminModals/SignInModal';
import { refreshSyncedState, useSyncOnFocus } from '../components/shared/useSyncedState';
import useLiveUpdates from '../components/shared/useLiveUpdates';
import useTabNotifications from '../components/shared/useTabNotifications';
import { useLanguage } from '../i18n/LanguageContext';
import { setAdminLanguage } from '../i18n/adminText';

const AdminPage = () => {
  const { language } = useLanguage();
  setAdminLanguage(language);

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
    handleLogout,
    authChecked
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
    markManyRead,
    archiveNotifications,

    loadAllData,
    refreshAllData,
    loadAnnouncements,
    loadNotifications,
    handleRefresh,
    updateStatus,
    updateUserRole,
    setUserArchived,
    setReportArchived
  } = useAdminData({ isSuperAdmin });

  const {
    activeView,
    showMobileMenu,
    editingAnnouncement,
    setEditingAnnouncement,
    toggleMobileMenu,
    closeMobileMenu,
    handleNavigation,
    handleStatCardClick,
    focus,
    clearFocus
  } = useAdminNavigation();

  const [pendingCreateAnnouncement, setPendingCreateAnnouncement] = useState(false);

  const [showDemo, setShowDemo] = useState(false);

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
  notifications: "Notifications",
  "emergency-reports": "Emergency Reports",
  "assistance-requests": "Assistance Requests",
  "petty-crime-reports": "Petty Crime Reports",
  "announcement-page": "Announcements",
  "create-announcement": "Create Announcement",
  "registered-users": "Registered Users",
  "sign-in-logs": "Resident Logs",
  "admin-logs": "Admin Logs",
  "site-contacts": "Page Contacts",
  "site-contents": "Page Contents",
  "account-settings": "Account Settings"
};

const ADMIN_ONLY_VIEWS = ["registered-users", "sign-in-logs", "admin-logs", "site-contacts", "site-contents"];

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
    if (authChecked && !showSigninModal && sessionStorage.getItem('adminAuthenticated') === 'true' && !isAuthenticated) {
        setIsAuthenticated(true);
    }
  }, [authChecked, showSigninModal, isAuthenticated, setIsAuthenticated]);

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
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated]);

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

  useSyncOnFocus(isAuthenticated);

  useLiveUpdates(isAuthenticated, {
    'admin-notifications': () => refreshAllData(),
    announcements: loadAnnouncements,
    state: refreshSyncedState,
    reconnected: () => { refreshAllData(); refreshSyncedState(); loadNotifications(); }
  });

  useTabNotifications(isAuthenticated ? unreadCount : 0);

  if (!authChecked) {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: '#f5f2f3', color: '#374151' }}>
        <div className="spinner-border" style={{ color: '#6B2C3E' }} aria-hidden="true"></div>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>Checking your sign-in...</p>
      </div>
    );
  }

  if (!isAuthenticated && !showSigninModal) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #6B2C3E 0%, #3d1823 100%)' }}>
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
      </div>
    );
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

  const visibleView = !isSuperAdmin && ADMIN_ONLY_VIEWS.includes(activeView)
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
            onNavigate={handleNavigation}
            onCreateAnnouncement={handleCreateAnnouncementShortcut}
            adminName={adminName}
            isSuperAdmin={isSuperAdmin}
          />
        );
      case "notifications":
          return (
              <NotificationsPage
                  notifications={notifications}
                  onMarkOneRead={markOneRead}
                  onMarkManyRead={markManyRead}
                  onMarkAllRead={markAllRead}
                  onArchive={archiveNotifications}
                  onNavigate={handleNavigation}
                  focus={focus && focus.view === "notifications" ? focus : null}
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
                  onArchive={setReportArchived}
                  onRefresh={() => handleRefresh(activeView)}
                  isSuperAdmin={isSuperAdmin}
                  focusId={focus && focus.view === activeView ? focus.id : null}
                  onClearFocus={clearFocus}

                    />
          );

      case "create-announcement":
      case "announcement-page":
          return (
              <AnnouncementsPage
                  isSuperAdmin={isSuperAdmin}
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
                onArchiveUser={setUserArchived}
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
                  isSuperAdmin={isSuperAdmin}
                  onRefresh={() => handleRefresh(activeView)}
              />
          );
      case "site-contacts":
          return <SiteContactsPage />;
      case "site-contents":
          return <SiteContentsPage />;
      case "account-settings":
          return (
              <AccountSettingsPage
                  adminUser={adminUser}
                  onProfileUpdate={(updates) => setAdminUser({ ...(adminUser || {}), ...updates })}
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
            onWatchDemo={() => setShowDemo(true)}
          >
              {isAuthenticated
                  ? renderActiveView()
                  : null}
          </AdminLayout>

          {isAuthenticated && (
              <AdminDemoPopup
                  userId={adminUser?.id}
                  manualOpen={showDemo}
                  onManualClose={() => setShowDemo(false)}
              />
          )}

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


      </>
  );
};

export default AdminPage;