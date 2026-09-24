import { useState } from "react";

import {
    fetchEmergencyReports,
    fetchAssistanceRequests,
    fetchRegisteredUsers,
    fetchSignInLogs,
    fetchAdminLogs,
    fetchAnnouncements,
    fetchPettyCrimes,
    createEmergencyReport,
    createAssistanceRequest,
    updateStatus as updateSheetStatus,
    fetchNotifications,
    markNotificationRead,
    updateUserRole as updateUserRoleApi,
    markAllNotificationsRead
} from "../../../Services/api";

import {
    buildEmergencyReportFromForm,
    buildAssistanceRequestFromForm
} from "../shared/formUtils";

export default function useAdminData() {

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    const [emergencyReports, setEmergencyReports] = useState([]);
    const [assistanceRequests, setAssistanceRequests] = useState([]);
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [signInLogs, setSignInLogs] = useState([]);
    const [adminLogs, setAdminLogs] = useState({ admins: [], activity: [] });
    const [announcements, setAnnouncements] = useState([]);
    const [pettyCrimeReports, setPettyCrimeReports] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadEmergencyReports = async () => {
        setEmergencyReports(await fetchEmergencyReports());
    };

    const loadAssistanceRequests = async () => {
        setAssistanceRequests(await fetchAssistanceRequests());
    };

    const loadRegisteredUsers = async () => {
        setRegisteredUsers(await fetchRegisteredUsers());
    };

    const loadSignInLogs = async () => {
        setSignInLogs(await fetchSignInLogs());
    };

    const loadAdminLogs = async () => {
        setAdminLogs(await fetchAdminLogs());
    };

    const loadAnnouncements = async () => {
        setAnnouncements(await fetchAnnouncements());
    };

    const loadPettyCrimeReports = async () => {
        setPettyCrimeReports(await fetchPettyCrimes());
    };

    const loadNotifications = async () => {
        const { notifications: list, unread } = await fetchNotifications();
        setNotifications(list);
        setUnreadCount(unread);
    };

    const markAllRead = async () => {
        const success = await markAllNotificationsRead();
        if (!success) return;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    // Updates local state right away so the badge drops immediately; the
    // next refresh re-syncs from the backend if the request failed.
    const markOneRead = async (id) => {
        const target = notifications.find(n => n.id === id);
        if (!target || target.isRead) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(prev - 1, 0));
        await markNotificationRead(id).catch(() => false);
    };

    // Initial page load ONLY
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
                loadPettyCrimeReports(),
                loadNotifications()
            ]);

            setLastUpdate(new Date());
        } finally {
            setIsLoading(false);
        }
    };

    // Silent background refresh
    const refreshAllData = async () => {
        setIsRefreshing(true);

        try {
            await Promise.all([
                loadEmergencyReports(),
                loadAssistanceRequests(),
                loadRegisteredUsers(),
                loadSignInLogs(),
                loadAdminLogs(),
                loadAnnouncements(),
                loadPettyCrimeReports(),
                loadNotifications()
            ]);

            setLastUpdate(new Date());
        } finally {
            setIsRefreshing(false);
        }
    };

    // View-specific loaders, used by the header reload button so it only
    // re-fetches what's actually showing on screen instead of everything.
    const VIEW_LOADERS = {
        "dashboard": [
            loadEmergencyReports, loadAssistanceRequests, loadRegisteredUsers,
            loadSignInLogs, loadAdminLogs, loadAnnouncements, loadPettyCrimeReports
        ],
        "emergency-reports": [loadEmergencyReports],
        "assistance-requests": [loadAssistanceRequests],
        "petty-crime-reports": [loadPettyCrimeReports],
        "create-announcement": [loadAnnouncements],
        "announcement-page": [loadAnnouncements],
        "registered-users": [loadRegisteredUsers],
        "sign-in-logs": [loadSignInLogs],
        "admin-logs": [loadAdminLogs]
    };

    const handleRefresh = async (activeView) => {
        setIsRefreshing(true);

        try {
            const loaders = VIEW_LOADERS[activeView] || Object.values(VIEW_LOADERS)[0];
            await Promise.all([...loaders.map(fn => fn()), loadNotifications()]);
            setLastUpdate(new Date());
        } finally {
            setIsRefreshing(false);
        }
    };

    const updateStatus = async (id, newStatus, type) => {

        if (!["emergency", "assistance", "pettyCrime", "users"].includes(type)) {
            return false;
        }

        // api.js's updateStatus already knows the right URL + HTTP method
        // per type (see its own comment) -- no need to look one up here.
        const success = await updateSheetStatus(
            type,
            id,
            newStatus
        );

        if (!success) return false;

        const update = list =>
            list.map(item =>
                item.id === id
                    ? {
                          ...item,
                          status: newStatus
                      }
                    : item
            );

        if (type === "emergency")
            setEmergencyReports(prev => update(prev));

        if (type === "assistance")
            setAssistanceRequests(prev => update(prev));

        if (type === "pettyCrime")
            setPettyCrimeReports(prev => update(prev));

        if (type === "users")
            setRegisteredUsers(prev => update(prev));

        return true;
    };

    // Returns { success, message } so the Users table can show the reason
    // when the backend refuses (e.g. changing your own role).
    const updateUserRole = async (id, role) => {
        const result = await updateUserRoleApi(id, role);
        if (!result?.success) return result;

        setRegisteredUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
        // Admin Logs lists admin accounts, so it changes too.
        loadAdminLogs();
        return result;
    };

    const handleFormSubmit = async (e, type) => {

        e.preventDefault();

        const formData = new FormData(e.target);

        if (type === "emergency") {

            const newReport = buildEmergencyReportFromForm(formData);

            const result = await createEmergencyReport(newReport);

            if (result.success === false) {
                alert(result.message || "Failed to submit emergency report.");
                return;
            }

            // Refetch rather than fabricate a local record — the backend
            // generates the real id, report reference, and timestamp.
            await loadEmergencyReports();
        }

        if (type === "assistance") {

            const newRequest = buildAssistanceRequestFromForm(formData);

            const result = await createAssistanceRequest(newRequest);

            if (result.success === false) {
                alert(result.message || "Failed to submit assistance request.");
                return;
            }

            await loadAssistanceRequests();
        }
    };

    return {
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
    };
}