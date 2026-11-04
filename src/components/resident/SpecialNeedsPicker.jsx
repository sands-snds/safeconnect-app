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
  return (
    <div className="sn-grid">
      {SPECIAL_NEEDS_OPTIONS.map((option) => {
        const checked = selected.includes(option.value);
        const name = t(`emergencyModal.specialNeedsOptions.${option.key}`);
        const countId = `${idPrefix}-count-${option.key}`;
        return (
          <div key={option.key} className={`sn-card${checked ? ' checked' : ''}${invalidKey === option.key ? ' invalid' : ''}`}>
            <label className="sn-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                disabled={disabled}
              />
              <span>{name}</span>
            </label>
            {checked && (
              <div className="sn-count">
                <label htmlFor={countId}>{t('reportForm.specialNeedsHowMany')}</label>
                <input
                  id={countId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_SPECIAL_COUNT}
                  step={1}
                  placeholder="0"
                  value={counts[option.value] ?? ''}
                  onChange={(e) => onCountChange(option.value, e.target.value.replace(/\D/g, '').slice(0, 3))}
                  disabled={disabled}
                  aria-label={t('reportForm.specialNeedsCountLabel', { category: name })}
                  aria-invalid={invalidKey === option.key || undefined}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
