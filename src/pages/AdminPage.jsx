import React, { useState, useEffect } from 'react';
import '../styles/admin.css';
import { getSeverityColor } from "../components/admin/dashboard/chartConstants";

import AdminDashboard from '../components/admin/AdminDashboard';
import AdminLayout from "../components/admin/layout/AdminLayout";
import UsersPage from "../components/admin/pages/UsersPage";
import LogsPage from "../components/admin/logs/LogsPage";
import ReportsPage from "../components/admin/pages/ReportsPage";
import AnnouncementsPage from "../components/admin/announcements/AnnouncementsPage";
import useAdminData from "../components/admin/hooks/useAdminData";
import useAdminAuth from "../components/admin/hooks/useAdminAuth";
import useAdminNavigation from "../components/admin/hooks/useAdminNavigation";
import FormModal from '../components/admin/AdminModals/FormModal';

const AdminPage = () => {
  const {
    isAuthenticated,
    setIsAuthenticated,
    showSigninModal,
    setShowSignInModal,
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

    loadAllData,
    loadAnnouncements,
    handleRefresh,
    updateStatus,
    handleFormSubmit
  } = useAdminData();

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

  const [filters, setFilters] = useState({
    emergency: { status: 'All Items', search: '' },
    assistance: { status: 'All Items', search: '' },
    users: { status: 'All Items', search: '' },
    signins: { status: 'All Items', search: '' },
    adminLogs: { status: 'All Items', search: '' },
    announcements: { status: 'All Items', search: '' },
    pettyCrime: { status: 'All Items', search: '' }
  });
  
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

  loadAllData();

  const interval = setInterval(() => {
    if (activeView !== "create-announcement") {
      loadAllData();
    }
  }, 30000);

  return () => clearInterval(interval);
}, [isAuthenticated, activeView]);

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

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <AdminDashboard
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
                  activeView={activeView}

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

                  setActiveView={setActiveView}
              />
          );

      case "registered-users":
        return (
            <UsersPage
                registeredUsers={registeredUsers}
                filters={filters}
                setFilters={setFilters}
                onUpdateStatus={updateStatus}
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
          <AdminDashboard
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
          />
        );
    }
  };
  return (
      <>
          <AdminLayout
              activeView={activeView}
              onNavigate={handleNavigation}
              onLogout={handleLogout}

              showMobileMenu={showMobileMenu}
              onCloseMobileMenu={closeMobileMenu}
              onToggleMobileMenu={toggleMobileMenu}

              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              lastUpdate={lastUpdate}
          >
              {isAuthenticated
                  ? renderActiveView()
                  : null}
          </AdminLayout>

          {showModal && (
              <FormModal
                  title={`Add New ${
                      showModal === "emergency"
                          ? "Emergency Report"
                          : "Assistance Request"
                  }`}
                  onClose={() => setShowModal(null)}
                  onSubmit={(e) => {
                      handleFormSubmit(e, showModal);
                      setShowModal(null);
                  }}
                  type={showModal}
              />
          )}

      </>
  );
};

export default AdminPage;