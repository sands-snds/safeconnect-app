import React, { useEffect, useMemo, useState } from "react";
import { fetchSiteContent, updateSiteContent } from "../../../Services/api";
import { showPopup } from "../../shared/popup";
import { setSiteContent } from "../../shared/useSiteContent";

// Content > Site Contacts (Admins only): edits what the public site shows
//   - Emergency contacts: the floating call button (landing + resident
//     pages) and the footer's "Emergency Hotline" column
//   - Barangay officials: the footer's "Barangay Officials" column
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
    return <div style={sectionStyle}>Couldn't load the site contacts. Please refresh the page.</div>;
  }
  if (!draft) return <div style={sectionStyle}>Loading site contacts...</div>;

  const setContacts = (fn) => setDraft((d) => ({ ...d, emergencyContacts: fn(d.emergencyContacts) }));
  const setOfficials = (fn) => setDraft((d) => ({ ...d, officials: fn(d.officials) }));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSiteContent(draft);
      if (!result?.success) {
        showPopup({ type: "error", title: "Couldn't Save Contacts", message: result?.message || "Please check the details and try again." });
        return;
      }
      setSaved(result.content);
      setDraft(result.content);
      setSiteContent(result.content);
      showPopup({ type: "success", title: "Contacts Saved", message: "The call button and the footer now show the updated details." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>
      {/* ── Emergency contacts ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-telephone-fill" style={{ color: "#dc2626", marginRight: 8 }} />
          Emergency Contacts
        </h3>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
          Shown in the red floating call button on the landing and resident pages, and in the footer's
          Emergency Hotline column. Listed in this order.
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
              <span style={labelStyle}>Name</span>
              <input className="form-input" value={c.label} maxLength={60} onChange={(e) => updateContact(i, { label: e.target.value })} placeholder="e.g. Barangay Sta. Fe" />
            </label>
            <label style={fieldStyle("1 1 200px")}>
              <span style={labelStyle}>Description</span>
              <input className="form-input" value={c.description || ""} maxLength={80} onChange={(e) => updateContact(i, { description: e.target.value })} placeholder="e.g. Barangay Emergency Line" />
            </label>
            <label style={fieldStyle("1 1 150px")}>
              <span style={labelStyle}>Number</span>
              <input className="form-input" value={c.number} maxLength={25} onChange={(e) => updateContact(i, { number: e.target.value })} placeholder="e.g. +639171234567" inputMode="tel" />
            </label>
            <label style={fieldStyle("0 1 150px")}>
              <span style={labelStyle}>Icon</span>
              <select className="form-select" value={c.icon} onChange={(e) => updateContact(i, { icon: e.target.value })}>
                {options.icons.map((icon) => (
                  <option key={icon} value={icon}>{ICON_NAMES[icon] || icon}</option>
                ))}
              </select>
            </label>
            <div style={fieldStyle("0 1 auto")}>
              <span style={labelStyle}>Color</span>
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
                      title="Custom color"
                      aria-label="Custom color"
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
              <button type="button" style={iconButton()} title="Move up" disabled={i === 0} onClick={() => setContacts((l) => move(l, i, -1))}><i className="bi bi-arrow-up" /></button>
              <button type="button" style={iconButton()} title="Move down" disabled={i === draft.emergencyContacts.length - 1} onClick={() => setContacts((l) => move(l, i, 1))}><i className="bi bi-arrow-down" /></button>
              <button type="button" style={iconButton(true)} title="Remove" disabled={draft.emergencyContacts.length === 1} onClick={() => setContacts((l) => l.filter((_, j) => j !== i))}><i className="bi bi-trash3" /></button>
            </div>

            {/* Optional: let the caller choose who to call */}
            <div style={{ flex: "1 1 100%", marginLeft: 48, minWidth: 0, background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ ...labelStyle, marginBottom: 2 }}>People to choose from (optional)</div>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
                {(c.choices || []).length
                  ? "Callers pick one of these people instead of calling the number above."
                  : "Leave empty to call the number above directly, or add people so callers can choose who to call."}
              </p>
              {(c.choices || []).map((p, j) => (
                <div key={j} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                  <input className="form-input" style={{ flex: "1 1 200px", minWidth: 0 }} value={p.name} maxLength={80} placeholder="e.g. PB Juan Dela Cruz" aria-label={`Person ${j + 1} name`}
                    onChange={(e) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)))} />
                  <input className="form-input" style={{ flex: "1 1 150px", minWidth: 0 }} value={p.number} maxLength={25} placeholder="e.g. 09171234567" inputMode="tel" aria-label={`Person ${j + 1} number`}
                    onChange={(e) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, number: e.target.value } : x)))} />
                  <button type="button" style={iconButton(true)} title="Remove person" onClick={() => setChoices(i, (l) => l.filter((_, k) => k !== j))}><i className="bi bi-x-lg" /></button>
                </div>
              ))}
              <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: "6px 12px" }}
                disabled={(c.choices || []).length >= 4}
                onClick={() => setChoices(i, (l) => [...l, { name: "", number: "" }])}>
                <i className="bi bi-person-plus" /> Add person
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 8 }}
          disabled={draft.emergencyContacts.length >= 12}
          onClick={() => setContacts((l) => [...l, { id: `contact-${Date.now()}`, label: "", description: "", number: "", icon: options.icons[0], color: options.colors[0] }])}
        >
          <i className="bi bi-plus-lg" /> Add emergency contact
        </button>
      </div>

      {/* ── Barangay officials ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-people-fill" style={{ color: "#6B2C3E", marginRight: 8 }} />
          Barangay Officials
        </h3>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#6b7280" }}>
          Shown in the footer's Barangay Officials column, in this order. Numbers are shown exactly as typed.
        </p>

        {draft.officials.map((o, i) => (
          <div key={i} style={rowStyle}>
            <label style={fieldStyle("2 1 240px")}>
              <span style={labelStyle}>Position and name</span>
              <input className="form-input" value={o.name} maxLength={80} onChange={(e) => updateOfficial(i, { name: e.target.value })} placeholder="e.g. PB Juan Dela Cruz" />
            </label>
            <label style={fieldStyle("1 1 160px")}>
              <span style={labelStyle}>Number</span>
              <input className="form-input" value={o.number} maxLength={25} onChange={(e) => updateOfficial(i, { number: e.target.value })} placeholder="e.g. 09171234567" inputMode="tel" />
            </label>
            <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
              <button type="button" style={iconButton()} title="Move up" disabled={i === 0} onClick={() => setOfficials((l) => move(l, i, -1))}><i className="bi bi-arrow-up" /></button>
              <button type="button" style={iconButton()} title="Move down" disabled={i === draft.officials.length - 1} onClick={() => setOfficials((l) => move(l, i, 1))}><i className="bi bi-arrow-down" /></button>
              <button type="button" style={iconButton(true)} title="Remove" onClick={() => setOfficials((l) => l.filter((_, j) => j !== i))}><i className="bi bi-trash3" /></button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 8 }}
          disabled={draft.officials.length >= 20}
          onClick={() => setOfficials((l) => [...l, { name: "", number: "" }])}
        >
          <i className="bi bi-plus-lg" /> Add official
        </button>
      </div>

      {/* ── Socials ── */}
      <div style={sectionStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-share-fill" style={{ color: "#1877f2", marginRight: 8 }} />
          Socials
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
          Shown in the footer's Socials column. Leave a field empty to hide it.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={fieldStyle("1 1 260px")}>
            <span style={labelStyle}>Support email</span>
            <input className="form-input" type="email" value={draft.socials.email || ""} maxLength={120} onChange={(e) => setSocial("email", e.target.value)} placeholder="name@example.com" />
          </label>
          <label style={fieldStyle("1 1 200px")}>
            <span style={labelStyle}>Facebook page name</span>
            <input className="form-input" value={draft.socials.facebookLabel || ""} maxLength={80} onChange={(e) => setSocial("facebookLabel", e.target.value)} placeholder="e.g. Barangay Sta. Fe" />
          </label>
          <label style={fieldStyle("2 1 320px")}>
            <span style={labelStyle}>Facebook page link</span>
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
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </span>
        <button type="button" className="button button-secondary" disabled={!dirty || saving} onClick={() => setDraft(saved)}>
          Discard changes
        </button>
        <button type="button" className="button button-primary" disabled={!dirty || saving} onClick={handleSave}>
          <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check-lg"}`} style={{ marginRight: 6 }} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default SiteContactsPage;
