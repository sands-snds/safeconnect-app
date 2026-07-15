const API_BASE = "http://localhost/safeconnect-app/backend";

export const SHEETDB_APIS = {
  emergencyReports: `${API_BASE}/emergency.php`,
  assistanceRequests: `${API_BASE}/assistance.php`,
  registeredUsers: `${API_BASE}/auth.php`,
  signInLogs: `${API_BASE}/logs.php`,
  adminLogs: `${API_BASE}/logs.php`,
  announcements: `${API_BASE}/announcements.php`,
  pettyCrimes: `${API_BASE}/pettycrime.php`
};

// ========================================
// RATE LIMITING & CACHING
// ========================================

const requestCache = new Map();
const CACHE_DURATION = 0;

let isFetching = false;
let fetchPromise = null;

const fetchWithCache = async (url, retries = 3) => {
  const now = Date.now();
  const cached = requestCache.get(url);

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('📦 Using cached data for:', url);
    return cached.data;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      requestCache.set(url, { data, timestamp: now });
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

// ========================================
// AUTH: SIGN UP / SIGN IN
// ========================================

export const signupUser = async (fullName, email, password) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.registeredUsers}?action=signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    });

    const result = await response.json();
    return result; // { success, message }
  } catch (error) {
    console.error('❌ Error signing up:', error);
    return { success: false, message: 'Could not reach the server. Please check your connection and try again.' };
  }
};

export const signinUser = async (email, password) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.registeredUsers}?action=signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    return result; // { success, isAdmin, user?, message }
  } catch (error) {
    console.error('❌ Error signing in:', error);
    return { success: false, message: 'Could not reach the server. Please check your connection and try again.' };
  }
};

// ========================================
// FETCH EMERGENCY REPORTS
// ========================================

export const fetchEmergencyReports = async () => {
  try {
    const url = `${SHEETDB_APIS.emergencyReports}?action=list`;
    const data = await fetchWithCache(url);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      reporter: item.reporter_name || '',
      phone: item.contact_number || '',
      emergency: item.emergency_type || '',
      severity: item.severity || '',
      location: item.location || '',
      date: item.time || '',
      status: item.status || 'Received',
      description: item.incident_details || '',
      peopleAffected: item.number_of_people_affected || '0',
      photoUrl: item.photo_url || ''
    }));
  } catch (error) {
    console.error('Error fetching emergency reports:', error);
    return [];
  }
};

// ========================================
// FETCH ASSISTANCE REQUESTS
// ========================================

export const fetchAssistanceRequests = async () => {
  try {
    const url = `${SHEETDB_APIS.assistanceRequests}?action=list`;
    const data = await fetchWithCache(url);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      requester: item.full_name || '',
      phone: item.contact_number || '',
      email: item.email_address || '',
      assistanceType: item.request_assistance_type || '',
      peopleAffected: item.number_of_people_needing_help || '0',
      location: item.current_location || '',
      date: item.timestamp || '',
      status: item.status || 'Pending',
      description: item.describe_your_situation || '',
      urgency: item.urgency_level || '',
      specialNeeds: item.special_needs || ''
    }));
  } catch (error) {
    console.error('Error fetching assistance requests:', error);
    return [];
  }
};

// ========================================
// FETCH REGISTERED USERS
// ========================================

export const fetchRegisteredUsers = async () => {
  try {
    const url = `${SHEETDB_APIS.registeredUsers}?action=users`;
    const data = await fetchWithCache(url);

    return data.map((item, index) => ({
      id: item.id || index + 1,
      fullName: item.full_name || '',
      username: item.username || '',
      contact: item.contact_number || '',
      email: item.email_address || '',
      dateRegistered: item.created_at || new Date().toLocaleDateString(),
      status: item.status || 'Active'
    }));
  } catch (error) {
    console.error('Error fetching registered users:', error);
    return [];
  }
};

// ========================================
// FETCH SIGN IN LOGS
// ========================================

export const fetchSignInLogs = async () => {
  try {
    const url = `${SHEETDB_APIS.signInLogs}?action=signin`;
    const data = await fetchWithCache(url);

    return data.map((item, index) => ({
      id: item.id || index + 1,
      fullName: item.full_name || '',
      email: item.email_address || '',
      loginTime: item.timestamp || new Date().toLocaleString(),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      device: 'Browser',
      status: item.status || 'Success'
    }));
  } catch (error) {
    console.error('Error fetching sign-in logs:', error);
    return [];
  }
};

// ========================================
// FETCH ADMIN LOGS
// ========================================

