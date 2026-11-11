import React, { useState } from "react";
import { MAIN_LOGO } from "../../shared/logos";
import LanguageToggle from "../../shared/LanguageToggle";
import { tx } from "../../../i18n/adminText";

// Each menu item's icon (Bootstrap Icons), shown beside its name and alone
// when the menu is collapsed.
const ICONS = {
  dashboard: "bi-speedometer2",
  "incident-map": "bi-geo-alt-fill",
  notifications: "bi-bell-fill",
  "emergency-reports": "bi-exclamation-triangle-fill",
  "assistance-requests": "bi-life-preserver",
  "petty-crime-reports": "bi-shield-fill-exclamation",
  "announcement-page": "bi-megaphone-fill",
  "site-contacts": "bi-telephone-fill",
  "site-contents": "bi-images",
  "registered-users": "bi-people-fill",
  "account-verification": "bi-person-vcard-fill",
  "sign-in-logs": "bi-journal-text",
  "admin-logs": "bi-clipboard-data-fill"
};

const COLLAPSED_KEY = "sc_admin_sidebar_collapsed";
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; } };

const AdminSidebar = ({
  activeView,
  isSuperAdmin,
  onNavigate,
  onLogout,
  showMobileMenu,
  onCloseMobileMenu
}) => {
  // Desktop: the menu can shrink to its icons, giving the page more width.
  // Remembered in this browser. (The phone drawer always shows names.)
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1"); } catch { /* storage blocked */ }
    return !c;
  });

  const menuSections = [
    {
      title: "GENERAL",
      items: [
        {
          id: "dashboard",
          label: "Dashboard"
        },
        {
          id: "incident-map",
          label: "Incident Map"
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
          id: "account-verification",
          label: "Account Verification"
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

  const SidebarContent = ({ showProfile = false, compact = false }) => (
    <>
      {/* Logo */}
      <div
        style={{
          padding: compact ? "16px 0" : "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: compact ? "center" : "flex-start",
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

        {!compact && (
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
        )}
      </div>

      {/* Collapse / expand (desktop) */}
      {!showProfile && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!compact}
          aria-label={compact ? tx("Expand menu") : tx("Collapse menu")}
          title={compact ? tx("Expand menu") : tx("Collapse menu")}
          style={{
            display: "flex", alignItems: "center", justifyContent: compact ? "center" : "flex-start", gap: 10,
            margin: compact ? "10px 12px 0" : "10px 14px 0", padding: compact ? "9px 0" : "9px 12px",
            border: "1px solid rgba(255,255,255,.22)", borderRadius: 8, background: "transparent", color: "#fff",
            fontSize: 13, cursor: "pointer"
          }}
        >
          <i className={`bi ${compact ? "bi-chevron-double-right" : "bi-chevron-double-left"}`} aria-hidden="true" />
          {!compact && <span>{tx("Collapse menu")}</span>}
        </button>
      )}

      {/* Menu */}
      <div
        style={{
          padding: compact ? "14px 10px" : "14px"
        }}
      >
        {menuSections
          .filter((section) => isSuperAdmin || !section.superAdminOnly)
          .map((section) => (
          <div
            key={section.title}
            style={{ marginBottom: "12px" }}
          >
            {compact ? (
              <div aria-hidden="true" style={{ borderTop: "1px solid rgba(255,255,255,.18)", margin: "4px 8px 8px" }} />
            ) : (
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
            )}

            {section.items

              .filter((item) => isSuperAdmin || !item.superAdminOnly)
              .map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobileMenu();
                }}
                title={compact ? tx(item.label) : undefined}
                aria-label={compact ? tx(item.label) : undefined}
                aria-current={activeView === item.id ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: compact ? "center" : "flex-start",
                  width: "100%",
                  border: 0,
                  color: "inherit",
                  textAlign: "left",
                  fontFamily: "inherit",
                  gap: "10px",
                  padding: compact ? "10px 0" : "9px 12px",
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
                <i className={`bi ${ICONS[item.id] || "bi-dot"}`} aria-hidden="true" style={{ fontSize: compact ? 18 : 15, width: 18, textAlign: "center" }} />
                {!compact && <span>{tx(item.label)}</span>}
              </button>
            ))}
          </div>
        ))}

        {!compact && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "10px 12px", marginTop: 4 }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>{tx("Language")}</span>
          <LanguageToggle variant="light" />
        </div>
        )}

        {showProfile && (
          <>
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
      <div className={`desktop-sidebar${collapsed ? " collapsed" : ""}`}>
        <SidebarContent compact={collapsed} />
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