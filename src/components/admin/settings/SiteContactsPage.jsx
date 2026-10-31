import React, { useEffect, useMemo, useState } from "react";
import { fetchSiteContent, updateSiteContent } from "../../../Services/api";
import { showPopup, confirmPopup } from "../../shared/popup";
import { setSiteContent, officialName } from "../../shared/useSiteContent";
import EmergencyContactList from "../../shared/EmergencyContactList";
import DonationFooter from "../../shared/DonationFooter";
import PhoneNumberInput from "./PhoneNumberInput";
import { tx } from "../../../i18n/adminText";

// Content > Page Contacts (Admins only): edits what the public site shows,
// in two groups:
//   Call button
//   - Emergency contacts: the floating call button (landing + resident pages)
//   Footer
//   - Barangay officials: the footer's "Barangay Officials" column
//   - Emergency hotline: the footer's "Emergency Hotline" column (its own
//     list, without the barangay officials)
//   - Socials: the footer's support email and Facebook page
// Saved with PUT /api/site-content (backend/services/siteContentService.js).

const ICON_NAMES = {
  "bi-telephone-fill": "Phone",
  "bi-shield-fill-exclamation": "Emergency",
  "bi-shield-fill": "Police",
  "bi-heart-pulse-fill": "Medical / Rescue",
  "bi-people-fill": "Social welfare",
  "bi-house-fill": "Barangay",
  "bi-fire": "Fire",
  "bi-hospital-fill": "Hospital",
  "bi-truck": "Vehicle",
  "bi-lightning-charge-fill": "Power / Utility"
};

const sectionStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  marginBottom: 20
};

const rowStyle = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  flexWrap: "wrap",
  padding: "12px 0",
  borderTop: "1px solid #f3f4f6"
};

const fieldStyle = (flex) => ({ display: "flex", flexDirection: "column", gap: 4, flex, minWidth: 140 });
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#6b7280" };

const iconButton = (danger) => ({
  width: 34,
  height: 34,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  color: danger ? "#b91c1c" : "#374151",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center"
});

