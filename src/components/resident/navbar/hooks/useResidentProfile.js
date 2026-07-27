import { useState, useEffect } from "react";

const loadCurrentUser = () => {
    try {
        const raw = sessionStorage.getItem("currentUser");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
    };

    const saveCurrentUser = (user) => {
    try {
        sessionStorage.setItem(
        "currentUser",
        JSON.stringify(user)
        );
    } catch {
        // Ignore storage errors
    }
    };


    export default function useResidentProfile() {

    const [currentUser, setCurrentUser] = useState(
        () => loadCurrentUser()
    );

    const [username, setUsername] = useState("User");

    useEffect(() => {

        const user = loadCurrentUser();

        if (user) {

        setCurrentUser(user);

        setUsername(
            user.username ||
            user.fullName ||
            "User"
        );

        return;

        }

        const storedName =
        localStorage.getItem("residentName");

        if (storedName) {
        setUsername(storedName);
        }

    }, []);

    const updateProfile = (updates) => {

        setCurrentUser((prev) => {

        const next = {
            ...(prev || {}),
            ...updates,
        };

        saveCurrentUser(next);

        return next;

        });

        if (updates.username) {

        setUsername(updates.username);

        try {

            localStorage.setItem(
            "residentName",
            updates.username
            );

        } catch {
            // Ignore storage errors
        }
        }

    };

    return {

        currentUser,
        username,

        setCurrentUser,
        setUsername,

        updateProfile,

    };

    }