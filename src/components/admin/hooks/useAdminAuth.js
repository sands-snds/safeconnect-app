import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthToken } from "../../../Services/api";

export default function useAdminAuth() {

    const navigate = useNavigate();

    const initialAuth =
        sessionStorage.getItem("adminAuthenticated") === "true";

    const [isAuthenticated, setIsAuthenticated] =
        useState(initialAuth);

    const [showSigninModal, setShowSignInModal] =
        useState(!initialAuth);

    const handleLogout = () => {

        sessionStorage.removeItem(
            "adminAuthenticated"
        );

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

        handleLogout

    };

}