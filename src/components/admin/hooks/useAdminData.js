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
    markAllNotificationsRead,
    SHEETDB_APIS
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
    const [adminLogs, setAdminLogs] = useState([]);
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

        let api;

        switch (type) {
            case "emergency":
                api = SHEETDB_APIS.emergencyReports;
                break;

            case "assistance":
                api = SHEETDB_APIS.assistanceRequests;
                break;

            case "pettyCrime":
                api = SHEETDB_APIS.pettyCrimes;
                break;

            case "users":
                api = SHEETDB_APIS.registeredUsers;
                break;

            default:
                return;
        }

        const success = await updateSheetStatus(
            api,
            id,
            newStatus
        );

        if (!success) return;

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
        loadAllData,
        refreshAllData,
        loadAnnouncements,
        handleRefresh,
        updateStatus,
        handleFormSubmit
    };
}