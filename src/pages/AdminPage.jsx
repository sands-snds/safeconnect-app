import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';

import { 
  fetchEmergencyReports, 
  fetchAssistanceRequests,
  fetchRegisteredUsers,
  fetchSignInLogs,
  fetchAdminLogs,
  fetchAnnouncements,
  fetchPettyCrimes,
  updateStatus as updateSheetStatus,
  SHEETDB_APIS
} from '../Services/api';

import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboard from '../components/admin/AdminDashboard';

import EmergencyReportsTable from '../components/admin/Admintables/EmergencyReportsTable';
import AssistanceRequestsTable from '../components/admin/Admintables/AssistanceRequestsTable';
import RegisteredUsersTable from '../components/admin/Admintables/RegisteredUsersTable';
import SignInLogsTable from '../components/admin/Admintables/SignInLogsTable';
import AdminLogsTable from '../components/admin/Admintables/AdminLogsTable';
import AnnouncementsTable from '../components/admin/Admintables/AnnouncementsTable';
import PettyCrimeReportsTable from '../components/admin/Admintables/PettyCrimeReportsTable';

import FormModal from '../components/admin/AdminModals/FormModal';
import CreateAnnouncementView from '../components/admin/CreateAnnouncementView';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [showModal, setShowModal] = useState(null);
  
  const initialAuth = sessionStorage.getItem('adminAuthenticated') === 'true';
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  
  const [showSigninModal, setShowSignInModal] = useState(!initialAuth);
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [emergencyReports, setEmergencyReports] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [signInLogs, setSignInLogs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pettyCrimeReports, setPettyCrimeReports] = useState([]);

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

  const loadEmergencyReports = async () => { 
    try {
      const data = await fetchEmergencyReports();
      setEmergencyReports(data);
    } catch (error) {
      console.error('Failed to load emergency reports:', error);
    }
  };
  const loadAssistanceRequests = async () => {  
    try {
      const data = await fetchAssistanceRequests();
      setAssistanceRequests(data);
    } catch (error) {
      console.error('Failed to load assistance requests:', error);
    }
  };
  const loadRegisteredUsers = async () => { 
    try {
      const data = await fetchRegisteredUsers();
      setRegisteredUsers(data);
    } catch (error) {
      console.error('Failed to load registered users:', error);
    }
  };
  const loadSignInLogs = async () => { 
    try {
      const data = await fetchSignInLogs();
      setSignInLogs(data);
    } catch (error) {
      console.error('Failed to load sign-in logs:', error);
    }
  };
  const loadAdminLogs = async () => { 
    try {
      const data = await fetchAdminLogs();
      setAdminLogs(data);
    } catch (error) {
      console.error('Failed to load admin logs:', error);
    }
  };
  const loadAnnouncements = async () => {
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };
  const loadPettyCrimeReports = async () => {
    try {
      const data = await fetchPettyCrimes();
      setPettyCrimeReports(data);
    } catch (error) {
      console.error('Failed to load petty crime reports:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEmergencyReports(),
        loadAssistanceRequests(),
        loadRegisteredUsers(),
        loadSignInLogs(),
        loadAdminLogs(),
        loadAnnouncements(),
        loadPettyCrimeReports()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
  if (!isAuthenticated) return;

  loadAllData();

  const interval = setInterval(() => {
    // Don't refresh while creating an announcement
    if (activeView !== "create-announcement") {
      loadAllData();
    }
  }, 30000);

  return () => clearInterval(interval);
}, [isAuthenticated, activeView]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    setShowSignInModal(true); 
    navigate('/');
  };

  const handleStatCardClick = (view) => {
    setActiveView(view);
    closeMobileMenu();
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleNavigation = (view) => {
    // Any navigation triggered from the sidebar is a "fresh" navigation,
    // so make sure we're not still carrying over an announcement being edited.
    setEditingAnnouncement(null);
    setActiveView(view);
    closeMobileMenu();
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setActiveView('create-announcement');
    closeMobileMenu();
  };

  const filterData = (data, filterType, statusKey = 'status') => {
    let filtered = data;
    const currentFilter = filters[filterType];

    if (currentFilter.status !== 'All Items') {
      filtered = filtered.filter(item => item[statusKey] === currentFilter.status);
    }

    if (currentFilter.search) {
      const searchLower = currentFilter.search.toLowerCase();
      filtered = filtered.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchLower)
        );
      });
    }
    return filtered;
  };

  const updateStatus = async (id, newStatus, type) => {
    try {
      let success = false;
      
      if (type === 'emergency') {
        success = await updateSheetStatus(SHEETDB_APIS.emergencyReports, id, newStatus);
        if (success) {
          setEmergencyReports(prev => 
            prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
          );
          alert('Status updated successfully!');
        } else {
          alert('Failed to update status in database.');
        }
      } else if (type === 'assistance') {
        success = await updateSheetStatus(SHEETDB_APIS.assistanceRequests, id, newStatus);
        if (success) {
          setAssistanceRequests(prev => 
            prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
          );
          alert('Status updated successfully!');
        } else {
          alert('Failed to update status in database.');
        }
      } else if (type === 'users') {
        setRegisteredUsers(prev => 
          prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
        );
        alert('Status updated successfully! (Local update only)');
      } else if (type === 'pettyCrime') {
        success = await updateSheetStatus(SHEETDB_APIS.pettyCrimes, id, newStatus);
        if (success) {
          setPettyCrimeReports(prev => 
            prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
          );
          alert('Status updated successfully!');
        } else {
          alert('Failed to update status in database.');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleFormSubmit = (e, type) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (type === 'emergency') {
      const newReport = {
        id: emergencyReports.length + 1,
        reporter: formData.get('reporter'),
        phone: formData.get('phone'),
        emergency: formData.get('emergency'),
        severity: formData.get('severity'),
        location: formData.get('location'),
        description: formData.get('description'),
        date: formatDate(formData.get('date')),
        status: 'Received'
      };
      setEmergencyReports(prev => [...prev, newReport]);
      alert('Emergency report submitted successfully!');
    } else if (type === 'assistance') {
      const newRequest = {
        id: assistanceRequests.length + 1,
        requester: formData.get('requester'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        assistanceType: formData.get('assistanceType'),
        peopleAffected: parseInt(formData.get('peopleAffected')),
        location: formData.get('location'),
        description: formData.get('description'),
        date: formatDate(formData.get('date')),
        status: 'Pending'
      };
      setAssistanceRequests(prev => [...prev, newRequest]);
      alert('Assistance request submitted successfully!');
    }
    
    setShowModal(null);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': '#16a34a',
      'Medium': '#ca8a04',
      'High': '#ea580c',
      'Critical': '#dc2626'
    };
    return colors[severity] || '#6b7280';
  };

  const filteredEmergencyReports = filterData(emergencyReports, 'emergency');
  const filteredAssistanceRequests = filterData(assistanceRequests, 'assistance');
  const filteredUsers = filterData(registeredUsers, 'users');
  const filteredSignIns = filterData(signInLogs, 'signins', 'status');
  const filteredAdminLogs = filterData(adminLogs, 'adminLogs', 'status'); 
  const filteredPettyCrimeReports = filterData(pettyCrimeReports, 'pettyCrime');

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
      case 'emergency-reports':
        return (
          <EmergencyReportsTable
            data={filteredEmergencyReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={updateStatus}
            onAddNew={() => setShowModal('emergency')}
            getSeverityColor={getSeverityColor}
          />
        );
      case 'assistance-requests':
        return (
          <AssistanceRequestsTable
            data={filteredAssistanceRequests}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={updateStatus}
          />
        );
      case 'petty-crime-reports':
        return (
          <PettyCrimeReportsTable
            data={filteredPettyCrimeReports}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={updateStatus}
          />
        );
      case 'create-announcement':
        return (
          <CreateAnnouncementView
            editingAnnouncement={editingAnnouncement}
            onCreated={() => {
              loadAnnouncements();
              setEditingAnnouncement(null);
              setActiveView('announcement-page');
            }}
            onCancel={() => {
              setEditingAnnouncement(null);
              setActiveView('announcement-page');
            }}
          />
        );
      case 'announcement-page':
        return (
          <AnnouncementsTable
            filters={filters}
            setFilters={setFilters}
            onEdit={handleEditAnnouncement}
          />
        );
      case 'registered-users':
        return (
          <RegisteredUsersTable
            data={filteredUsers}
            filters={filters}
            setFilters={setFilters}
            onUpdateStatus={updateStatus}
          />
        );
      case 'sign-in-logs':
        return (
          <SignInLogsTable
            data={filteredSignIns}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 'admin-logs':
        return (
          <AdminLogsTable
            data={filteredAdminLogs}
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
    <div className="admin-container">
      <AdminHeader 
        onToggleMobileMenu={toggleMobileMenu}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate}
      />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar
          activeView={activeView}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
          showMobileMenu={showMobileMenu}
          onCloseMobileMenu={closeMobileMenu}
        />

        <div className="main-content">
          {isAuthenticated ? renderActiveView() : null}
        </div>
      </div>

      {showModal && (
        <FormModal
          title={`Add New ${showModal === 'emergency' ? 'Emergency Report' : 'Assistance Request'}`}
          onClose={() => setShowModal(null)}
          onSubmit={(e) => handleFormSubmit(e, showModal)}
          type={showModal}
        />
      )}
    </div>
  );
};

export default AdminPage;