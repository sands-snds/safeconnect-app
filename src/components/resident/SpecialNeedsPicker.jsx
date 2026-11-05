import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

// Special needs / considerations for the Emergency and Request Assistance
// forms. Ticking a category asks how many fall under it. Saved in the
// report's special_needs text as "Elderly (2), Children (3)", which the
// admin panel and the exports show as is.

export const SPECIAL_NEEDS_OPTIONS = [
  { key: 'elderly', value: 'Elderly' },
  { key: 'children', value: 'Children' },
  { key: 'pwd', value: 'Persons with disabilities' },
  { key: 'pregnant', value: 'Pregnant' },
  { key: 'pets', value: 'Pets' }
];

export const MAX_SPECIAL_COUNT = 999;

const validCount = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_SPECIAL_COUNT;
};

// ['Elderly', 'Children'], { Elderly: '2', Children: '3' } → "Elderly (2), Children (3)"
export const formatSpecialNeeds = (selected, counts = {}) => {
  const text = SPECIAL_NEEDS_OPTIONS
    .filter((o) => selected.includes(o.value))
    .map((o) => (validCount(counts[o.value]) ? `${o.value} (${Number(counts[o.value])})` : o.value))
    .join(', ');
  return text || null;
};

// The reverse, for editing a report (older reports have no counts).
export const parseSpecialNeeds = (text) => {
  const selected = [];
  const counts = {};
  String(text || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const match = /^(.*?)\s*\((\d+)\)$/.exec(part);
    const value = match ? match[1] : part;
    selected.push(value);
    if (match) counts[value] = match[2];
  });
  return { selected, counts };
};

// The first ticked category without a valid count, or null.
export const missingSpecialCount = (selected, counts = {}) =>
  SPECIAL_NEEDS_OPTIONS.find((o) => selected.includes(o.value) && !validCount(counts[o.value])) || null;

export default function SpecialNeedsPicker({ idPrefix, selected, counts, onToggle, onCountChange, disabled, invalidKey }) {
  const { t } = useLanguage();

  // Sets a category's count; 0 (or an empty box) unselects it.
  const setCount = (value, raw) => {
    const digits = String(raw).replace(/D/g, '').slice(0, 3);
    const n = Math.min(Number(digits) || 0, MAX_SPECIAL_COUNT);
    const isSelected = selected.includes(value);
    if (n > 0 && !isSelected) onToggle(value);
    if (n === 0 && isSelected) onToggle(value);
    onCountChange(value, digits === '' ? '' : String(n));
  };

  return (
    <div className="sn-list" role="group">
      {SPECIAL_NEEDS_OPTIONS.map((option) => {
        const checked = selected.includes(option.value);
        const name = t(`emergencyModal.specialNeedsOptions.${option.key}`);
        const countId = `${idPrefix}-count-${option.key}`;
        const raw = counts[option.value];
        const count = checked ? (raw ?? '') : '';
        const n = Number(count) || 0;
        return (
          <div key={option.key} className={`sn-row${checked ? ' checked' : ''}${invalidKey === option.key ? ' invalid' : ''}`}>
            <label className="sn-name" htmlFor={countId}>{name}</label>
            <div className="sn-stepper">
              <button
                type="button"
                className="sn-step"
                onClick={() => setCount(option.value, String(Math.max(0, n - 1)))}
                disabled={disabled || n === 0}
                aria-label={t('reportForm.specialNeedsLess', { category: name })}
              >
                <i className="bi bi-dash-lg" aria-hidden="true"></i>
              </button>
              <input
                id={countId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                // "?" for a category saved without a number (older reports)
                placeholder={checked ? '?' : '0'}
                value={count}
                onChange={(e) => setCount(option.value, e.target.value)}
                disabled={disabled}
                aria-label={t('reportForm.specialNeedsCountLabel', { category: name })}
                aria-invalid={invalidKey === option.key || undefined}
              />
              <button
                type="button"
                className="sn-step"
                onClick={() => setCount(option.value, String(n + 1))}
                disabled={disabled || n >= MAX_SPECIAL_COUNT}
                aria-label={t('reportForm.specialNeedsMore', { category: name })}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
