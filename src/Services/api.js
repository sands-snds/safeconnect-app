// REST client for the Node/Express + MySQL backend. Endpoint paths below
// match the Express routes in backend/routes/*.js exactly:
//   /api/emergency-reports, /api/assistance-requests, /api/petty-crimes,
//   /api/users, /api/logs/*, /api/announcements, /api/auth, /api/reports.

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

// The backend returns uploaded images as relative paths (e.g. "/uploads/x.jpg")
// via multer. Since the frontend and backend run on different origins/ports,
// those need to be resolved to a full URL before being used in <img src>.
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const resolveAssetUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${ASSET_BASE}${path}`;
};

// mysql2 returns DATE columns as full ISO datetime strings
// (e.g. "2026-08-01T00:00:00.000Z"), which MySQL itself won't accept back
// on an UPDATE. Normalize to plain YYYY-MM-DD for display and round-tripping.
const toDateOnly = (value) => {
  if (!value) return value;
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
};

export const API_ENDPOINTS = {
  emergencyReports: `${API_BASE}/emergency-reports`,
  assistanceRequests: `${API_BASE}/assistance-requests`,
  registeredUsers: `${API_BASE}/users`,
  signInLogs: `${API_BASE}/logs/signin`,
  adminLogs: `${API_BASE}/logs/admin`,
  announcements: `${API_BASE}/announcements`,
  pettyCrimes: `${API_BASE}/petty-crimes`,
  notifications: `${API_BASE}/notifications`,
  auth: `${API_BASE}/auth`
};

export const SHEETDB_APIS = API_ENDPOINTS;

// ========================================
// AUTH TOKEN STORAGE
// ========================================
// The backend issues a JWT on successful signin (see authController.signin).
// It's stored here so every subsequent protected request can attach it.

// Admin and resident sessions are kept under separate keys. Previously both
// used a single "authToken" key, so signing into one role in the same
// browser silently clobbered the other's token in localStorage -- the admin
// panel kept rendering (sessionStorage.adminAuthenticated stayed true) but
// every request suddenly carried a resident's token, causing every
// admin-only endpoint to reject it as "admin access only".
const ADMIN_TOKEN_KEY = "adminAuthToken";
const RESIDENT_TOKEN_KEY = "residentAuthToken";

// Reading/clearing happens after navigation into /admin or /resident, so the
// current path reliably tells us which session is active.
const activeTokenKey = () => (window.location.pathname.startsWith("/admin") ? ADMIN_TOKEN_KEY : RESIDENT_TOKEN_KEY);

// Writing happens right after sign-in, while still on the landing page ("/")
// -- before the redirect -- so the path isn't reliable yet. isAdmin (from
// the signin response) tells us which key to use instead.
export const setAuthToken = (token, isAdmin = false) => {
  if (token) localStorage.setItem(isAdmin ? ADMIN_TOKEN_KEY : RESIDENT_TOKEN_KEY, token);
};

export const getAuthToken = () => localStorage.getItem(activeTokenKey());

export const clearAuthToken = () => localStorage.removeItem(activeTokenKey());

// Merges an Authorization header onto whatever headers were passed in.
// Safe to call even when there's no token (protected routes will then
// correctly respond with 401, same as if the header were simply absent).
const authHeaders = (extra = {}) => {
  const token = getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

// ========================================
// RATE LIMITING & CACHING
// ========================================

const requestCache = new Map();
const CACHE_DURATION = 0;

let isFetching = false;
let fetchPromise = null;

const fetchWithCache = async (url, options = {}, retries = 3) => {
  const now = Date.now();
  const cacheKey = url;
  const cached = requestCache.get(cacheKey);

  const mergedOptions = {
    ...options,
    headers: authHeaders(options.headers || {})
  };

  if (!mergedOptions.method || mergedOptions.method === "GET") {
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached data for:', url);
      return cached.data;
    }
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, mergedOptions);
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      requestCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

// ========================================
// AUTH: SIGN UP / SIGN IN
// ========================================

export const signupUser = async (fullName, email, password, extra = {}) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.auth}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, ...extra })
    });

    const result = await response.json();
    return result; // { success, message }
  } catch (error) {
    console.error('❌ Error signing up:', error);
    return { success: false, message: 'Could not reach the server. Please check your connection and try again.' };
  }
};

// On success this returns a JWT in `result.token`. Callers are responsible
// for persisting it via setAuthToken(result.token) so later requests are
// authenticated.
export const signinUser = async (email, password) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.auth}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    return result; // { success, isAdmin, token, user?, message }
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
    const data = await fetchWithCache(API_ENDPOINTS.emergencyReports);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      reference: item.report_reference || '',
      reporter: item.reporter_name || '',
      phone: item.contact_number || '',
      emergency: item.emergency_type || '',
      severity: item.severity || '',
      location: item.location || '',
      date: item.time || '',
      status: item.status || 'Received',
      description: item.incident_details || '',
      peopleAffected: item.number_of_people_affected || '0',
      specialNeeds: item.special_needs || '',
      photoUrl: item.photo_url || '',
      mediaType: item.media_type || ''
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
    const data = await fetchWithCache(API_ENDPOINTS.assistanceRequests);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      reference: item.report_reference || '',
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
    const data = await fetchWithCache(API_ENDPOINTS.registeredUsers);

    return data.map((item, index) => ({
      id: item.id || index + 1,
      fullName: item.full_name || '',
      username: item.username || '',
      contact: item.contact_number || '',
      email: item.email_address || '',
      role: item.role || 'resident',
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
    const data = await fetchWithCache(API_ENDPOINTS.signInLogs);

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
    const data = await fetchWithCache(API_ENDPOINTS.adminLogs);

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
// GET is public (no auth needed); create/update/delete/link-preview are
// admin-only and require a token, attached automatically below.

export const fetchAnnouncements = async () => {
  try {
    const data = await fetchWithCache(API_ENDPOINTS.announcements);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      title: item.title || '',
      category: item.category || '',
      message: item.message || '',
      date: toDateOnly(item.date_posted) || '',
      imageUrl: resolveAssetUrl(item.image_path) || null,
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

    const response = await fetch(API_ENDPOINTS.announcements, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.announcements);
    return result;
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const updateAnnouncement = async (id, announcement) => {
  try {
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
    } else if (announcement.removeImage) {
      formData.append('remove_image', '1');
    }

    const response = await fetch(`${API_ENDPOINTS.announcements}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData
    });

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.announcements);
    return result;
  } catch (error) {
    console.error('Error updating announcement:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const fetchLinkPreview = async (url) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.announcements}/link-preview?url=${encodeURIComponent(url)}`,
      { headers: authHeaders() }
    );
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
    const response = await fetch(`${API_ENDPOINTS.announcements}/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete announcement');

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.announcements);
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
    const data = await fetchWithCache(API_ENDPOINTS.pettyCrimes);

    return data.map(item => ({
      id: parseInt(item.id) || 0,
      reference: item.report_reference || '',
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
    const response = await fetch(API_ENDPOINTS.pettyCrimes, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(report)
    });

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.pettyCrimes);
    return result;
  } catch (error) {
    console.error('Error submitting petty crime report:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const updatePettyCrimeReport = async (data) => {
  try {
    const { id, ...body } = data;
    const response = await fetch(`${API_ENDPOINTS.pettyCrimes}/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update petty crime report",
    };
  }
};

