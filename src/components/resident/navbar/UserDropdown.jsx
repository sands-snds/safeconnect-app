import React from "react";

export default function UserDropdown({
    username,
    showDropdown,
    dropdownRef,

    onToggleDropdown,

    onOpenReports,
    onOpenSettings,
    onLogout
}) {

    return (

        <div
            className="resident-user-menu-wrapper"
            ref={dropdownRef}
        >

            <button
                className="resident-user-menu"
                onClick={onToggleDropdown}
            >

                <i className="bi bi-person-circle"></i>

                <span>{username}</span>

                <i
                    className="bi bi-chevron-down"
                    style={{
                        fontSize: "0.8rem"
                    }}
                ></i>

            </button>

            <div
                className={`resident-user-dropdown ${
                    showDropdown ? "show" : ""
                }`}
            >

                <button
                    className="resident-dropdown-item"
                    onClick={onOpenReports}
                >

                    <i className="bi bi-file-earmark-text-fill"></i>

                    <span>
                        My Reports
                    </span>

                </button>

                <button
                    className="resident-dropdown-item"
                    onClick={onOpenSettings}
                >

                    <i className="bi bi-gear-fill"></i>

                    <span>
                        Settings
                    </span>

                </button>

                <div
                    className="resident-dropdown-divider"
                />

                <button
                    className="resident-dropdown-item"
                    onClick={onLogout}
                >

                    <i className="bi bi-box-arrow-right"></i>

                    <span>
                        Logout
                    </span>

                </button>

            </div>

        </div>

    );

}