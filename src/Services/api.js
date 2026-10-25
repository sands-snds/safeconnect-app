import { showPopup } from "../components/shared/popup";
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
    SITE_CONTENT:       `${API_BASE}/site-content`,
};

export const SHEETDB_APIS = {};

// ── Auth token helpers ────────────────────────────────────────────────────────
// Admin and resident sessions keep separate tokens. They used to share one
// "authToken" key, so in the same browser an admin signing in replaced the
// resident's token (and vice versa) -- the resident tab then fetched "my
// notifications" as the admin and never saw their status-update messages,
// and logging out on one side logged the other out too.
const RESIDENT_TOKEN_KEY = "authToken";
const ADMIN_TOKEN_KEY = "adminAuthToken";

// Which session the current page belongs to (/admin vs everything else).
const isAdminContext = () =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

// "Save Login Info": a saved login (Yes) lives in localStorage and survives
// closing the browser; an ordinary sign-in (No) lives in sessionStorage and
// is gone when the tab/browser closes. Reads check both.
const readToken = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);
const removeToken = (key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
};

export const getAuthToken = () => {
    if (isAdminContext()) {
        // Fallback: admins signed in before the split still have their
        // token under the shared key (flagged by the old "isAdmin" entry).
        return readToken(ADMIN_TOKEN_KEY) ||
            (localStorage.getItem("isAdmin") === "true" ? localStorage.getItem(RESIDENT_TOKEN_KEY) : null);
    }
    return readToken(RESIDENT_TOKEN_KEY);
};

// Whether a resident (or admin) sign-in is stored at all, regardless of the
// page you're on -- the home page uses it to send signed-in visitors on.
export const hasStoredToken = (isAdmin = false) =>
    Boolean(readToken(isAdmin ? ADMIN_TOKEN_KEY : RESIDENT_TOKEN_KEY));

// remember: true only for a saved login (POST /auth/remember's token).
export const setAuthToken = (token, isAdmin = false, remember = false) => {
    const key = isAdmin ? ADMIN_TOKEN_KEY : RESIDENT_TOKEN_KEY;
    removeToken(key);
    (remember ? localStorage : sessionStorage).setItem(key, token);
    if (!isAdmin) localStorage.removeItem("isAdmin");
};

// Clears only the session of the page you're on.
export const clearAuthToken = () => {
    if (isAdminContext()) {
        removeToken(ADMIN_TOKEN_KEY);
        if (localStorage.getItem("isAdmin") === "true") {
            removeToken(RESIDENT_TOKEN_KEY);
            localStorage.removeItem("isAdmin");
        }
    } else {
        removeToken(RESIDENT_TOKEN_KEY);
        localStorage.removeItem("isAdmin");
    }
};

// Only send Authorization when there's a token -- "Bearer null" gets a
// confusing "Invalid token." back instead of "No token provided."
const authorization = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const authHeaders = () => ({
    "Content-Type": "application/json",
    ...authorization(),
});

const authHeadersNoContentType = () => authorization();

// Messages authMiddleware.verifyToken sends when the session is gone.
const SESSION_ERRORS = ["Invalid token.", "Access denied. No token provided."];
export const SESSION_EXPIRED_EVENT = "safeconnect:session-expired";
export const isSessionError = (result) => SESSION_ERRORS.includes(result?.message);

// fetch() that notices a missing/invalid login (e.g. the token was cleared
// by logging out in another tab) and tells the page to ask for sign-in
// again, instead of every request failing silently with 401/403.
const apiFetch = async (...args) => {
    const res = await fetch(...args);
    if (res.status === 401 || res.status === 403) {
        const body = await res.clone().json().catch(() => null);
        if (body && SESSION_ERRORS.includes(body.message)) {
            clearAuthToken();
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        }
    }
    return res;
};

// ── Asset URL resolver ────────────────────────────────────────────────────────
export const resolveAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
    return `${ASSET_BASE}${path}`;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