// Title above each group of sections (Call Button, Footer).
const GroupHeading = ({ icon, title, children }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 12px" }}>
    <span style={{ width: 38, height: 38, borderRadius: 10, background: "#FDECEC", color: "#B91C1C", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
      <i className={`bi ${icon}`} aria-hidden="true" />
    </span>
    <div>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827" }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{children}</p>
    </div>
  </div>
);

// Every text box is up to 40 characters (the Facebook link is longer).
const TEXT_MAX = 40;

// Asks before removing anything; resolves true to go ahead.
const confirmRemove = (what) =>
  confirmPopup({
    type: "danger",
    title: tx("Remove {{what}}?", { what }),
    message: tx("It's removed from this list now and from the site when you save changes."),
    confirmLabel: tx("Remove")
  });

const EMPTY_OFFICIAL = { position: "", firstName: "", middleName: "", lastName: "", number: "", numberType: "mobile" };

const move = (list, index, delta) => {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const SiteContactsPage = () => {
  const [saved, setSaved] = useState(null);   // last saved copy (for "Discard changes")
  const [draft, setDraft] = useState(null);
  const [options, setOptions] = useState({ icons: Object.keys(ICON_NAMES), colors: ["#dc2626", "#1d4ed8", "#059669", "#ea580c", "#7c3aed", "#0891b2", "#db2777", "#6B2C3E"] });
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetchSiteContent()
      .then((result) => {
        if (!result) throw new Error();
        setSaved(result.content);
        setDraft(result.content);
        if (result.options) setOptions(result.options);
      })
      .catch(() => setLoadError(true));
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  if (loadError) {
    return <div style={sectionStyle}>{tx("Couldn't load the page contacts. Please refresh the page.")}</div>;
  }
  if (!draft) return <div style={sectionStyle}>{tx("Loading page contacts...")}</div>;

  const setContacts = (fn) => setDraft((d) => ({ ...d, emergencyContacts: fn(d.emergencyContacts) }));
  const setOfficials = (fn) => setDraft((d) => ({ ...d, officials: fn(d.officials) }));
  const setHotlines = (fn) => setDraft((d) => ({ ...d, footerHotlines: fn(d.footerHotlines || []) }));
  const updateHotline = (index, patch) =>
    setHotlines((list) => list.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  const setSocial = (key, value) => setDraft((d) => ({ ...d, socials: { ...d.socials, [key]: value } }));

  const updateContact = (index, patch) =>
    setContacts((list) => list.map((c, i) => {
      if (i !== index) return c;
      const next = { ...c, ...patch };
      // A changed description replaces the translated default.
      if ("description" in patch) delete next.sublabelKey;
      return next;
    }));

  // People a caller can choose between for one contact (e.g. Barangay Sta. Fe).
  const setChoices = (index, fn) =>
    setContacts((list) => list.map((c, i) => (i === index ? { ...c, choices: fn(c.choices || []) } : c)));

  const updateOfficial = (index, patch) =>
    setOfficials((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  // Removes list[index] (via setList) after the Admin confirms.
  const removeAt = async (setList, index, what) => {
    if (await confirmRemove(what)) setList((l) => l.filter((_, j) => j !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSiteContent(draft);
      if (!result?.success) {
        showPopup({ type: "error", title: tx("Couldn't Save Contacts"), message: result?.message || "Please check the details and try again." });
        return;
      }
      setSaved(result.content);
      setDraft(result.content);
      setSiteContent(result.content);
      showPopup({ type: "success", title: tx("Contacts Saved"), message: tx("The call button and the footer now show the updated details.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>
      <GroupHeading icon="bi-telephone-outbound-fill" title={tx("Call Button")}>
        {tx("The red floating button on the landing and resident pages.")}
      </GroupHeading>

      {/* ── Emergency contacts ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-telephone-fill" style={{ color: "#dc2626", marginRight: 8 }} />
          {tx("Emergency Contacts")}
        </h3>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
          {tx("The numbers in the call button, in this order. The footer's hotlines are edited separately under Footer below.")}
        </p>

        {draft.emergencyContacts.map((c, i) => (
          <div key={c.id || i} style={rowStyle}>
            <div
              title={ICON_NAMES[c.icon] || "Icon"}
              style={{ width: 38, height: 38, borderRadius: "50%", background: c.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20, flexShrink: 0 }}
            >
              <i className={`bi ${c.icon}`} />
            </div>
            <label style={fieldStyle("1 1 160px")}>
              <span style={labelStyle}>{tx("Name")}</span>
              <input className="form-input" value={c.label} maxLength={TEXT_MAX} onChange={(e) => updateContact(i, { label: e.target.value })} placeholder={tx("e.g. Barangay Sta. Fe")} />
            </label>
            <label style={fieldStyle("1 1 200px")}>
              <span style={labelStyle}>{tx("Description")}</span>
              <input className="form-input" value={c.description || ""} maxLength={TEXT_MAX} onChange={(e) => updateContact(i, { description: e.target.value })} placeholder={tx("e.g. Barangay Emergency Line")} />
            </label>
            <div style={fieldStyle("1 1 250px")}>
              <span style={labelStyle}>{tx("Number")}</span>
              {c.number === "911" ? (
                // The national emergency number stays 911.
                <div className="form-input" title={tx("911 can't be changed")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", color: "#374151", fontWeight: 600 }}>
                  <i className="bi bi-lock-fill" aria-hidden="true" style={{ color: "#6b7280" }} /> 911
                </div>
              ) : (
                <PhoneNumberInput number={c.number} numberType={c.numberType} label={`${c.label || "Contact"} number`}
                  onChange={(next) => updateContact(i, next)} />
              )}
            </div>
            <label style={fieldStyle("0 1 150px")}>
              <span style={labelStyle}>{tx("Icon")}</span>
              <select className="form-select" value={c.icon} onChange={(e) => updateContact(i, { icon: e.target.value })}>
                {options.icons.map((icon) => (
                  <option key={icon} value={icon}>{ICON_NAMES[icon] || icon}</option>
                ))}
              </select>
            </label>
            <div style={fieldStyle("0 1 auto")}>
              <span style={labelStyle}>{tx("Color")}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4, maxWidth: 160 }}>
                {options.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    aria-pressed={c.color === color}
                    onClick={() => updateContact(i, { color })}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: color, cursor: "pointer", border: c.color === color ? "3px solid #111827" : "2px solid #fff", boxShadow: "0 0 0 1px #d1d5db" }}
                  />
                ))}
                {(() => {
                  const custom = !options.colors.some((p) => p.toLowerCase() === (c.color || "").toLowerCase());
                  return (
                    // The browser's own color picker, opened by the + button.
                    <label
                      title={tx("Custom color")}
                      aria-label={tx("Custom color")}
                      style={{ position: "relative", width: 22, height: 22, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: custom ? c.color : "#fff", color: custom ? "#fff" : "#374151", border: custom ? "3px solid #111827" : "2px solid #fff", boxShadow: "0 0 0 1px #d1d5db", fontSize: 14, lineHeight: 1 }}
                    >
                      <i className="bi bi-plus" />
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "#000000"}
                        onChange={(e) => updateContact(i, { color: e.target.value })}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: 0, padding: 0 }}
                      />
                    </label>
                  );
                })()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              <button type="button" style={iconButton()} title={tx("Move up")} disabled={i === 0} onClick={() => setContacts((l) => move(l, i, -1))}><i className="bi bi-arrow-up" /></button>
              <button type="button" style={iconButton()} title={tx("Move down")} disabled={i === draft.emergencyContacts.length - 1} onClick={() => setContacts((l) => move(l, i, 1))}><i className="bi bi-arrow-down" /></button>
              {c.number === "911" ? (
                // 911 can't be removed, only hidden from the call button.
                <button
                  type="button"
                  role="switch"
                  aria-checked={!c.hidden}
                  title={c.hidden ? tx("Hidden from the call button. Click to show it.") : tx("Shown in the call button. Click to hide it.")}
                  onClick={() => updateContact(i, { hidden: !c.hidden })}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 10px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                    border: `1px solid ${c.hidden ? "#d1d5db" : "#166534"}`, background: c.hidden ? "#f3f4f6" : "#dcfce7", color: c.hidden ? "#6b7280" : "#166534" }}
                >
                  <i className={`bi ${c.hidden ? "bi-toggle-off" : "bi-toggle-on"}`} style={{ fontSize: 18 }} />
                  {c.hidden ? tx("Off") : tx("On")}
                </button>
              ) : (
                <button type="button" style={iconButton(true)} title={tx("Remove")} disabled={draft.emergencyContacts.length === 1} onClick={() => removeAt(setContacts, i, `"${c.label || "this contact"}" from the call button`)}><i className="bi bi-trash3" /></button>
              )}
            </div>

            {/* Optional: let the caller choose who to call */}
            <div style={{ flex: "1 1 100%", marginLeft: 48, minWidth: 0, background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ ...labelStyle, marginBottom: 2 }}>{tx("People to choose from (optional)")}</div>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
                {(c.choices || []).length
                  ? tx("Callers pick one of these people instead of calling the number above.")
                  : tx("Leave empty to call the number above directly, or add people so callers can choose who to call.")}
              </p>
              {(c.choices || []).map((p, j) => (
                <div key={j} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                  <input className="form-input" style={{ flex: "1 1 200px", minWidth: 0 }} value={p.name} maxLength={TEXT_MAX} placeholder={tx("e.g. PB Juan Dela Cruz")} aria-label={`Person ${j + 1} name`}
                    onChange={(e) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)))} />
                  <div style={{ flex: "1 1 250px", minWidth: 0 }}>
                    <PhoneNumberInput number={p.number} numberType={p.numberType} label={`Person ${j + 1} number`}
                      onChange={(next) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, ...next } : x)))} />
                  </div>
                  <button type="button" style={iconButton(true)} title={tx("Remove person")}
                    onClick={async () => { if (await confirmRemove(`"${p.name || `person ${j + 1}`}"`)) setChoices(i, (l) => l.filter((_, k) => k !== j)); }}><i className="bi bi-x-lg" /></button>
                </div>
              ))}
              <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: "6px 12px" }}
                disabled={(c.choices || []).length >= 4}
                onClick={() => setChoices(i, (l) => [...l, { name: "", number: "", numberType: "mobile" }])}>
                <i className="bi bi-person-plus" /> {tx("Add person")}
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 8 }}
          disabled={draft.emergencyContacts.length >= 12}
          onClick={() => setContacts((l) => [...l, { id: `contact-${Date.now()}`, label: "", description: "", number: "", numberType: "mobile", icon: options.icons[0], color: options.colors[0] }])}
        >
          <i className="bi bi-plus-lg" /> {tx("Add emergency contact")}
        </button>
      </div>

      <GroupHeading icon="bi-layout-text-window-reverse" title={tx("Footer")}>
        {tx("The bottom of the landing and resident pages: Barangay Officials, Emergency Hotline and Socials.")}
      </GroupHeading>

      {/* ── Barangay officials ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-people-fill" style={{ color: "#6B2C3E", marginRight: 8 }} />
          {tx("Barangay Officials")}
        </h3>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
          {tx("Shown in the footer's Barangay Officials column, in this order, as position and name (e.g. \"Kagawad Juan D. Dela Cruz\").")}
        </p>

        {draft.officials.map((o, i) => (
          <div key={i} style={rowStyle}>
            <label style={fieldStyle("1 1 130px")}>
              <span style={labelStyle}>{tx("Position")}</span>
              <input className="form-input" value={o.position || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { position: e.target.value })} placeholder={tx("e.g. Kagawad")} />
            </label>
            <label style={fieldStyle("1 1 140px")}>
              <span style={labelStyle}>{tx("First name")}</span>
              <input className="form-input" value={o.firstName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { firstName: e.target.value })} placeholder={tx("e.g. Juan")} autoComplete="off" />
            </label>
            <label style={fieldStyle("1 1 120px")}>
              <span style={labelStyle}>{tx("Middle name (optional)")}</span>
              <input className="form-input" value={o.middleName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { middleName: e.target.value })} placeholder={tx("e.g. D.")} autoComplete="off" />
            </label>
            <label style={fieldStyle("1 1 140px")}>
              <span style={labelStyle}>{tx("Last name")}</span>
              <input className="form-input" value={o.lastName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { lastName: e.target.value })} placeholder={tx("e.g. Dela Cruz")} autoComplete="off" />
            </label>
            <div style={fieldStyle("1 1 250px")}>
              <span style={labelStyle}>{tx("Number")}</span>
              <PhoneNumberInput number={o.number} numberType={o.numberType} label={`${officialName(o) || "Official"} number`}
                onChange={(next) => updateOfficial(i, next)} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              <button type="button" style={iconButton()} title={tx("Move up")} disabled={i === 0} onClick={() => setOfficials((l) => move(l, i, -1))}><i className="bi bi-arrow-up" /></button>
              <button type="button" style={iconButton()} title={tx("Move down")} disabled={i === draft.officials.length - 1} onClick={() => setOfficials((l) => move(l, i, 1))}><i className="bi bi-arrow-down" /></button>
              <button type="button" style={iconButton(true)} title={tx("Remove")} onClick={() => removeAt(setOfficials, i, `"${officialName(o) || "this official"}" from the footer`)}><i className="bi bi-trash3" /></button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 8 }}
          disabled={draft.officials.length >= 20}
          onClick={() => setOfficials((l) => [...l, { ...EMPTY_OFFICIAL }])}
        >
          <i className="bi bi-plus-lg" /> {tx("Add official")}
        </button>
      </div>

      {/* ── Footer emergency hotline ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-telephone-fill" style={{ color: "#dc2626", marginRight: 8 }} />
          {tx("Emergency Hotline")}
        </h3>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
          {tx("Shown in the footer's Emergency Hotline column, in this order. Separate from the call button, so leave out the barangay officials: they're already in the column beside it.")}
        </p>

        {(draft.footerHotlines || []).map((h, i) => (
          <div key={i} style={rowStyle}>
            <label style={fieldStyle("2 1 240px")}>
              <span style={labelStyle}>{tx("Name")}</span>
              <input className="form-input" value={h.label} maxLength={TEXT_MAX} onChange={(e) => updateHotline(i, { label: e.target.value })} placeholder={tx("e.g. Bureau of Fire Protection")} />
            </label>
            <label style={fieldStyle("1 1 160px")}>
              <span style={labelStyle}>{tx("Number")}</span>
              <input className="form-input" value={h.number} maxLength={25} onChange={(e) => updateHotline(i, { number: e.target.value })} placeholder={tx("e.g. +63464161234")} inputMode="tel" />
            </label>
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              <button type="button" style={iconButton()} title={tx("Move up")} disabled={i === 0} onClick={() => setHotlines((l) => move(l, i, -1))}><i className="bi bi-arrow-up" /></button>
              <button type="button" style={iconButton()} title={tx("Move down")} disabled={i === draft.footerHotlines.length - 1} onClick={() => setHotlines((l) => move(l, i, 1))}><i className="bi bi-arrow-down" /></button>
              <button type="button" style={iconButton(true)} title={tx("Remove")} onClick={() => removeAt(setHotlines, i, `"${h.label || "this hotline"}" from the footer`)}><i className="bi bi-trash3" /></button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 8 }}
          disabled={(draft.footerHotlines || []).length >= 12}
          onClick={() => setHotlines((l) => [...l, { label: "", number: "" }])}
        >
          <i className="bi bi-plus-lg" /> {tx("Add hotline")}
        </button>
      </div>

      {/* ── Socials ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-share-fill" style={{ color: "#1877f2", marginRight: 8 }} />
          {tx("Socials")}
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
          {tx("Shown in the footer's Socials column. Leave a field empty to hide it.")}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={fieldStyle("1 1 260px")}>
            <span style={labelStyle}>{tx("Support email")}</span>
            <input className="form-input" type="email" value={draft.socials.email || ""} maxLength={TEXT_MAX} onChange={(e) => setSocial("email", e.target.value)} placeholder="name@example.com" />
          </label>
          <label style={fieldStyle("1 1 200px")}>
            <span style={labelStyle}>{tx("Facebook page name")}</span>
            <input className="form-input" value={draft.socials.facebookLabel || ""} maxLength={TEXT_MAX} onChange={(e) => setSocial("facebookLabel", e.target.value)} placeholder={tx("e.g. Barangay Sta. Fe")} />
          </label>
          <label style={fieldStyle("2 1 320px")}>
            <span style={labelStyle}>{tx("Facebook page link")}</span>
            <input className="form-input" type="url" value={draft.socials.facebookUrl || ""} maxLength={300} onChange={(e) => setSocial("facebookUrl", e.target.value)} placeholder="https://www.facebook.com/..." />
          </label>
        </div>
      </div>

      {/* ── Save bar ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)"
        }}
      >
        <span style={{ marginRight: "auto", fontSize: 13, color: dirty ? "#92400e" : "#6b7280" }}>
          {dirty ? tx("You have unsaved changes.") : tx("All changes saved.")}
        </span>
        <button type="button" className="button button-secondary" disabled={!dirty || saving} onClick={() => setDraft(saved)}>
          {tx("Discard changes")}
        </button>
        <button type="button" className="button button-soft" onClick={() => setPreviewing(true)}>
          <i className="bi bi-eye" style={{ marginRight: 6 }} />
          {tx("Preview")}
        </button>
        <button type="button" className="button button-primary" disabled={!dirty || saving} onClick={handleSave}>
          <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check-lg"}`} style={{ marginRight: 6 }} />
          {saving ? tx("Saving…") : tx("Save changes")}
        </button>
      </div>

      {previewing && <ContactsPreview draft={draft} onClose={() => setPreviewing(false)} />}
    </div>
  );
};

// How the call button's list and the footer will look with these (unsaved) changes.
const ContactsPreview = ({ draft, onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={tx("Preview")} style={{ background: "#fff", borderRadius: 14, width: "min(1100px, 100%)", maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17 }}>{tx("Preview")}</h3>
          <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280" }}>{tx("Not saved yet. This is how the site will look after you save.")}</p>
        </div>
        <button type="button" className="button button-secondary" onClick={onClose}>{tx("Close")}</button>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>{tx("Call button (opened)")}</div>
          <div style={{ maxWidth: 320, border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <EmergencyContactList contacts={draft.emergencyContacts} onCall={() => {}} />
          </div>
        </div>
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>{tx("Footer")}</div>
          <div style={{ borderRadius: 12, overflow: "hidden" }}>
            <DonationFooter content={draft} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SiteContactsPage;
