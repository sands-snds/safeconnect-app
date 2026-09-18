const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
const ASSET_BASE = process.env.REACT_APP_ASSET_BASE || "http://localhost:5000";

export const API_ENDPOINTS = {
    AUTH:               `${API_BASE}/auth`,
    USERS:              `${API_BASE}/users`,
    REPORTS:            `${API_BASE}/reports`,
    EMERGENCY_REPORTS:  `${API_BASE}/emergency-reports`,
    ASSISTANCE:         `${API_BASE}/assistance-requests`,
    PETTY_CRIMES:       `${API_BASE}/petty-crimes`,
    ANNOUNCEMENTS:      `${API_BASE}/announcements`,
    LOGS:               `${API_BASE}/logs`,
    DASHBOARD:          `${API_BASE}/dashboard`,
    EXPORT:             `${API_BASE}/export`,
    NOTIFICATIONS:      `${API_BASE}/notifications`,
    SETTINGS:           `${API_BASE}/settings`,
};

export const SHEETDB_APIS = {};

// ── Auth token helpers ────────────────────────────────────────────────────────
export const getAuthToken = () => localStorage.getItem("authToken");

export const setAuthToken = (token, isAdmin = false) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
};

export const clearAuthToken = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
};

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
});

const authHeadersNoContentType = () => ({
    Authorization: `Bearer ${getAuthToken()}`,
});

// ── Asset URL resolver ────────────────────────────────────────────────────────
export const resolveAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
    return `${ASSET_BASE}${path}`;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signinUser = async (email, password) => {
    const res = await fetch(`${API_ENDPOINTS.AUTH}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
};

export const signupUser = async (fullName, email, password, extra = {}) => {
    const res = await fetch(`${API_ENDPOINTS.AUTH}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, ...extra }),
    });
    return res.json();
};

// ── User profile ──────────────────────────────────────────────────────────────
export const fetchUserProfile = async (userId) => {
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (data && data.user) {
        data.user.photoUrl = resolveAssetUrl(data.user.photo_url || data.user.photoUrl);
    }
    return data;
};

export const updateUsername = async (userId, username) => {
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/username`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ username }),
    });
    return res.json();
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.json();
};

export const uploadProfilePhoto = async (userId, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/photo`, {
        method: "POST",
        headers: authHeadersNoContentType(),
        body: formData,
    });
    const data = await res.json();
    if (data?.photoUrl) data.photoUrl = resolveAssetUrl(data.photoUrl);
    return data;
};

// ── Registered users (admin) ──────────────────────────────────────────────────
export const fetchRegisteredUsers = async () => {
    const res = await fetch(`${API_ENDPOINTS.USERS}`, { headers: authHeaders() });
    return res.json();
};

export const updateUserStatus = async (userId, status) => {
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

// ── Emergency reports ─────────────────────────────────────────────────────────
export const fetchEmergencyReports = async () => {
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}`, { headers: authHeaders() });
    return res.json();
};

// Accepts FormData (with optional media files) or a plain object.
export const createEmergencyReport = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updateEmergencyReport = async ({ id, ...data }) => {
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateEmergencyStatus = async (id, status) => {
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deleteEmergencyReport = async (id) => {
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Assistance requests ───────────────────────────────────────────────────────
export const fetchAssistanceRequests = async () => {
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}`, { headers: authHeaders() });
    return res.json();
};

// Accepts FormData (with optional media files) or a plain object.
export const createAssistanceRequest = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updateAssistanceRequest = async (id, data) => {
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateAssistanceStatus = async (id, status) => {
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deleteAssistanceRequest = async (id) => {
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Petty crime reports ───────────────────────────────────────────────────────
export const fetchPettyCrimes = async () => {
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}`, { headers: authHeaders() });
    return res.json();
};

// Accepts FormData (with optional media files) or a plain object.
export const createPettyCrimeReport = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updatePettyCrimeReport = async (id, data) => {
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updatePettyCrimeStatus = async (id, status) => {
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deletePettyCrimeReport = async (id) => {
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const fetchAnnouncements = async () => {
    const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}`);
    const data = await res.json();
    return Array.isArray(data)
        ? data.map(a => ({ ...a, image_path: resolveAssetUrl(a.image_path) }))
        : data;
};

export const createAnnouncement = async (formData) => {
    const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}`, {
        method: "POST",
        headers: authHeadersNoContentType(),
        body: formData,
    });
    return res.json();
};

export const updateAnnouncement = async (id, formData) => {
    const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
        method: "PUT",
        headers: authHeadersNoContentType(),
        body: formData,
    });
    return res.json();
};

export const deleteAnnouncement = async (id) => {
    const res = await fetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

export const fetchLinkPreview = async (url) => {
    const res = await fetch(
        `${API_ENDPOINTS.ANNOUNCEMENTS}/link-preview?url=${encodeURIComponent(url)}`,
        { headers: authHeaders() }
    );
    return res.json();
};

// ── Logs ──────────────────────────────────────────────────────────────────────
export const fetchSignInLogs = async () => {
    const res = await fetch(`${API_ENDPOINTS.LOGS}/signin`, { headers: authHeaders() });
    return res.json();
};

export const fetchAdminLogs = async () => {
    const res = await fetch(`${API_ENDPOINTS.LOGS}/admin`, { headers: authHeaders() });
    return res.json();
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchAllData = async () => {
    const res = await fetch(`${API_ENDPOINTS.DASHBOARD}`, { headers: authHeaders() });
    return res.json();
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const fetchNotifications = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}`, { headers: authHeaders() });
    return res.json();
};

export const fetchMyNotifications = async (userId) => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/user/${userId}`, {
        headers: authHeaders(),
    });
    return res.json();
};

export const markAllNotificationsRead = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/mark-all-read`, {
        method: "PUT",
        headers: authHeaders(),
    });
    return res.json();
};

export const markAllMyNotificationsRead = async (userId) => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/user/${userId}/mark-all-read`, {
        method: "PUT",
        headers: authHeaders(),
    });
    return res.json();
};

// ── My reports (resident) ─────────────────────────────────────────────────────
export const fetchMyReports = async (userId) => {
    const res = await fetch(`${API_BASE}/my-reports/${userId}`, { headers: authHeaders() });
    return res.json();
};

// ── Status update (generic) ───────────────────────────────────────────────────
export const updateStatus = async (type, id, status) => {
    const endpoints = {
        emergency:  `${API_ENDPOINTS.REPORTS}/${id}/status`,
        assistance: `${API_ENDPOINTS.ASSISTANCE}/${id}/status`,
        pettyCrime: `${API_ENDPOINTS.PETTY_CRIMES}/${id}/status`,
    };
    const url = endpoints[type];
    if (!url) throw new Error(`Unknown report type: ${type}`);
    const res = await fetch(url, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};