// Phone model / real OS version for the sign-in log (System > Sign-in Logs).
// Only Chromium browsers (Chrome, Edge, Samsung Internet) expose these;
// elsewhere the backend falls back to the User-Agent. Never blocks login.
const getDeviceHints = async () => {
    try {
        const uad = navigator.userAgentData;
        if (!uad?.getHighEntropyValues) return undefined;
        const values = await Promise.race([
            uad.getHighEntropyValues(["model", "platformVersion"]),
            new Promise((resolve) => setTimeout(() => resolve(null), 500))
        ]);
        if (!values) return undefined;
        return { model: values.model || undefined, platformVersion: values.platformVersion || undefined, mobile: uad.mobile };
    } catch {
        return undefined;
    }
};

// The signed-in account, checked by the server (GET /auth/me verifies the
// token AND that the account still exists and is Active). Returns
// { success, user, isAdmin }; { success: false, message } otherwise --
// including "Invalid token.", which apiFetch() treats as signed out.
//
// admin: check the admin sign-in instead of the one for the current page
// (the home page checks both). A sign-in the server rejects is deleted.
export const fetchCurrentUser = async ({ admin = isAdminContext() } = {}) => {
    const key = admin ? ADMIN_TOKEN_KEY : RESIDENT_TOKEN_KEY;
    const token = readToken(key);
    if (!token) return { success: false, message: "Access denied. No token provided." };
    try {
        const res = await fetch(`${API_ENDPOINTS.AUTH}/me`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (res.status === 401 || res.status === 403) removeToken(key);
        return { success: false, ...data };
    } catch {
        return { success: false, offline: true, message: "Could not reach the server." };
    }
};

// "Save Login Info" > Yes: swaps the just-issued session token for a 30-day
// saved login. Takes the token explicitly because it isn't stored yet.
export const rememberLogin = async (token) => {
    try {
        const res = await fetch(`${API_ENDPOINTS.AUTH}/remember`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        return await res.json();
    } catch {
        return { success: false };
    }
};

// Signing out: revokes a saved login on the server (so a copied token stops
// working), then the caller clears the local copy. Never blocks signing out.
export const logoutUser = async () => {
    if (!getAuthToken()) return;
    try {
        await fetch(`${API_ENDPOINTS.AUTH}/logout`, { method: "POST", headers: authHeaders() });
    } catch {
        // offline: the local copy is still removed by the caller
    }
};

export const signinUser = async (email, password) => {
    const device = await getDeviceHints();
    const res = await apiFetch(`${API_ENDPOINTS.AUTH}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, device }),
    });
    return res.json();
};

export const signupUser = async (fullName, email, password, extra = {}) => {
    const res = await apiFetch(`${API_ENDPOINTS.AUTH}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, ...extra }),
    });
    return res.json();
};

// ── User profile ──────────────────────────────────────────────────────────────
// GET /users/:id (userController.getUserById) returns the raw registered_users
// row directly (id, full_name, contact_number, email_address, photo_url, ...) --
// not wrapped in { success, user }. Callers (SettingsPage.jsx, useAdminAuth.js)
// read those raw snake_case fields themselves; this just also resolves
// photo_url into a ready-to-use absolute photoUrl for convenience.
export const fetchUserProfile = async (userId) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        headers: authHeaders(),
    });
    const data = await res.json();
    if (data && data.photo_url) {
        data.photoUrl = resolveAssetUrl(data.photo_url);
    }
    return data;
};

// Real routes are PATCH-only (see backend/routes/userRoutes.js) -- PUT 404s.
export const updateFullName = async (userId, fullName) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/name`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ fullName }),
    });
    return res.json();
};

export const updateUsername = async (userId, username) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/username`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ username }),
    });
    return res.json();
};

export const updateContact = async (userId, contact) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/contact`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ contact }),
    });
    return res.json();
};

export const updateEmail = async (userId, email, currentPassword) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/email`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ email, currentPassword }),
    });
    return res.json();
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    // Changing the password revokes every saved login; when this device was
    // on one, the server sends a fresh one so it stays signed in.
    if (data?.success && data.token) setAuthToken(data.token, isAdminContext(), true);
    return data;
};

