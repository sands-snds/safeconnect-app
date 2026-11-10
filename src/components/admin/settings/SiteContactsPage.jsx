import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchSiteContent, updateSiteContent } from "../../../Services/api";
import { showPopup, confirmPopup } from "../../shared/popup";
import { setSiteContent, officialName } from "../../shared/useSiteContent";
import EmergencyContactList from "../../shared/EmergencyContactList";
import DonationFooter from "../../shared/DonationFooter";
import PhoneNumberInput from "./PhoneNumberInput";
import Table from "../shared/Table";
import { tx } from "../../../i18n/adminText";

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

const TEXT_MAX = 40;

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

// Table cells hold inputs, so they're a little tighter than the Users table.
const cellStyle = { padding: "10px 8px", verticalAlign: "middle" };

// The contact's color: its dot opens the preset colors and a custom picker.
const ColorPicker = ({ color, colors, label, onChange }) => {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const custom = !colors.some((c) => c.toLowerCase() === (color || "").toLowerCase());
  const dot = (c, active) => ({ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: active ? "3px solid #111827" : "2px solid #fff", boxShadow: "0 0 0 1px #d1d5db", padding: 0 });
  return (
    <div ref={box} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" aria-label={label} aria-expanded={open} title={tx("Change color")} onClick={() => setOpen((v) => !v)} style={{ ...dot(color, false), width: 30, height: 30 }} />
      {open && (
        <div role="dialog" aria-label={label} style={{ position: "absolute", top: 36, left: 0, zIndex: 20, display: "grid", gridTemplateColumns: "repeat(5, 24px)", gap: 8, padding: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
          {colors.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => { onChange(c); setOpen(false); }} style={dot(c, color === c)} />
          ))}
          <label
            title={tx("Custom color")}
            aria-label={tx("Custom color")}
            style={{ ...dot(custom ? color : "#fff", custom), position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: custom ? "#fff" : "#374151", fontSize: 14 }}
          >
            <i className="bi bi-plus" />
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(color || "") ? color : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: 0, padding: 0 }}
            />
          </label>
        </div>
      )}
    </div>
  );
};

// Move up / move down / remove, for one table row. onRemove null: no remove.
const OrderButtons = ({ index, count, onMove, onRemove, removeDisabled = false }) => (
  <div style={{ display: "flex", gap: 6 }}>
    <button type="button" style={iconButton()} title={tx("Move up")} aria-label={tx("Move up")} disabled={index === 0} onClick={() => onMove(-1)}><i className="bi bi-arrow-up" /></button>
    <button type="button" style={iconButton()} title={tx("Move down")} aria-label={tx("Move down")} disabled={index === count - 1} onClick={() => onMove(1)}><i className="bi bi-arrow-down" /></button>
    {onRemove && (
      <button type="button" style={iconButton(true)} title={tx("Remove")} aria-label={tx("Remove")} disabled={removeDisabled} onClick={onRemove}><i className="bi bi-trash3" /></button>
    )}
  </div>
);

