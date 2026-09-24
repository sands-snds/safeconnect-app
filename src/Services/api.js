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
// Mapped to the camelCase shape RegisteredUsersTable/UserStatusSelect expect --
// the raw backend response uses snake_case (full_name, email_address, etc.),
// which otherwise renders as blank cells for everything except `status`
// (the one field name that happens to match in both shapes).
export const fetchRegisteredUsers = async () => {
    const res = await fetch(`${API_ENDPOINTS.USERS}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((u) => ({
        id: u.id,
        fullName: u.full_name || '',
        username: u.username || '',
        email: u.email_address || '',
        contact: u.contact_number || '',
        role: u.role || 'resident',
        status: u.status || 'Active',
        dateRegistered: u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
    }));
};

// Real route is PATCH-only (see backend/routes/userRoutes.js) -- PUT 404s.
export const updateUserStatus = async (userId, status) => {
    const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// ── Emergency reports ─────────────────────────────────────────────────────────
// Mapped to the camelCase shape every emergency-report component expects
// (ReportCard, EmergencyReportDetails, DashboardRecentReports, etc. all read
// report.emergency/.reporter/.date/... not the raw snake_case columns). This
// was returning raw JSON directly, which is why report cards/details were
// showing blank fields even though the data existed in the database.
export const fetchEmergencyReports = async () => {
    const res = await fetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((r) => ({
        id: r.id,
        reference: r.report_reference || '',
        reporter: r.reporter_name || '',
        phone: r.contact_number || '',
        emergency: r.emergency_type || '',
        severity: r.severity || '',
        location: r.location || '',
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.time ? new Date(r.time).toLocaleString() : '',
        rawDate: r.time || null,
        status: r.status || 'Received',
        description: r.incident_details || '',
        peopleAffected: r.number_of_people_affected || '0',
        specialNeeds: r.special_needs || '',
        photoUrl: resolveAssetUrl(r.photo_url) || r.photo_url || '',
        mediaType: r.media_type || '',
        reportFor: r.report_for || 'self',
        victimName: r.victim_name || '',
        victimContact: r.victim_contact || '',
        victimRelationship: r.victim_relationship || ''
    }));
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
// Same mapping fix as emergency reports above.
export const fetchAssistanceRequests = async () => {
    const res = await fetch(`${API_ENDPOINTS.ASSISTANCE}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((r) => ({
        id: r.id,
        reference: r.report_reference || '',
        requester: r.full_name || '',
        phone: r.contact_number || '',
        email: r.email_address || '',
        assistanceType: r.request_assistance_type || '',
        peopleAffected: r.number_of_people_needing_help || '0',
        location: r.current_location || '',
        latitude: r.latitude,
        longitude: r.longitude,
        date: r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
        rawDate: r.timestamp || null,
        status: r.status || 'Received',
        description: r.describe_your_situation || '',
        urgency: r.urgency_level || '',
        specialNeeds: r.special_needs || '',
        reportFor: r.report_for || 'self',
        victimName: r.victim_name || '',
        victimContact: r.victim_contact || '',
        victimRelationship: r.victim_relationship || ''
    }));
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
// Same mapping fix as emergency reports above.
export const fetchPettyCrimes = async () => {
    const res = await fetch(`${API_ENDPOINTS.PETTY_CRIMES}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((r) => ({
        id: r.id,
        reference: r.report_reference || '',
        crimeType: r.crime_type || '',
        reporter: r.reporter_name || '',
        phone: r.contact_number || '',
        location: r.location || '',
        latitude: r.latitude,
        longitude: r.longitude,
        description: r.description || '',
        suspectInfo: r.suspect_info || '',
        date: r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
        rawDate: r.timestamp || null,
        status: r.status || 'Received',
        reportFor: r.report_for || 'self',
        victimName: r.victim_name || '',
        victimContact: r.victim_contact || '',
        victimRelationship: r.victim_relationship || ''
    }));
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
    if (!Array.isArray(data)) return data;

    // The raw backend row is snake_case (date_posted, image_path,
    // source_url, ...) and every announcement component reads camelCase
    // (date, imageUrl, sourceUrl, ...) -- only mapping image_path here
    // (as this used to) left every other field silently undefined, which
    // is why images, links, and the posted date never actually showed up.
    return data.map((a) => ({
        id: a.id,
        title: a.title || '',
        category: a.category || '',
        message: a.message || '',
        date: a.date_posted ? new Date(a.date_posted).toLocaleDateString() : '',
        imageUrl: resolveAssetUrl(a.image_path) || null,
        sourceUrl: a.source_url || null,
        sourceTitle: a.source_title || null,
        sourceImage: a.source_image || null,
        sourceSite: a.source_site || null
    }));
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
// Same mapping problem as users: raw rows use snake_case, tables expect
// camelCase. Also: `signin_logs` and `admin_logs` were never actually
// designed to capture IP address or device -- those columns don't exist in
// the schema. An earlier version of this file filled them in with fabricated
// placeholder values (a random IP, a sniffed User-Agent unrelated to the
// logged-in user's own device). That's misleading data presented as real, so
// this version is honest about it instead: "Not tracked" until the backend
// is actually updated to capture req.ip / a user-agent string per login.
export const fetchSignInLogs = async () => {
    const res = await fetch(`${API_ENDPOINTS.LOGS}/signin`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((log) => ({
        id: log.id,
        fullName: log.full_name || '',
        email: log.email_address || '',
        loginTime: log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
        ipAddress: 'Not tracked',
        device: 'Not tracked',
        status: log.status || ''
    }));
};

export const fetchAdminLogs = async () => {
    const res = await fetch(`${API_ENDPOINTS.LOGS}/admin`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((log) => ({
        id: log.id,
        email: log.email_address || '',
        // admin_logs only ever records successful admin sign-ins, there is
        // no separate status column for it.
        status: 'Success',
        timestamp: log.login_time ? new Date(log.login_time).toLocaleString() : '',
        ipAddress: 'Not tracked',
        device: 'Not tracked'
    }));
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchAllData = async () => {
    const res = await fetch(`${API_ENDPOINTS.DASHBOARD}`, { headers: authHeaders() });
    return res.json();
};

// ── Notifications ─────────────────────────────────────────────────────────────
// Admin bell: useAdminData.js destructures { notifications, unread } from
// this, so the raw { success, data, unread } backend shape needs mapping.
export const fetchNotifications = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}`, { headers: authHeaders() });
    const result = await res.json();
    if (!result.success) return { notifications: [], unread: 0 };

    return {
        notifications: result.data.map((item) => ({
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
};

// Resident bell (useNotifications.js): identity comes from the JWT, no
// userId in the URL -- the route is /mine, not /user/:id.
export const fetchMyNotifications = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine`, { headers: authHeaders() });
    const result = await res.json();
    if (!result.success) return [];

    return result.data.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.notification_type,
        referenceId: item.reference_id,
        isRead: Boolean(item.is_read),
        createdAt: item.created_at
    }));
};

// Real route is /read-all, not /mark-all-read.
export const markAllNotificationsRead = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// Real route is /mine/read-all, no userId in the path.
export const markAllMyNotificationsRead = async () => {
    const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine/read-all`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// ── My reports (resident) ─────────────────────────────────────────────────────
export const fetchMyReports = async (userId) => {
    const res = await fetch(`${API_ENDPOINTS.REPORTS}/user/${userId}`, { headers: authHeaders() });
    return res.json();
};

// ── Report generation (admin) ─────────────────────────────────────────────────
// type: "emergency" | "assistance" | "pettyCrime" | "users" | "signinLogs" | "adminLogs"
// format: "pdf" | "excel"
// filters: optional plain object of query params (e.g. { status: "Resolved" })
// forwarded straight to the backend so a generated report can reflect
// whatever the admin currently has filtered/searched on screen.
//
// This is a protected admin route, so it can't be a plain <a href> download --
// the request needs the Authorization header. We fetch as a blob and trigger
// the save ourselves.
export const exportReport = async (type, format, filters = {}) => {
    const query = new URLSearchParams(
        Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
        )
    ).toString();

    const url = `${API_ENDPOINTS.EXPORT}/${format}/${type}${query ? `?${query}` : ""}`;

    const res = await fetch(url, { headers: authHeadersNoContentType() });

    if (!res.ok) {
        let message = "Failed to generate report.";
        try {
            const errBody = await res.json();
            if (errBody?.message) message = errBody.message;
        } catch {
            // response wasn't JSON (e.g. a stream that had already started) -- keep the default message
        }
        throw new Error(message);
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `report.${format === "pdf" ? "pdf" : "xlsx"}`;

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};

// ── Status update (generic) ───────────────────────────────────────────────────
// type: "emergency" | "assistance" | "pettyCrime" | "users"
export const updateStatus = async (type, id, status) => {
    // Method differs per resource: emergency/assistance accept PUT or PATCH,
    // but petty crime and users are PATCH-only (see backend/routes/*).
    // Using the wrong method 404s.
    const config = {
        emergency:  { url: `${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}/status`, method: "PUT" },
        assistance: { url: `${API_ENDPOINTS.ASSISTANCE}/${id}/status`,        method: "PUT" },
        pettyCrime: { url: `${API_ENDPOINTS.PETTY_CRIMES}/${id}/status`,      method: "PATCH" },
        users:      { url: `${API_ENDPOINTS.USERS}/${id}/status`,             method: "PATCH" },
    };

    const entry = config[type];
    if (!entry) throw new Error(`Unknown report type: ${type}`);

    const res = await fetch(entry.url, {
        method: entry.method,
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });

    let result = {};
    try {
        result = await res.json();
    } catch {
        // non-JSON error body (e.g. an HTML error page from a 404/500) --
        // fall through, res.ok / result.success below will still be falsy
    }

    if (!res.ok || result.success === false) {
        if (result.message) alert(result.message);
        return false;
    }

    return Boolean(result.success);
};