export const uploadProfilePhoto = async (userId, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/photo`, {
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
    const res = await apiFetch(`${API_ENDPOINTS.USERS}`, { headers: authHeaders() });
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
        // The barangay's main Admin account (role/status can't be changed).
        isMainAccount: Boolean(u.is_main_account),
        dateRegistered: u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
    }));
};

// Real route is PATCH-only (see backend/routes/userRoutes.js) -- PUT 404s.
export const updateUserStatus = async (userId, status) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// role: "resident" | "admin". Returns { success, message }.
export const updateUserRole = async (userId, role) => {
    const res = await apiFetch(`${API_ENDPOINTS.USERS}/${userId}/role`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
    });
    try {
        return await res.json();
    } catch {
        return { success: false, message: "Failed to update role." };
    }
};

// ── Emergency reports ─────────────────────────────────────────────────────────
// Mapped to the camelCase shape every emergency-report component expects
// (ReportCard, EmergencyReportDetails, DashboardRecentReports, etc. all read
// report.emergency/.reporter/.date/... not the raw snake_case columns). This
// was returning raw JSON directly, which is why report cards/details were
// showing blank fields even though the data existed in the database.
export const fetchEmergencyReports = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}`, { headers: authHeaders() });
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
        victimRelationship: r.victim_relationship || '',
        archivedAt: r.archived_at || null
    }));
};

// Accepts FormData (with optional media files) or a plain object.
export const createEmergencyReport = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await apiFetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updateEmergencyReport = async ({ id, ...data }) => {
    const res = await apiFetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateEmergencyStatus = async (id, status) => {
    const res = await apiFetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deleteEmergencyReport = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.EMERGENCY_REPORTS}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Assistance requests ───────────────────────────────────────────────────────
// Same mapping fix as emergency reports above.
export const fetchAssistanceRequests = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.ASSISTANCE}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((r) => ({
        id: r.id,
        reference: r.report_reference || '',
        requester: r.full_name || '',
        phone: r.contact_number || '',
        email: r.email_address || '',
        assistanceType: r.request_assistance_type || '',
        victimOfEmergency: r.victim_of_emergency || '',
        photoUrl: resolveAssetUrl(r.photo_url) || '',
        mediaType: r.media_type || '',
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
        victimRelationship: r.victim_relationship || '',
        archivedAt: r.archived_at || null
    }));
};

// Accepts FormData (with optional media files) or a plain object.
export const createAssistanceRequest = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await apiFetch(`${API_ENDPOINTS.ASSISTANCE}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updateAssistanceRequest = async ({ id, ...data }) => {
    const res = await apiFetch(`${API_ENDPOINTS.ASSISTANCE}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateAssistanceStatus = async (id, status) => {
    const res = await apiFetch(`${API_ENDPOINTS.ASSISTANCE}/${id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deleteAssistanceRequest = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.ASSISTANCE}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Petty crime reports ───────────────────────────────────────────────────────
// Same mapping fix as emergency reports above.
export const fetchPettyCrimes = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.PETTY_CRIMES}`, { headers: authHeaders() });
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
        photoUrl: resolveAssetUrl(r.photo_url) || '',
        mediaType: r.media_type || '',
        isAnonymous: Boolean(r.is_anonymous),
        date: r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
        rawDate: r.timestamp || null,
        status: r.status || 'Received',
        reportFor: r.report_for || 'self',
        victimName: r.victim_name || '',
        victimContact: r.victim_contact || '',
        victimRelationship: r.victim_relationship || '',
        archivedAt: r.archived_at || null
    }));
};

// Accepts FormData (with optional media files) or a plain object.
export const createPettyCrimeReport = async (data) => {
    const isFormData = data instanceof FormData;
    const res = await apiFetch(`${API_ENDPOINTS.PETTY_CRIMES}`, {
        method: "POST",
        headers: isFormData ? authHeadersNoContentType() : authHeaders(),
        body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
};

export const updatePettyCrimeReport = async ({ id, ...data }) => {
    const res = await apiFetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updatePettyCrimeStatus = async (id, status) => {
    const res = await apiFetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    return res.json();
};

export const deletePettyCrimeReport = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.PETTY_CRIMES}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

// ── Report archive ────────────────────────────────────────────────────────────
// type: "emergency" | "assistance" | "pettyCrime". Only Resolved reports can
// be archived; restoring puts one back in the normal list.
const setReportArchived = async (type, id, archived) => {
    const res = await apiFetch(`${API_ENDPOINTS.REPORTS}/${type}/${id}/${archived ? "archive" : "restore"}`, {
        method: "PATCH",
        headers: authHeaders(),
    });
    return res.json().catch(() => ({ success: false }));
};

export const archiveReport = (type, id) => setReportArchived(type, id, true);
export const restoreReport = (type, id) => setReportArchived(type, id, false);

// Months after resolution before a report is archived automatically (0 = off).
export const fetchArchiveSettings = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.REPORTS}/archive-settings`, { headers: authHeaders() });
    const data = await res.json().catch(() => null);
    return data?.success ? data.months : null;
};

export const updateArchiveSettings = async (months) => {
    const res = await apiFetch(`${API_ENDPOINTS.REPORTS}/archive-settings`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ months }),
    });
    return res.json().catch(() => ({ success: false }));
};

// ── Announcements ─────────────────────────────────────────────────────────────
export const fetchAnnouncements = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}`, {
        headers: authHeaders(),
    });
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
        rawDate: a.date_posted || a.created_at || null,
        imageUrl: resolveAssetUrl(a.image_path) || null,
        sourceUrl: a.source_url || null,
        sourceTitle: a.source_title || null,
        sourceImage: a.source_image || null,
        sourceSite: a.source_site || null,
        likeCount: a.likeCount || 0,
        commentCount: a.commentCount || 0,
        likedByMe: !!a.likedByMe
    }));
};

