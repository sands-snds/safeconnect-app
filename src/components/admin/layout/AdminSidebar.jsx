import React from "react";

const AdminSidebar = ({
  activeView,
  isSuperAdmin,
  onNavigate,
  onLogout,
  showMobileMenu,
  onCloseMobileMenu,
  adminUser
}) => {
  const adminName = adminUser?.fullName || adminUser?.username || "Administrator";

  const menuSections = [
    {
      title: "GENERAL",
      items: [
        {
          id: "dashboard",
          label: "Dashboard"
        }
      ]
    },
    {
      title: "REPORTS",
      items: [
        {
          id: "emergency-reports",
          label: "Emergency Reports"
        },
        {
          id: "assistance-requests",
          label: "Assistance Requests"
        },
        {
          id: "petty-crime-reports",
          label: "Petty Crime Reports"
        }
      ]
    },
    {
      title: "CONTENT",
      items: [
        {
          id: "announcement-page",
          label: "Announcements"
        }
      ]
    },
    {
      title: "SYSTEM",
      superAdminOnly: true,
      items: [
        {
          id: "registered-users",
          label: "Users"
        },
        {
          id: "sign-in-logs",
          label: "Sign-in Logs"
        },
        {
          id: "admin-logs",
          label: "Admin Logs"
        }
      ]
    }
  ];

  // showProfile: the phone drawer, opened from the header's profile
  // button, starts with who is signed in (the desktop header shows that).
  const SidebarContent = ({ showProfile = false }) => (
    <>
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px",
          borderBottom: "1px solid rgba(255,255,255,.12)",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,.25)"
          }}
        >
          <img
            src="/images/safe-connect-logo.jpg"
            alt="Safe Connect logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.7rem",
              fontWeight: "700"
            }}
          >
            SafeConnect
          </h1>

          <p
            style={{
              marginTop: 4,
              fontSize: "12px",
              opacity: 0.75
            }}
          >
            Administration
          </p>
        </div>
      </div>

      {showProfile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,.12)"
          }}
        >
          {adminUser?.photoUrl ? (
            <img
              src={adminUser.photoUrl}
              alt="Profile"
              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {adminName.trim().split(/s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adminName}
            </div>
            {adminUser?.email && (
              <div style={{ fontSize: 12, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {adminUser.email}
              </div>
            )}
            <span
              style={{
                display: "inline-block",
                marginTop: 4,
                background: "rgba(255,255,255,.18)",
                padding: "1px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600
              }}
            >
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>
      )}

      {/* Menu */}
      <div
        style={{
          padding: "14px"
        }}
      >
        {menuSections
          .filter((section) => isSuperAdmin || !section.superAdminOnly)
          .map((section) => (
          <div
            key={section.title}
            style={{ marginBottom: "18px" }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                opacity: ".65",
                letterSpacing: "1px",
                marginBottom: "10px",
                padding: "0 10px"
              }}
            >
              {section.title}
            </div>

            {section.items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobileMenu();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 12px",
                  marginBottom: "4px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: ".2s",
                  fontSize: "14px",
                  fontWeight:
                    activeView === item.id ? 600 : 400,
                  background:
                    activeView === item.id
                      ? "rgba(255,255,255,.15)"
                      : "transparent"
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Divider */}
        <div
          style={{
            borderTop:
              "1px solid rgba(255,255,255,.12)",
            margin: "8px 0 12px"
          }}
        />

        {/* Logout */}
        <div
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "11px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            transition: ".2s"
          }}
        >
          <span>Logout</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <div className="desktop-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`mobile-menu-drawer ${
          showMobileMenu ? "open" : ""
        }`}
      >
        <SidebarContent showProfile />
      </div>
    </>
  );
};

export default AdminSidebar;