export const fetchAdminLogs = async () => {
  try {
    const url = `${SHEETDB_APIS.adminLogs}?action=admin`;
    const data = await fetchWithCache(url);

    return data.map((item, index) => ({
      id: item.id || index + 1,
      email: item.email_address || '',
      timestamp: item.login_time || new Date().toLocaleString(),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      device: navigator.userAgent.includes('Chrome') ? 'Chrome Browser' : 'Unknown Browser',
      status: 'Success'
    }));
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
};

// ========================================
// ANNOUNCEMENTS
// ========================================

export const fetchAnnouncements = async () => {
  try {
    const url = `${SHEETDB_APIS.announcements}?action=list`;
    const data = await fetchWithCache(url);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      title: item.title || '',
      category: item.category || '',
      message: item.message || '',
      date: item.date_posted || '',
      imageUrl: item.image_path || null,
      sourceUrl: item.source_url || null,
      sourceTitle: item.source_title || null,
      sourceImage: item.source_image || null,
      sourceSite: item.source_site || null
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
};

export const createAnnouncement = async (announcement) => {
  try {
    // Always send as multipart form data — announcements.php accepts this whether
    // or not an image is attached, and it's required when one is.
    const formData = new FormData();
    formData.append('title', announcement.title);
    formData.append('category', announcement.category);
    formData.append('message', announcement.message);
    formData.append('date', announcement.date);
    if (announcement.sourceUrl) {
      formData.append('source_url', announcement.sourceUrl);
    }
    if (announcement.imageFile) {
      formData.append('image', announcement.imageFile);
    }

    const response = await fetch(`${SHEETDB_APIS.announcements}?action=create`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    requestCache.delete(`${SHEETDB_APIS.announcements}?action=list`);
    return result;
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const fetchLinkPreview = async (url) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.announcements}?action=link-preview&url=${encodeURIComponent(url)}`);
    const result = await response.json();
    if (!response.ok) {
      return { success: false, message: result.message || 'Could not read that link.' };
    }
    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.announcements}?action=delete&id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete announcement');

    const result = await response.json();
    requestCache.delete(`${SHEETDB_APIS.announcements}?action=list`);
    return result.success;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return false;
  }
};

// ========================================
// PETTY CRIMES
// ========================================

export const fetchPettyCrimes = async () => {
  try {
    const url = `${SHEETDB_APIS.pettyCrimes}?action=list`;
    const data = await fetchWithCache(url);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      crimeType: item.crime_type || '',
      reporter: item.reporter_name || '',
      phone: item.contact_number || '',
      location: item.location || '',
      description: item.description || '',
      suspectInfo: item.suspect_info || '',
      date: item.timestamp || '',
      status: item.status || 'Received'
    }));
  } catch (error) {
    console.error('Error fetching petty crime reports:', error);
    return [];
  }
};

export const createPettyCrimeReport = async (report) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.pettyCrimes}?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });

    const result = await response.json();
    requestCache.delete(`${SHEETDB_APIS.pettyCrimes}?action=list`);
    return result;
  } catch (error) {
    console.error('Error submitting petty crime report:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const updatePettyCrimeStatus = async (id, newStatus) => {
  return await updateStatus(SHEETDB_APIS.pettyCrimes, id, newStatus);
};

// ========================================
// RESIDENT-FACING REPORT SUBMISSION
// ========================================

export const createEmergencyReport = async (report) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.emergencyReports}?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });

    const result = await response.json();
    requestCache.delete(`${SHEETDB_APIS.emergencyReports}?action=list`);
    return result;
  } catch (error) {
    console.error('Error submitting emergency report:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const createAssistanceRequest = async (request) => {
  try {
    const response = await fetch(`${SHEETDB_APIS.assistanceRequests}?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const result = await response.json();
    requestCache.delete(`${SHEETDB_APIS.assistanceRequests}?action=list`);
    return result;
  } catch (error) {
    console.error('Error submitting assistance request:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

// ========================================
// FETCH ALL DATA
// ========================================

export const fetchAllData = async () => {
  if (isFetching && fetchPromise) {
    console.log('⏳ Already fetching data, waiting...');
    return fetchPromise;
  }

  isFetching = true;

  fetchPromise = (async () => {
    try {
      const emergencyReports = await fetchEmergencyReports();
      const assistanceRequests = await fetchAssistanceRequests();
      const registeredUsers = await fetchRegisteredUsers();
      const signInLogs = await fetchSignInLogs();
      const adminLogs = await fetchAdminLogs();
      const announcements = await fetchAnnouncements();
      const pettyCrimes = await fetchPettyCrimes();

      return {
        emergencyReports,
        assistanceRequests,
        registeredUsers,
        signInLogs,
        adminLogs,
        announcements,
        pettyCrimes
      };
    } finally {
      setTimeout(() => {
        isFetching = false;
        fetchPromise = null;
      }, 2000);
    }
  })();

  return fetchPromise;
};

// ========================================
// UPDATE STATUS FUNCTIONS
// ========================================

export const updateStatus = async (apiUrl, id, newStatus) => {
  try {
    const response = await fetch(`${apiUrl}?action=update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update status');

    const result = await response.json();
    requestCache.delete(apiUrl);
    return result.success;
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return false;
  }
};

export const updateEmergencyStatus = async (id, newStatus) => {
  return await updateStatus(SHEETDB_APIS.emergencyReports, id, newStatus);
};

export const updateAssistanceStatus = async (id, newStatus) => {
  return await updateStatus(SHEETDB_APIS.assistanceRequests, id, newStatus);
};

export const updateUserStatus = async (id, newStatus) => {
  return await updateStatus(SHEETDB_APIS.registeredUsers, id, newStatus);
};