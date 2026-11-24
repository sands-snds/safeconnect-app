import React from "react";
import { tx } from "../../../i18n/adminText";

// "Filter by date registered" for the Residents table. Kept in
// filters.users.registered = { range, from, to } so changing it goes back to
// page 1 like the other filters.

export const REGISTERED_RANGES = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" }
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
// "2026-11-24" (from <input type="date">) as local midnight.
const fromInput = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

// Does this account's registration date fall in the chosen range?
export const registeredInRange = (user, registered, now = new Date()) => {
  const range = registered?.range || "any";
  if (range === "any") return true;
  const at = user.registeredAt ? new Date(user.registeredAt) : null;
  if (!at || isNaN(at)) return false;
  const day = startOfDay(at);
  const today = startOfDay(now);

  switch (range) {
    case "today":
      return day.getTime() === today.getTime();
    case "7":
    case "30": {
      const first = new Date(today);
      first.setDate(first.getDate() - (Number(range) - 1));
      return day >= first && day <= today;
    }
    case "month":
      return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
    case "year":
      return at.getFullYear() === now.getFullYear();
    case "custom": {
      let from = fromInput(registered.from);
      let to = fromInput(registered.to);
      if (from && to && from > to) [from, to] = [to, from];
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    }
    default:
      return true;
  }
};

const RegisteredDateFilter = ({ filters, setFilters }) => {
  const registered = filters.users?.registered || { range: "any", from: "", to: "" };
  const update = (patch) => setFilters((prev) => ({
    ...prev,
    users: { ...prev.users, registered: { ...registered, ...patch } }
  }));

  return (
    <div className="rdf" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
      <style>{`
        .rdf-field { display: flex; flex-direction: column; gap: 8px; }
        @media (max-width: 640px) {
          .rdf, .rdf-field { width: 100%; }
          .rdf-dates { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
        }
      `}</style>
      <div className="rdf-field">
        <label className="font-medium text-sm" htmlFor="rdf-range">{tx("Filter by date registered")}</label>
        <select
          id="rdf-range"
          className="form-select"
          value={registered.range || "any"}
          onChange={(e) => update({ range: e.target.value })}
        >
          {REGISTERED_RANGES.map((o) => (
            <option key={o.value} value={o.value}>{tx(o.label)}</option>
          ))}
        </select>
      </div>
      {registered.range === "custom" && (
        <div className="rdf-dates" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="rdf-field">
            <label className="font-medium text-sm" htmlFor="rdf-from">{tx("From")}</label>
            <input
              id="rdf-from"
              type="date"
              className="form-input"
              value={registered.from || ""}
              max={registered.to || undefined}
              onChange={(e) => update({ from: e.target.value })}
            />
          </div>
          <div className="rdf-field">
            <label className="font-medium text-sm" htmlFor="rdf-to">{tx("To")}</label>
            <input
              id="rdf-to"
              type="date"
              className="form-input"
              value={registered.to || ""}
              min={registered.from || undefined}
              onChange={(e) => update({ to: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredDateFilter;
