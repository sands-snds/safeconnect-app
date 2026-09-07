import React from "react";

export default function UserDropdown({
  username,
  photoUrl,
  showDropdown,
  dropdownRef,
  onToggleDropdown,
  onOpenReports,
  onOpenSettings,
  onLogout,
}) {
  // photoUrl is already a full URL — api.js resolves it before storing
  const resolved = photoUrl || null;

  const initials = (username || "U")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="resident-user-menu-wrapper" ref={dropdownRef}>

      <button className="resident-user-menu" onClick={onToggleDropdown}>
        {resolved ? (
          <img
            src={resolved}
            alt="Profile"
            className="resident-user-avatar-img"
          />
        ) : (
          <i className="bi bi-person-circle" />
        )}
        <span>{username}</span>
        <i className="bi bi-chevron-down" style={{ fontSize: "0.8rem" }} />
      </button>

      <div className={`resident-user-dropdown ${showDropdown ? "show" : ""}`}>

        {/* mini profile card */}
        <div className="resident-dropdown-profile">
          {resolved ? (
            <img
              src={resolved}
              alt="Profile"
              className="resident-dropdown-avatar-img"
            />
          ) : (
            <div className="resident-dropdown-avatar-initials">{initials}</div>
          )}
          <span className="resident-dropdown-username">{username}</span>
        </div>

        <div className="resident-dropdown-divider" />

        <button className="resident-dropdown-item" onClick={onOpenReports}>
          <i className="bi bi-file-earmark-text-fill" />
          <span>My Reports</span>
        </button>

        <button className="resident-dropdown-item" onClick={onOpenSettings}>
          <i className="bi bi-gear-fill" />
          <span>Settings</span>
        </button>

        <div className="resident-dropdown-divider" />

        <button className="resident-dropdown-item" onClick={onLogout}>
          <i className="bi bi-box-arrow-right" />
          <span>Logout</span>
        </button>

      </div>
    </div>
  );
}