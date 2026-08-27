import React from "react";

export default function UserDropdown({
    username,
    photoUrl,
    showDropdown,
    dropdownRef,

    onToggleDropdown,

    onOpenReports,
    onOpenSettings,
    onLogout
}) {

    // Derive initials from username as fallback
    const initials = (username || "U")
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (

        <div
            className="resident-user-menu-wrapper"
            ref={dropdownRef}
        >

            <button
                className="resident-user-menu"
                onClick={onToggleDropdown}
            >

                {/* Profile photo if uploaded, otherwise default icon */}
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt="Profile"
                        className="resident-user-avatar-img"
                    />
                ) : (
                    <i className="bi bi-person-circle"></i>
                )}

                <span>{username}</span>

                <i
                    className="bi bi-chevron-down"
                    style={{ fontSize: "0.8rem" }}
                ></i>

            </button>

            <div
                className={`resident-user-dropdown ${
                    showDropdown ? "show" : ""
                }`}
            >

                {/* Mini profile card at the top of the dropdown */}
                <div className="resident-dropdown-profile">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt="Profile"
                            className="resident-dropdown-avatar-img"
                        />
                    ) : (
                        <div className="resident-dropdown-avatar-initials">
                            {initials}
                        </div>
                    )}
                    <span className="resident-dropdown-username">
                        {username}
                    </span>
                </div>

                <div className="resident-dropdown-divider" />

                <button
                    className="resident-dropdown-item"
                    onClick={onOpenReports}
                >
                    <i className="bi bi-file-earmark-text-fill"></i>
                    <span>My Reports</span>
                </button>

                <button
                    className="resident-dropdown-item"
                    onClick={onOpenSettings}
                >
                    <i className="bi bi-gear-fill"></i>
                    <span>Settings</span>
                </button>

                <div className="resident-dropdown-divider" />

                <button
                    className="resident-dropdown-item"
                    onClick={onLogout}
                >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                </button>

            </div>

        </div>

    );

}