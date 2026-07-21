import React from "react";

const AdminSidebar = ({
  activeView,
  onNavigate,
  onLogout,
  showMobileMenu,
  onCloseMobileMenu
}) => {
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
          id: "create-announcement",
          label: "Create Announcement"
        },
        {
          id: "announcement-page",
          label: "Announcements"
        }
      ]
    },
    {
      title: "SYSTEM",
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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px",
          borderBottom: "1px solid rgba(255,255,255,.12)"
        }}
      >
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

      {/* Menu */}
      <div
        style={{
          padding: "14px"
        }}
      >
        {menuSections.map((section) => (
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
        <SidebarContent />
      </div>
    </>
  );
};

export default AdminSidebar;