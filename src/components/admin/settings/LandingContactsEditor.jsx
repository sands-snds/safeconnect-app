import React from "react";
import PhoneNumberInput from "./PhoneNumberInput";
import { translations } from "../../../i18n/translations";
import { tx } from "../../../i18n/adminText";

// Page Contents → the landing page's Emergency Contacts section (the 911 card
// and the list of numbers beside it). Its wording is kept with the page
// contents; a blank box shows the built-in English / Tagalog text. The
// numbers are the same emergency contacts as the residents' call button
// (Page Contacts), so a change here shows there too; a contact can be left
// off this section only.

const DEFAULTS = translations.en.contact;

const FIELDS = [
  { group: "Heading", key: "badge", label: "Small label above the title", max: 40 },
  { group: "Heading", key: "title", label: "Title", max: 120 },
  { group: "Heading", key: "subtitle", label: "Text under the title", max: 300, long: true },
  { group: "911 card", key: "sosEyebrow", label: "Card heading", max: 40 },
  { group: "911 card", key: "sosLabel", label: "Card text", max: 160, long: true },
  { group: "911 card", key: "sosButton", label: "Button", max: 30 },
  { group: "Banner below the numbers", key: "bannerTitle", label: "Banner title", max: 100 },
  { group: "Banner below the numbers", key: "bannerDesc", label: "Banner text", max: 300, long: true },
  { group: "Banner below the numbers", key: "bannerCta", label: "Banner button", max: 30 }
];

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 };
const hint = { margin: "0 0 12px", fontSize: 13, color: "#6b7280" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#6b7280" };
const field = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };

const STYLE = `
  .lce-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px; }
  .lce-grid .lce-long { grid-column: span 3; }
  .lce-group { margin: 18px 0 8px; font-size: 13px; font-weight: 700; color: #374151; }
  .lce-contact { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
  .lce-contact.off { background: #f9fafb; }
  .lce-contact-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .lce-contact-icon { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lce-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 14px; }
  .lce-person { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 10px 14px; margin-top: 10px; }
  .lce-show { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
  .lce-show input { width: 18px; height: 18px; accent-color: #6B2C3E; }
  @media (max-width: 760px) {
    .lce-grid, .lce-row, .lce-person { grid-template-columns: 1fr; }
    .lce-grid .lce-long { grid-column: auto; }
    .lce-show { margin-left: 0; width: 100%; }
  }
`;

