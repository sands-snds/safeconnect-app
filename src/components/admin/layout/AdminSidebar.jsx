import React from "react";
import { MAIN_LOGO } from "../../shared/logos";
import LanguageToggle from "../../shared/LanguageToggle";
import { tx } from "../../../i18n/adminText";

const AdminSidebar = ({
  activeView,
  isSuperAdmin,
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
        },
        {
          id: "notifications",
          label: "Notifications"
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
        },
        {
          id: "site-contacts",
          label: "Page Contacts",
          superAdminOnly: true
        },
        {
          id: "site-contents",
          label: "Page Contents",
          superAdminOnly: true
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
          label: "Resident Logs"
        },
        {
          id: "admin-logs",
          label: "Admin Logs"
        }
      ]
    }
  ];

  const SidebarContent = ({ showProfile = false }) => (
    <>
      {/* Logo */}
      <div
        style={{
          padding: "16px 20px",
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
            flexShrink: 0
          }}
        >
          <img
            src={MAIN_LOGO}
            alt="Safe Connect logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
            {tx("Administration")}
          </p>
        </div>
      </div>

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
            style={{ marginBottom: "12px" }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                opacity: ".65",
                letterSpacing: "1px",
                marginBottom: "6px",
                padding: "0 10px"
              }}
            >
              {tx(section.title)}
            </div>

            {section.items

              .filter((item) => isSuperAdmin || !item.superAdminOnly)
              .map((item) => (
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
                  padding: "9px 12px",
                  marginBottom: "2px",
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
                <span>{tx(item.label)}</span>
              </div>
            ))}
          </div>
        ))}

        {showProfile && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", marginTop: 4 }}>
              <span style={{ fontSize: 13, opacity: 0.85 }}>{tx("Language")}</span>
              <LanguageToggle variant="light" />
            </div>
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
              <span>{tx("Logout")}</span>
            </div>
          </>
        )}
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