// Toggles the signed-in resident's like on an announcement.
export const toggleAnnouncementLike = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}/like`, {
        method: "POST",
        headers: authHeaders(),
    });
    return res.json();
};

export const fetchAnnouncementComments = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}/comments`);
    return res.json();
};

// parentId: reply to that comment (omit for a top-level comment).
export const postAnnouncementComment = async (id, text, parentId = null) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(parentId ? { text, parentId } : { text }),
    });
    return res.json();
};

export const deleteAnnouncementComment = async (commentId) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

export const createAnnouncement = async (formData) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}`, {
        method: "POST",
        headers: authHeadersNoContentType(),
        body: formData,
    });
    return res.json();
};

export const updateAnnouncement = async (id, formData) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
        method: "PUT",
        headers: authHeadersNoContentType(),
        body: formData,
    });
    return res.json();
};

export const deleteAnnouncement = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return res.json();
};

export const fetchLinkPreview = async (url) => {
    const res = await apiFetch(
        `${API_ENDPOINTS.ANNOUNCEMENTS}/link-preview?url=${encodeURIComponent(url)}`,
        { headers: authHeaders() }
    );
    return res.json();
};

// ── Logs ──────────────────────────────────────────────────────────────────────
// Same mapping problem as users: raw rows use snake_case, tables expect
// camelCase. IP address, device and approximate location are recorded by the
// backend at sign-in (backend/utils/signinContext.js); logs from before that
// have none and show "Not tracked" rather than made-up values.
// archived: true loads the Archived tab (entries older than the
// auto-archive period) instead of the current ones.
export const fetchSignInLogs = async ({ archived = false } = {}) => {
    const res = await apiFetch(`${API_ENDPOINTS.LOGS}/signin${archived ? "?archived=1" : ""}`, { headers: authHeaders() });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((log) => ({
        id: log.id,
        fullName: log.full_name || '',
        email: log.email_address || '',
        loginTime: log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
        role: log.role || '',
        // Logs from before IP/device tracking was added have neither.
        ipAddress: log.ip_address || 'IP not tracked',
        location: log.location || '',
        device: log.device || 'Device not tracked',
        status: log.status || ''
    }));
};

// { admins, activity } -- see backend/controllers/logController.js.
// admins: one entry per admin account (online state, last login, latest action).
// activity: every logged admin action, newest first.
// archived: true loads archived activity entries instead of the current ones.
export const fetchAdminLogs = async ({ archived = false } = {}) => {
    const res = await apiFetch(`${API_ENDPOINTS.LOGS}/admin${archived ? "?archived=1" : ""}`, { headers: authHeaders() });
    const data = await res.json();
    if (!data?.success) return { admins: [], activity: [] };

    return {
        admins: data.admins.map((a) => ({
            id: a.id,
            fullName: a.full_name || '',
            username: a.username || '',
            email: a.email_address || '',
            role: a.role || '',
            status: a.status || 'Active',
            photoUrl: resolveAssetUrl(a.photo_url),
            online: Boolean(a.online),
            lastSeen: a.last_seen || null,
            lastLogin: a.last_login || null,
            latestAction: a.latest_action || '',
            latestDetails: a.latest_details || '',
            latestAt: a.latest_at || null
        })),
        activity: data.activity.map((log) => ({
            id: log.id,
            adminId: log.admin_id,
            email: log.admin_email || '',
            username: log.admin_username || '',
            role: log.role || '',
            action: log.action || '',
            details: log.details || '',
            createdAt: log.created_at || null
        }))
    };
};

// Auto-archive period for a System log. log: "signin" | "admin".
// Returns the number of days (0 = off), or null if it couldn't be loaded.
export const fetchLogArchiveSettings = async (log) => {
    const res = await apiFetch(`${API_ENDPOINTS.LOGS}/archive-settings/${log}`, { headers: authHeaders() });
    const data = await res.json().catch(() => null);
    return data?.success ? data.days : null;
};

export const updateLogArchiveSettings = async (log, days) => {
    const res = await apiFetch(`${API_ENDPOINTS.LOGS}/archive-settings/${log}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ days }),
    });
    return res.json().catch(() => ({ success: false }));
};