const SiteContactsPage = () => {
  const [saved, setSaved] = useState(null);   // last saved copy (for "Discard changes")
  const [draft, setDraft] = useState(null);
  const [options, setOptions] = useState({ icons: Object.keys(ICON_NAMES), colors: ["#dc2626", "#1d4ed8", "#059669", "#ea580c", "#7c3aed", "#0891b2", "#db2777", "#6B2C3E"] });
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  // Contacts whose "People to choose from" row is open (by contact id).
  const [openPeople, setOpenPeople] = useState(() => new Set());
  const togglePeople = (key) => setOpenPeople((set) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

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

  const setChoices = (index, fn) =>
    setContacts((list) => list.map((c, i) => (i === index ? { ...c, choices: fn(c.choices || []) } : c)));

  const updateOfficial = (index, patch) =>
    setOfficials((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));

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

        <Table
          minWidth={1080}
          headers={[
            { label: "Color", width: 64 },
            { label: "Icon", width: 170 },
            "Name",
            "Description",
            { label: "Number", width: 250 },
            { label: "People to choose from", width: 150 },
            { label: "Shown", width: 90 },
            { label: "Order", width: 130 }
          ]}
        >
          {draft.emergencyContacts.map((c, i) => {
            const key = c.id || `contact-${i}`;
            const people = c.choices || [];
            const peopleOpen = openPeople.has(key);
            const is911 = c.number === "911";
            return (
              <React.Fragment key={key}>
                <tr>
                  <td className="table-cell" style={cellStyle}>
                    <ColorPicker
                      color={c.color}
                      colors={options.colors}
                      label={`${c.label || tx("Contact")} ${tx("color")}`}
                      onChange={(color) => updateContact(i, { color })}
                    />
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        aria-hidden="true"
                        title={ICON_NAMES[c.icon] || "Icon"}
                        style={{ width: 32, height: 32, borderRadius: "50%", background: c.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <i className={`bi ${c.icon}`} />
                      </span>
                      <select className="form-select" value={c.icon} onChange={(e) => updateContact(i, { icon: e.target.value })} aria-label={`${c.label || tx("Contact")} ${tx("icon")}`} style={{ minWidth: 0 }}>
                        {options.icons.map((icon) => (
                          <option key={icon} value={icon}>{ICON_NAMES[icon] || icon}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    <input className="form-input" value={c.label} maxLength={TEXT_MAX} onChange={(e) => updateContact(i, { label: e.target.value })} placeholder={tx("e.g. Barangay Sta. Fe")} aria-label={tx("Name")} />
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    <input className="form-input" value={c.description || ""} maxLength={TEXT_MAX} onChange={(e) => updateContact(i, { description: e.target.value })} placeholder={tx("e.g. Barangay Emergency Line")} aria-label={tx("Description")} />
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    {is911 ? (
                      // The national emergency number stays 911.
                      <div className="form-input" title={tx("911 can't be changed")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", color: "#374151", fontWeight: 600 }}>
                        <i className="bi bi-lock-fill" aria-hidden="true" style={{ color: "#6b7280" }} /> 911
                      </div>
                    ) : (
                      <PhoneNumberInput number={c.number} numberType={c.numberType} label={`${c.label || "Contact"} number`}
                        onChange={(next) => updateContact(i, next)} />
                    )}
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-expanded={peopleOpen}
                      onClick={() => togglePeople(key)}
                      style={{ fontSize: 13, padding: "6px 10px", whiteSpace: "nowrap" }}
                    >
                      <i className={`bi ${people.length ? "bi-people-fill" : "bi-person-plus"}`} aria-hidden="true" />{" "}
                      {people.length ? tx("{{count}} people", { count: people.length }) : tx("Add people")}{" "}
                      <i className={`bi ${peopleOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    {is911 ? (
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
                      <span style={{ fontSize: 12.5, color: "#6b7280" }} title={tx("Remove it to take it off the call button.")}>{tx("Always")}</span>
                    )}
                  </td>
                  <td className="table-cell" style={cellStyle}>
                    <OrderButtons
                      index={i}
                      count={draft.emergencyContacts.length}
                      onMove={(delta) => setContacts((l) => move(l, i, delta))}
                      // 911 can be switched off but not removed.
                      onRemove={is911 ? null : () => removeAt(setContacts, i, `"${c.label || "this contact"}" from the call button`)}
                      removeDisabled={draft.emergencyContacts.length === 1}
                    />
                  </td>
                </tr>
                {peopleOpen && (
                  <tr>
                    <td className="table-cell" colSpan={8} style={{ ...cellStyle, background: "#f9fafb" }}>
                      <div style={{ ...labelStyle, marginBottom: 2 }}>
                        {tx("People to choose from (optional)")} · {c.label || tx("this contact")}
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
                        {people.length
                          ? tx("Callers pick one of these people instead of calling the number above.")
                          : tx("Leave empty to call the number above directly, or add people so callers can choose who to call.")}
                      </p>
                      {people.map((p, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                          <input className="form-input" style={{ flex: "1 1 200px", minWidth: 0, maxWidth: 320 }} value={p.name} maxLength={TEXT_MAX} placeholder={tx("e.g. PB Juan Dela Cruz")} aria-label={`Person ${j + 1} name`}
                            onChange={(e) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)))} />
                          <div style={{ flex: "1 1 250px", minWidth: 0, maxWidth: 340 }}>
                            <PhoneNumberInput number={p.number} numberType={p.numberType} label={`Person ${j + 1} number`}
                              onChange={(next) => setChoices(i, (l) => l.map((x, k) => (k === j ? { ...x, ...next } : x)))} />
                          </div>
                          <button type="button" style={iconButton(true)} title={tx("Remove person")}
                            onClick={async () => { if (await confirmRemove(`"${p.name || `person ${j + 1}`}"`)) setChoices(i, (l) => l.filter((_, k) => k !== j)); }}><i className="bi bi-x-lg" /></button>
                        </div>
                      ))}
                      <button type="button" className="button button-secondary" style={{ fontSize: 13, padding: "6px 12px" }}
                        disabled={people.length >= 4}
                        onClick={() => setChoices(i, (l) => [...l, { name: "", number: "", numberType: "mobile" }])}>
                        <i className="bi bi-person-plus" /> {tx("Add person")}
                      </button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </Table>

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 12 }}
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

        <Table
          minWidth={900}
          headers={[
            { label: "Position", width: 140 },
            "First name",
            { label: "Middle name (optional)", width: 130 },
            "Last name",
            { label: "Number type", width: 120 },
            { label: "Number", width: 190 },
            { label: "Order", width: 130 }
          ]}
        >
          {draft.officials.map((o, i) => {
            const who = officialName(o) || tx("Official");
            return (
              <tr key={i}>
                <td className="table-cell" style={cellStyle}>
                  <input className="form-input" value={o.position || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { position: e.target.value })} placeholder={tx("e.g. Kagawad")} aria-label={tx("Position")} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <input className="form-input" value={o.firstName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { firstName: e.target.value })} placeholder={tx("e.g. Juan")} autoComplete="off" aria-label={tx("First name")} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <input className="form-input" value={o.middleName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { middleName: e.target.value })} placeholder={tx("e.g. D.")} autoComplete="off" aria-label={tx("Middle name (optional)")} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <input className="form-input" value={o.lastName || ""} maxLength={TEXT_MAX} onChange={(e) => updateOfficial(i, { lastName: e.target.value })} placeholder={tx("e.g. Dela Cruz")} autoComplete="off" aria-label={tx("Last name")} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <PhoneNumberInput part="type" number={o.number} numberType={o.numberType} label={`${who} number`} onChange={(next) => updateOfficial(i, next)} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <PhoneNumberInput part="digits" number={o.number} numberType={o.numberType} label={`${who} number`} onChange={(next) => updateOfficial(i, next)} />
                </td>
                <td className="table-cell" style={cellStyle}>
                  <OrderButtons
                    index={i}
                    count={draft.officials.length}
                    onMove={(delta) => setOfficials((l) => move(l, i, delta))}
                    onRemove={() => removeAt(setOfficials, i, `"${officialName(o) || "this official"}" from the footer`)}
                  />
                </td>
              </tr>
            );
          })}
        </Table>

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 12 }}
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

        <Table
          minWidth={560}
          headers={["Name", { label: "Number", width: 240 }, { label: "Order", width: 130 }]}
        >
          {(draft.footerHotlines || []).map((h, i) => (
            <tr key={i}>
              <td className="table-cell" style={cellStyle}>
                <input className="form-input" value={h.label} maxLength={TEXT_MAX} onChange={(e) => updateHotline(i, { label: e.target.value })} placeholder={tx("e.g. Bureau of Fire Protection")} aria-label={tx("Name")} />
              </td>
              <td className="table-cell" style={cellStyle}>
                <input className="form-input" value={h.number} maxLength={25} onChange={(e) => updateHotline(i, { number: e.target.value })} placeholder={tx("e.g. +63464161234")} inputMode="tel" aria-label={tx("Number")} />
              </td>
              <td className="table-cell" style={cellStyle}>
                <OrderButtons
                  index={i}
                  count={draft.footerHotlines.length}
                  onMove={(delta) => setHotlines((l) => move(l, i, delta))}
                  onRemove={() => removeAt(setHotlines, i, `"${h.label || "this hotline"}" from the footer`)}
                />
              </td>
            </tr>
          ))}
        </Table>

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 12 }}
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
