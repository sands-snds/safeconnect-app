import React from "react";
import { tx } from "../../../i18n/adminText";

export const NUMBER_DIGITS = { mobile: 10, landline: 9 };

export const localDigits = (value) => {
  const raw = String(value ?? "").trim();
  if (raw.startsWith("+63")) return raw.slice(3).replace(/\D/g, "");
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("63") && d.length >= 11) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d;
};

const PLACEHOLDER = { mobile: "9XX XXX XXXX", landline: "46 XXX XXXX" };

// part: "type" (just the Mobile / Landline choice) or "digits" (just the
// +63 number) when a table shows them in separate columns; both by default.
const PhoneNumberInput = ({ number, numberType = "mobile", onChange, label = "Number", part }) => {
  const digits = localDigits(number);
  const type = NUMBER_DIGITS[numberType] ? numberType : "mobile";

  const update = (nextDigits, nextType = type) => {
    const clean = nextDigits.replace(/\D/g, "").slice(0, NUMBER_DIGITS[nextType]);
    onChange({ number: clean ? `+63${clean}` : "", numberType: nextType });
  };

  const typeSelect = (
    <select
      className="form-select"
      value={type}
      onChange={(e) => update(digits, e.target.value)}
      aria-label={`${label} type`}
      style={{ width: part === "type" ? "100%" : 108, flexShrink: 0 }}
    >
      <option value="mobile">{tx("Mobile")}</option>
      <option value="landline">{tx("Landline")}</option>
    </select>
  );

  const digitsBox = (
    <div style={{ display: "flex", alignItems: "stretch", flex: 1, minWidth: 0 }}>
      <span
        aria-hidden="true"
        style={{ display: "flex", alignItems: "center", padding: "0 8px", border: "1px solid #d1d5db", borderRight: "none", borderRadius: "6px 0 0 6px", background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 600 }}
      >
        +63
      </span>
      <input
        className="form-input"
        value={digits}
        onChange={(e) => update(e.target.value)}
        inputMode="numeric"
        maxLength={NUMBER_DIGITS[type]}
        placeholder={PLACEHOLDER[type]}
        aria-label={label}
        style={{ borderRadius: "0 6px 6px 0", minWidth: 0, width: "100%" }}
      />
    </div>
  );

  if (part === "type") return typeSelect;
  if (part === "digits") return digitsBox;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {typeSelect}
      {digitsBox}
    </div>
  );
};

export default PhoneNumberInput;
