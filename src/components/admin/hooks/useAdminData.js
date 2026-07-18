import { useState } from "react";

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
} from "../../Services/api";

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
    const loadAllData = async () => {
        setIsLoading(true);
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
        setIsLoading(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadAllData();
        setIsRefreshing(false);
    };

    const updateStatus = async (
        id,
        newStatus,
        type
    ) => {
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

    const handleFormSubmit = (e, type) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        });

    if (type === "emergency") {
        const newReport = {
            id: emergencyReports.length + 1,
            reporter: formData.get("reporter"),
            phone: formData.get("phone"),
            emergency: formData.get("emergency"),
            severity: formData.get("severity"),
            location: formData.get("location"),
            description: formData.get("description"),
            date: formatDate(formData.get("date")),
            status: "Received"
        };

        setEmergencyReports(prev => [...prev, newReport]);
    }

    if (type === "assistance") {
        const newRequest = {
            id: assistanceRequests.length + 1,
            requester: formData.get("requester"),
            phone: formData.get("phone"),
            email: formData.get("email"),
            assistanceType: formData.get("assistanceType"),
            peopleAffected: parseInt(formData.get("peopleAffected")),
            location: formData.get("location"),
            description: formData.get("description"),
            date: formatDate(formData.get("date")),
            status: "Pending"
        };

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
        loadAnnouncements,
        handleRefresh,
        updateStatus,
        handleFormSubmit
    };
}