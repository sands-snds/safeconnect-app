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
                loadPettyCrimeReports()
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
                loadPettyCrimeReports()
            ]);

            setLastUpdate(new Date());
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        await refreshAllData();
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
    };

    const handleFormSubmit = async (e, type) => {

        e.preventDefault();

        const formData = new FormData(e.target);

        if (type === "emergency") {

            const newReport = buildEmergencyReportFromForm(
                formData,
                emergencyReports
            );

            const result = await createEmergencyReport(newReport);

            if (result.success === false) {
                alert(result.message || "Failed to submit emergency report.");
                return;
            }

            setEmergencyReports(prev => [...prev, newReport]);
        }

        if (type === "assistance") {

            const newRequest = buildAssistanceRequestFromForm(
                formData,
                assistanceRequests
            );

            const result = await createAssistanceRequest(newRequest);

            if (result.success === false) {
                alert(result.message || "Failed to submit assistance request.");
                return;
            }

            setAssistanceRequests(prev => [...prev, newRequest]);
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
        loadAllData,
        refreshAllData,
        loadAnnouncements,
        handleRefresh,
        updateStatus,
        handleFormSubmit
    };
}