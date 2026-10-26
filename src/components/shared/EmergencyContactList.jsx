import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { contactDescription } from './useSiteContent';

// The contacts inside the red floating call button (landing + resident
// pages). Most contacts call right away. A contact with `choices` (e.g.
// Barangay Sta. Fe: the Punong Barangay or the Secretary) opens a short
// list first, so the caller picks who to call.

// "09354984838" -> "0935 498 4838", "+639354984838" -> "+63 935 498 4838".
export const formatMobile = (number) => {
  const n = String(number).replace(/\s/g, '');
  let m = n.match(/^(09\d{2})(\d{3})(\d{4})$/);
  if (m) return `${m[1]} ${m[2]} ${m[3]}`;
  m = n.match(/^\+63(9\d{2})(\d{3})(\d{4})$/);
  if (m) return `+63 ${m[1]} ${m[2]} ${m[3]}`;
  return number;
};

export const hasChoices = (contact) => Array.isArray(contact.choices) && contact.choices.length > 0;

const pill = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: color,
  color: '#fff',
  borderRadius: '20px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  flexShrink: 0,
  whiteSpace: 'nowrap'
});

export default function EmergencyContactList({ contacts, onCall }) {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {contacts.map((c) => {
        const choices = hasChoices(c);
        const open = choices && openId === c.id;
        return (
          <div key={c.id}>
            <button
              type="button"
              onClick={() => (choices ? setOpenId(open ? null : c.id) : onCall(c.number))}
              aria-expanded={choices ? open : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: open ? '10px 10px 0 0' : '10px',
                border: `1.5px solid ${c.color}22`,
                background: open ? `${c.color}22` : `${c.color}0d`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${c.color}22`; }}
              onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = `${c.color}0d`; }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${c.icon}`} style={{ color: '#fff', fontSize: '16px' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#111' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                  {choices ? t('emergencyContacts.chooseWho') : contactDescription(c, t)}
                </p>
              </div>
              <div style={pill(c.color)}>
                {choices ? (
                  <>
                    {t('emergencyContacts.choose')}
                    <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '10px' }} />
                  </>
                ) : (
                  <>
                    <i className="bi bi-telephone-fill" style={{ fontSize: '10px' }} />
                    {t('emergencyContacts.call')}
                  </>
                )}
              </div>
            </button>

            {open && (
              <div
                role="group"
                aria-label={c.label}
                style={{ border: `1.5px solid ${c.color}22`, borderTop: 'none', borderRadius: '0 0 10px 10px', background: '#fff', padding: '6px' }}
              >
                {c.choices.map((p) => (
                  <button
                    key={`${p.name}-${p.number}`}
                    type="button"
                    onClick={() => onCall(p.number)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${c.color}12`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="bi bi-person-circle" style={{ color: c.color, fontSize: '22px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '12.5px', color: '#111', lineHeight: 1.3 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#4b5563' }}>{formatMobile(p.number)}</p>
                    </div>
                    <div style={pill(c.color)}>
                      <i className="bi bi-telephone-fill" style={{ fontSize: '10px' }} />
                      {t('emergencyContacts.call')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
