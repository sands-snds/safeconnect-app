import React from "react";
import { tx } from "../../../i18n/adminText";

// A Philippine number for Page Contacts: Mobile or Landline, then +63 (fixed)
// and only digits. Saved as "+63..." with numberType, checked again by
// backend/services/siteContentService.js (checkNumber).
export const NUMBER_DIGITS = { mobile: 10, landline: 9 };

// "+639171234567", "09171234567" -> "9171234567". A value starting with
// "+63" is what this box saves, so everything after it is the number, even
// while it's still being typed ("+639" -> "9").
export const localDigits = (value) => {
  const raw = String(value ?? "").trim();
  if (raw.startsWith("+63")) return raw.slice(3).replace(/\D/g, "");
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("63") && d.length >= 11) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d;
};

const PLACEHOLDER = { mobile: "9XX XXX XXXX", landline: "46 XXX XXXX" };

const PhoneNumberInput = ({ number, numberType = "mobile", onChange, label = "Number" }) => {
  const digits = localDigits(number);
  const type = NUMBER_DIGITS[numberType] ? numberType : "mobile";

  const update = (nextDigits, nextType = type) => {
    const clean = nextDigits.replace(/\D/g, "").slice(0, NUMBER_DIGITS[nextType]);
    onChange({ number: clean ? `+63${clean}` : "", numberType: nextType });
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select
        className="form-select"
        value={type}
        onChange={(e) => update(digits, e.target.value)}
        aria-label={`${label} type`}
        style={{ width: 108, flexShrink: 0 }}
      >
        <option value="mobile">{tx("Mobile")}</option>
        <option value="landline">{tx("Landline")}</option>
      </select>
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
    </div>
  );
};

export default PhoneNumberInput;
