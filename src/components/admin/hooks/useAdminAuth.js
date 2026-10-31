import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { confirmPopup } from "../../shared/popup";
import {
    clearAuthToken,
    logoutUser,
    fetchCurrentUser,
    getAuthToken,
    fetchUserProfile,
    resolveAssetUrl,
    logoutAdmin,
    SESSION_EXPIRED_EVENT
} from "../../../Services/api";

const ADMIN_USER_KEY = "adminUser";

const loadStoredAdminUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem(ADMIN_USER_KEY)) || null;
    } catch {
        return null;
    }
};



const getTokenUserId = () => {
    try {
        const payload = getAuthToken()?.split(".")[1];
        if (!payload) return null;
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json).id || null;
    } catch {
        return null;
    }
};

export default function useAdminAuth() {
    const navigate = useNavigate();

    
    
    
    
    
    const [authChecked, setAuthChecked] = useState(false);

    const [isAuthenticated, setIsAuthenticated] =
        useState(false);

    const [showSigninModal, setShowSignInModal] =
        useState(false);

    
    const [adminUser, setAdminUserState] =
        useState(loadStoredAdminUser);

    const setAdminUser = (user) => {
        setAdminUserState(user);
        if (user) {
            sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
        } else {
            sessionStorage.removeItem(ADMIN_USER_KEY);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = getAuthToken() ? await fetchCurrentUser({ admin: true }) : { success: false };
            if (cancelled) return;
            if (result.success && result.isAdmin) {
                sessionStorage.setItem("adminAuthenticated", "true");
                setIsAuthenticated(true);
                setShowSignInModal(false);
            } else {
                sessionStorage.removeItem("adminAuthenticated");
                setAdminUser(null);
                if (!result.offline) clearAuthToken();
                setIsAuthenticated(false);
                setShowSignInModal(true);
            }
            setAuthChecked(true);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    
    
    
    useEffect(() => {
        if (!isAuthenticated) return;

        const userId = getTokenUserId();
        if (!userId) return;

        fetchUserProfile(userId)
            .then((u) => {
                if (!u || !u.id) return;
                setAdminUser({
                    id: u.id,
                    fullName: u.full_name,
                    username: u.username,
                    email: u.email_address,
                    role: u.role,
                    photoUrl: resolveAssetUrl(u.photo_url)
                });
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    
    
    
    
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const onExpired = () => {
            if (!window.location.pathname.startsWith("/admin")) return;
            setSessionExpired(true);
            setShowSignInModal(true);
        };
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    }, []);

    const handleLogout = async () => {
        const confirmed = await confirmPopup({
            type: "warning",
            title: "Log out?",
            message: "You'll need to sign in again to use the admin panel.",
            confirmLabel: "Log out",
            cancelLabel: "Cancel"
        });
        if (!confirmed) return;

        
        
        await logoutAdmin();
        await logoutUser();

        sessionStorage.removeItem(
            "adminAuthenticated"
        );

        setAdminUser(null);

        clearAuthToken();

        setIsAuthenticated(false);

        setShowSignInModal(true);

        
        navigate("/", { replace: true, state: { signedOut: true } });
    };

    const isSuperAdmin = adminUser?.role === "super_admin";

    return {
        authChecked,
        isAuthenticated,
        isSuperAdmin,
        setIsAuthenticated,

        showSigninModal,
        setShowSignInModal,

        sessionExpired,
        setSessionExpired,

        adminUser,
        setAdminUser,

        handleLogout
    };
}