const LandingContactsEditor = ({ section = {}, onSectionChange, contacts = [], onContactsChange }) => {
  const setText = (key, value) => onSectionChange({ ...section, [key]: value });
  const updateContact = (id, patch) => onContactsChange(contacts.map((c) => {
    if (c.id !== id) return c;
    const next = { ...c, ...patch };
    // A changed description replaces the translated default.
    if ("description" in patch) delete next.sublabelKey;
    if (next.hideOnLanding === false) delete next.hideOnLanding;
    return next;
  }));
  const updatePerson = (id, index, patch) => onContactsChange(contacts.map((c) => (
    c.id !== id ? c : { ...c, choices: c.choices.map((p, i) => (i === index ? { ...p, ...patch } : p)) }
  )));

  // The numbers listed beside the 911 card (911 itself is the card).
  const listed = contacts.filter((c) => !c.hidden && String(c.number || "").replace(/\s/g, "") !== "911");
  let lastGroup = null;

  return (
    <div style={card}>
      <style>{STYLE}</style>
      <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
        <i className="bi bi-telephone-fill" style={{ color: "#6B2C3E", marginRight: 8 }} />
        {tx("Landing Page Emergency Contacts")}
      </h3>
      <p style={hint}>
        {tx("The \"Help is always one call away\" section of the landing page: its wording, the 911 card, and the numbers beside it. Leave a box empty to keep the built-in text (shown in English or Tagalog to match the visitor's language).")}
      </p>

      <div className="lce-grid">
        {FIELDS.map((f) => {
          const heading = f.group !== lastGroup ? (lastGroup = f.group) : null;
          const id = `lce-${f.key}`;
          return (
            <React.Fragment key={f.key}>
              {heading && <div className="lce-group" style={{ gridColumn: "1 / -1" }}>{tx(heading)}</div>}
              <div style={field} className={f.long ? "lce-long" : ""}>
                <label htmlFor={id} style={labelStyle}>{tx(f.label)}</label>
                {f.long ? (
                  <textarea
                    id={id}
                    className="form-input"
                    rows={2}
                    maxLength={f.max}
                    value={section[f.key] || ""}
                    placeholder={DEFAULTS[f.key]}
                    onChange={(e) => setText(f.key, e.target.value)}
                    style={{ resize: "vertical", minHeight: 64, height: "auto", padding: "10px 12px", lineHeight: 1.5 }}
                  />
                ) : (
                  <input
                    id={id}
                    className="form-input"
                    maxLength={f.max}
                    value={section[f.key] || ""}
                    placeholder={DEFAULTS[f.key]}
                    onChange={(e) => setText(f.key, e.target.value)}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="lce-group" style={{ marginTop: 24 }}>{tx("Numbers beside the 911 card")}</div>
      <p style={hint}>
        {tx("These are the same emergency contacts as the residents' call button (Page Contacts), so a change here shows there too. Untick \"Show here\" to leave a contact off this section only.")}
      </p>

      {listed.map((c) => {
        const shown = !c.hideOnLanding;
        const people = Array.isArray(c.choices) ? c.choices : [];
        return (
          <div key={c.id} className={`lce-contact${shown ? "" : " off"}`}>
            <div className="lce-contact-head">
              <span className="lce-contact-icon" style={{ background: `${c.color}15`, color: c.color }}>
                <i className={`bi ${c.icon}`} aria-hidden="true" />
              </span>
              <strong style={{ fontSize: 14.5, color: "#111827" }}>{c.label || tx("Contact")}</strong>
              <label className="lce-show">
                <input type="checkbox" checked={shown} onChange={(e) => updateContact(c.id, { hideOnLanding: !e.target.checked })} />
                {tx("Show here")}
              </label>
            </div>
            <div className="lce-row">
              <div style={field}>
                <label style={labelStyle} htmlFor={`lce-name-${c.id}`}>{tx("Name")}</label>
                <input id={`lce-name-${c.id}`} className="form-input" maxLength={40} value={c.label || ""} onChange={(e) => updateContact(c.id, { label: e.target.value })} />
              </div>
              <div style={field}>
                <label style={labelStyle} htmlFor={`lce-desc-${c.id}`}>{tx("Description")}</label>
                <input id={`lce-desc-${c.id}`} className="form-input" maxLength={40} value={c.description || ""} onChange={(e) => updateContact(c.id, { description: e.target.value })} />
              </div>
              {people.length === 0 && (
                <div style={{ ...field, gridColumn: "1 / -1" }}>
                  <span style={labelStyle}>{tx("Number")}</span>
                  <PhoneNumberInput
                    number={c.number}
                    numberType={c.numberType}
                    label={`${c.label || "Contact"} number`}
                    onChange={(next) => updateContact(c.id, next)}
                  />
                </div>
              )}
            </div>
            {people.map((p, i) => (
              <div key={i} className="lce-person">
                <div style={field}>
                  <label style={labelStyle} htmlFor={`lce-p-${c.id}-${i}`}>{tx("Person on call")} {i + 1}</label>
                  <input id={`lce-p-${c.id}-${i}`} className="form-input" maxLength={40} value={p.name || ""} onChange={(e) => updatePerson(c.id, i, { name: e.target.value })} />
                </div>
                <div style={field}>
                  <span style={labelStyle}>{tx("Number")}</span>
                  <PhoneNumberInput
                    number={p.number}
                    numberType={p.numberType}
                    label={`${p.name || "Person"} number`}
                    onChange={(next) => updatePerson(c.id, i, next)}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <p style={{ ...hint, margin: "4px 0 0" }}>
        {tx("To add or remove contacts, change their icon or colour, or change who is on call, use Page Contacts.")}
      </p>
    </div>
  );
};

export default LandingContactsEditor;