export const deletePettyCrimeReport = async (id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.pettyCrimes}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const result = await response.json();

    requestCache.delete(API_ENDPOINTS.pettyCrimes);

    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const updatePettyCrimeStatus = async (id, newStatus) => {
  return await updateStatus(API_ENDPOINTS.pettyCrimes, id, newStatus);
};

// ========================================
// RESIDENT-FACING REPORT SUBMISSION
// ========================================

export const createEmergencyReport = async (report) => {
  try {
    const response = await fetch(API_ENDPOINTS.emergencyReports, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(report)
    });

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.emergencyReports);
    return result;
  } catch (error) {
    console.error('Error submitting emergency report:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const updateEmergencyReport = async (data) => {
  try {
    const { id, ...body } = data;
    const response = await fetch(`${API_ENDPOINTS.emergencyReports}/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update emergency report",
    };
  }
};

export const deleteEmergencyReport = async (id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.emergencyReports}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const result = await response.json();

    requestCache.delete(API_ENDPOINTS.emergencyReports);

    return result.success;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const createAssistanceRequest = async (request) => {
  try {
    const response = await fetch(API_ENDPOINTS.assistanceRequests, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(request)
    });

    const result = await response.json();
    requestCache.delete(API_ENDPOINTS.assistanceRequests);
    return result;
  } catch (error) {
    console.error('Error submitting assistance request:', error);
    return { success: false, message: 'Could not reach the server. Please try again.' };
  }
};

export const updateAssistanceRequest = async (data) => {
  try {
    const { id, ...body } = data;
    const response = await fetch(`${API_ENDPOINTS.assistanceRequests}/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    return await response.json();
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update assistance request",
    };
  }
};

export const deleteAssistanceRequest = async (id) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.assistanceRequests}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const result = await response.json();

    requestCache.delete(API_ENDPOINTS.assistanceRequests);

    return result.success;
  } catch (error) {
    console.error(error);
    return false;
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
    const response = await fetch(`${apiUrl}/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (result.message) alert(result.message);
      return false;
    }

    requestCache.delete(apiUrl);
    return result.success;
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return false;
  }
};

export const updateEmergencyStatus = async (id, newStatus) => {
  return await updateStatus(API_ENDPOINTS.emergencyReports, id, newStatus);
};

export const updateAssistanceStatus = async (id, newStatus) => {
  return await updateStatus(API_ENDPOINTS.assistanceRequests, id, newStatus);
};

export const updateUserStatus = async (id, newStatus) => {
  return await updateStatus(API_ENDPOINTS.registeredUsers, id, newStatus);
};

/*=========================================
Admin Notifications (header bell)
==========================================*/

export const fetchNotifications = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.notifications, {
      headers: authHeaders()
    });
    const result = await response.json();
    if (!result.success) return { notifications: [], unread: 0 };

    return {
      notifications: result.data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.notification_type,
        referenceId: item.reference_id,
        isRead: Boolean(item.is_read),
        createdAt: item.created_at
      })),
      unread: result.unread
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unread: 0 };
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await fetch(`${API_ENDPOINTS.notifications}/read-all`, {
      method: 'PUT',
      headers: authHeaders()
    });
    const result = await response.json();
    return Boolean(result.success);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
};

// Resident-facing: a signed-in user's own notifications (e.g. the canned
// reply sent when their report's status changes).
export const fetchMyNotifications = async () => {
  try {
    const response = await fetch(`${API_ENDPOINTS.notifications}/mine`, {
      headers: authHeaders()
    });
    const result = await response.json();
    if (!result.success) return [];

    return result.data.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.notification_type,
      referenceId: item.reference_id,
      isRead: Boolean(item.is_read),
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching my notifications:', error);
    return [];
  }
};

export const markAllMyNotificationsRead = async () => {
  try {
    const response = await fetch(`${API_ENDPOINTS.notifications}/mine/read-all`, {
      method: 'PUT',
      headers: authHeaders()
    });
    const result = await response.json();
    return Boolean(result.success);
  } catch (error) {
    console.error('Error marking my notifications as read:', error);
    return false;
  }
};

/*=========================================
User Reports | Profile | Settings
==========================================*/

export const fetchMyReports = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE}/reports/user/${userId}`,
      { headers: authHeaders() }
    );

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const TYPE_LABELS = {
      emergency: 'Emergency',
      assistance: 'Assistance',
      petty_crime: 'Petty Crime'
    };

    return data.map((item) => {
      const type = TYPE_LABELS[item.reportType] || item.reportType;

      const base = {
        id: item.id,
        type,
        reference: item.report_reference || '',
        status: item.status || '',
        location: item.location || item.current_location || '',
        latitude: item.latitude,
        longitude: item.longitude
      };

      if (item.reportType === 'emergency') {
        return {
          ...base,
          title: item.emergency_type || '',
          description: item.incident_details || '',
          date: item.time || '',
          peopleAffected: item.number_of_people_affected,
          specialNeeds: item.special_needs || '',
          photoUrl: item.photo_url || ''
        };
      }

      if (item.reportType === 'assistance') {
        return {
          ...base,
          title: item.request_assistance_type || '',
          description: item.describe_your_situation || '',
          date: item.timestamp || '',
          peopleAffected: item.number_of_people_needing_help,
          specialNeeds: item.special_needs || '',
          urgency: item.urgency_level || ''
        };
      }

      // petty_crime
      return {
        ...base,
        title: item.crime_type || '',
        description: item.description || '',
        date: item.timestamp || '',
        suspectInfo: item.suspect_info || ''
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.registeredUsers}/${userId}`,
      { headers: authHeaders() }
    );

    const data = await response.json();
    if (!response.ok || !data || data.success === false) {
      return { success: false, message: data?.message || 'Failed to load profile.' };
    }

    return {
      success: true,
      user: {
        id: data.id,
        fullName: data.full_name,
        username: data.username,
        contact: data.contact_number,
        email: data.email_address,
        role: data.role,
        status: data.status,
        photoUrl: resolveAssetUrl(data.photo_url) || null
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Could not reach the server.' };
  }
};

export const uploadProfilePhoto = async (userId, imageFile) => {
  try {
    const formData = new FormData();

    formData.append("photo", imageFile);

    const response = await fetch(
      `${API_ENDPOINTS.registeredUsers}/${userId}/photo`,
      {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      }
    );

    const result = await response.json();
    if (result.photoUrl) {
      result.photoUrl = resolveAssetUrl(result.photoUrl);
    }
    return result;
  } catch (error) {
    console.error(error);

    return {
      success: false,
    };
  }
};

export const updateUsername = async (userId, username) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.registeredUsers}/${userId}/username`,
      {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ username }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);

    return {
      success: false,
    };
  }
};

export const changePassword = async (
    userId,
    currentPassword,
    newPassword
) => {
    try {
        const response = await fetch(
            `${API_ENDPOINTS.registeredUsers}/${userId}/password`,
            {
                method: "PATCH",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            }
        );

        return await response.json();
    } catch (error) {
        console.error(error);

        return {
            success: false,
        };
    }
};
