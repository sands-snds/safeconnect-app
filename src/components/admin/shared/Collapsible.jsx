import React, { useState } from 'react';
import { tx } from "../../../i18n/adminText";

// Collapsible admin tables: a chevron button in the table's title bar hides
// or shows the table. Each table remembers its choice in this browser, so a
// table you closed stays closed the next time you open the page.

const storageKey = (key) => `sf_admin_collapsed_${key}`;

export function useCollapsed(key, initial = false) {
  const [collapsed, setCollapsed] = useState(() => {
    if (!key) return initial;
    try {
      const saved = localStorage.getItem(storageKey(key));
      return saved === null ? initial : saved === '1';
    } catch {
      return initial;
    }
  });
  const toggle = () => setCollapsed((was) => {
    const next = !was;
    if (key) {
      try { localStorage.setItem(storageKey(key), next ? '1' : '0'); } catch { /* not saved; still toggles */ }
    }
    return next;
  });
  return [collapsed, toggle];
}

// light: on a dark (maroon) title bar.
export function CollapseButton({ collapsed, onToggle, controls, light = false, label }) {
  const text = collapsed ? tx('Show table') : tx('Hide table');
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls={controls}
      aria-label={label ? `${text}: ${label}` : text}
      title={text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 10px',
        borderRadius: 8,
        border: light ? '1px solid rgba(255,255,255,0.35)' : '1px solid #e5e7eb',
        background: light ? 'rgba(255,255,255,0.12)' : '#fff',
        color: light ? '#fff' : '#374151',
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      <i className={`bi ${collapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`} aria-hidden="true" />
      {text}
    </button>
  );
}