// ── Site contacts ─────────────────────────────────────────────────────────────
// Emergency contacts (floating call button + footer hotlines), barangay
// officials and socials. Public to read; only Admins (super_admin) can save.
// Returns { content, media, options } or null. media = carousel photos and
// demo videos (Content > Site Contents).
export const fetchSiteContent = async () => {
    const res = await apiFetch(API_ENDPOINTS.SITE_CONTENT);
    const data = await res.json().catch(() => null);
    return data?.success ? { content: data.content, media: data.media || null, options: data.options || null } : null;
};

export const updateSiteMedia = async (media) => {
    const res = await apiFetch(`${API_ENDPOINTS.SITE_CONTENT}/media`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(media),
    });
    return res.json().catch(() => ({ success: false }));
};

// Uploads a carousel photo or demo video (Admins only). Uses XHR so big
// videos can show progress: onProgress(0-100). Resolves { success, url, message }.
export const uploadSiteMedia = (file, onProgress) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_ENDPOINTS.SITE_CONTENT}/upload`);
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve({ success: false, message: "The upload failed. Please try again." }); }
    };
    xhr.onerror = () => resolve({ success: false, message: "Couldn't reach the server. Please check your connection." });
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
});

export const updateSiteContent = async (content) => {
    const res = await apiFetch(API_ENDPOINTS.SITE_CONTENT, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(content),
    });
    return res.json().catch(() => ({ success: false }));
};

// Records the logout in the admin activity log. Must run before the token is cleared.
export const logoutAdmin = async () => {
    try {
        await apiFetch(`${API_ENDPOINTS.LOGS}/admin/logout`, {
            method: "POST",
            headers: authHeaders(),
        });
    } catch {
        // logging out locally still works if this fails
    }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchAllData = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.DASHBOARD}`, { headers: authHeaders() });
    return res.json();
};

// ── Notifications ─────────────────────────────────────────────────────────────
// Admin bell: useAdminData.js destructures { notifications, unread } from
// this, so the raw { success, data, unread } backend shape needs mapping.
export const fetchNotifications = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}`, { headers: authHeaders() });
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
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine`, { headers: authHeaders() });
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

// Admin bell: marks a single notification read (e.g. when "See report" is clicked).
export const markNotificationRead = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// Real route is /read-all, not /mark-all-read.
export const markAllNotificationsRead = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// Resident bell: marks one of your own notifications read.
export const markMyNotificationRead = async (id) => {
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine/${id}/read`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// Real route is /mine/read-all, no userId in the path.
export const markAllMyNotificationsRead = async () => {
    const res = await apiFetch(`${API_ENDPOINTS.NOTIFICATIONS}/mine/read-all`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const result = await res.json();
    return Boolean(result.success);
};

// ── My reports (resident) ─────────────────────────────────────────────────────
export const fetchMyReports = async (userId) => {
    const res = await apiFetch(`${API_ENDPOINTS.REPORTS}/user/${userId}`, { headers: authHeaders() });
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

    const res = await apiFetch(url, { headers: authHeadersNoContentType() });

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

    const res = await apiFetch(entry.url, {
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
        if (result.message) showPopup({ type: "error", title: "Couldn't Update Status", message: result.message });
        return false;
    }

    return Boolean(result.success);
};