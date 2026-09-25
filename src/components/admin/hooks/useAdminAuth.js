import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    clearAuthToken,
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

// Reads the user id out of the JWT payload (no verification needed here --
// the backend still verifies the token on every request).
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

    const initialAuth =
        sessionStorage.getItem("adminAuthenticated") === "true";

    const [isAuthenticated, setIsAuthenticated] =
        useState(initialAuth);

    const [showSigninModal, setShowSignInModal] =
        useState(!initialAuth);

    // The signed-in admin's profile ({ id, fullName, username, email, photoUrl, ... }).
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

    // Sessions that signed in before adminUser was stored won't have it --
    // fetch it from the backend using the id in the token.
    useEffect(() => {
        if (!isAuthenticated || adminUser?.fullName) return;

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

    // The backend rejected our token (e.g. signed out in another tab).
    // Show the sign-in box over the current screen rather than logging
    // out, so an announcement being written isn't lost -- after signing
    // back in the admin can just submit again.
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

        // Needs the token, so it runs before clearAuthToken().
        await logoutAdmin();

        sessionStorage.removeItem(
            "adminAuthenticated"
        );

        setAdminUser(null);

        clearAuthToken();

        setIsAuthenticated(false);

        setShowSignInModal(true);

        navigate("/");
    };

    return {

        isAuthenticated,
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
