import React, { useState } from 'react';
import { exportReport } from '../../../Services/api';

const STATUS_CHOICES = [
  { value: '', label: 'All Reports' },
  { value: 'Received', label: 'Received' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Dismissed', label: 'Dismissed' }
];

const FORMAT_CHOICES = [
  { value: 'pdf', label: 'PDF', hint: 'For printing and sharing', icon: 'bi-file-earmark-pdf', color: '#dc3545' },
  { value: 'excel', label: 'Excel', hint: 'For sorting and editing', icon: 'bi-file-earmark-excel', color: '#16a34a' }
];

const EARLIEST_DATE = '2026-09-01';

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const PERIOD_PRESETS = [
  { key: 'all', label: 'All time', range: () => ({ from: '', to: '' }) },
  { key: '7d', label: 'Last 7 days', range: () => ({ from: dayKey(daysAgo(6)), to: dayKey(new Date()) }) },
  { key: '30d', label: 'Last 30 days', range: () => ({ from: dayKey(daysAgo(29)), to: dayKey(new Date()) }) },
  {
    key: 'month',
    label: 'This month',
    range: () => {
      const now = new Date();
      return { from: dayKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: dayKey(now) };
    }
  },
  { key: 'custom', label: 'Custom', range: null }
];

const chipStyle = (active) => ({
  padding: '7px 12px',
  borderRadius: 8,
  border: `1px solid ${active ? '#6B2C3E' : '#d1d5db'}`,
  background: active ? '#FDECEC' : '#fff',
  color: active ? '#6B2C3E' : '#374151',
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer'
});

const sectionLabel = { display: 'block', fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 };

const ALL_ROLES = { value: '', label: 'All roles' };
const SYSTEM_REPORTS = {
  users: {
    roles: [ALL_ROLES, { value: 'resident', label: 'Residents' }, { value: 'admin', label: 'Officials' }, { value: 'super_admin', label: 'Admins' }],
    statuses: [{ value: '', label: 'All statuses' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Closed', label: 'Closed' }],
    dateLabel: 'Date registered'
  },
  signinLogs: {
    roles: [ALL_ROLES, { value: 'resident', label: 'Residents' }, { value: 'unknown', label: 'No account' }],
    statuses: [{ value: '', label: 'All attempts' }, { value: 'Success', label: 'Successful' }, { value: 'Failed', label: 'Failed' }],
    dateLabel: 'Sign-in date'
  },
  adminLogs: {
    roles: [ALL_ROLES, { value: 'admin', label: 'Officials' }, { value: 'super_admin', label: 'Admins' }],
    statuses: null,
    dateLabel: 'Activity date'
  }
};

const GenerateReportModal = ({ type, title, defaultStatus = '', baseFilters = {}, onClose }) => {
  const system = SYSTEM_REPORTS[type];
  const statusChoices = system ? (system.statuses || []) : STATUS_CHOICES;
  const [status, setStatus] = useState(
    statusChoices.some((s) => s.value === defaultStatus) ? defaultStatus : ''
  );
  const [role, setRole] = useState('');
  const [period, setPeriod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [format, setFormat] = useState('pdf');

  const analytics = type === 'analytics';
  const [includeBar, setIncludeBar] = useState(true);
  const [includePie, setIncludePie] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const choosePeriod = (preset) => {
    setPeriod(preset.key);
    setError('');
    if (preset.range) {
      const r = preset.range();
      setFrom(r.from);
      setTo(r.to);
    }
  };

  const today = dayKey(new Date());

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (from && to && from > to) {
      setError('The "From" date must be on or before the "To" date.');
      return;
    }

    if ((from && from > today) || (to && to > today)) {
      setError("Dates can't be in the future. Pick today or an earlier date.");
      return;
    }
    if ((from && from < EARLIEST_DATE) || (to && to < EARLIEST_DATE)) {
      setError('Dates start from September 1, 2026, when SafeConnect began.');
      return;
    }
    if (analytics && !includeBar && !includePie) {
      setError('Choose the bar graph, the pie chart, or both.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await exportReport(type, format, {
        ...(system ? baseFilters : {}),
        ...(system ? { role } : {}),
        ...(analytics ? { bar: includeBar ? '1' : '0', pie: includePie ? '1' : '0' } : {}),
        status: analytics && !includePie ? '' : status,
        from,
        to,
        tzOffset: new Date().getTimezoneOffset()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleGenerate}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: 460,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Generate Report</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>{title}</p>

        {system && (
          <>
            <div style={{ marginBottom: 18 }}>
              <span style={sectionLabel}>Role</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {system.roles.map((r) => (
                  <button key={r.label} type="button" onClick={() => setRole(r.value)} style={chipStyle(role === r.value)} aria-pressed={role === r.value}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {system.statuses && (
              <div style={{ marginBottom: 18 }}>
                <span style={sectionLabel}>Status</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {system.statuses.map((s) => (
                    <button key={s.label} type="button" onClick={() => setStatus(s.value)} style={chipStyle(status === s.value)} aria-pressed={status === s.value}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <span style={sectionLabel}>{system.dateLabel}</span>
              <p style={{ margin: '-4px 0 8px', fontSize: 12, color: '#6b7280' }}>Leave both empty to include every date.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 150px', fontSize: 13, color: '#374151' }}>
                  From
                  <input type="date" className="form-input" value={from} min={EARLIEST_DATE} max={to || today} onChange={(e) => setFrom(e.target.value)} style={{ marginTop: 4, width: '100%' }} />
                </label>
                <label style={{ flex: '1 1 150px', fontSize: 13, color: '#374151' }}>
                  To
                  <input type="date" className="form-input" value={to} min={from || EARLIEST_DATE} max={today} onChange={(e) => setTo(e.target.value)} style={{ marginTop: 4, width: '100%' }} />
                </label>
              </div>
            </div>
          </>
        )}

        {analytics && (
          <div style={{ marginBottom: 18 }}>
            <span style={sectionLabel}>Include in the report</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[['bar', 'Bar graph (reports over time)', includeBar, setIncludeBar, 'bi-bar-chart-fill'], ['pie', 'Pie chart (reports by status)', includePie, setIncludePie, 'bi-pie-chart-fill']].map(([key, label, on, set, icon]) => (
                <button key={key} type="button" onClick={() => set(!on)} style={chipStyle(on)} aria-pressed={on}>
                  <i className={`bi ${on ? 'bi-check-square-fill' : 'bi-square'}`} style={{ marginRight: 6 }} />
                  <i className={`bi ${icon}`} style={{ marginRight: 4 }} />{label}
                </button>
              ))}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>Each comes with its table and a Total row. Charts are drawn in the PDF; Excel has the tables.</p>
          </div>
        )}

        {!system && (
        <>
        {(!analytics || includePie) && (
        <div style={{ marginBottom: 18 }}>
          <span style={sectionLabel}>{analytics ? 'Reports to include (pie chart)' : 'Reports to include'}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STATUS_CHOICES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setStatus(s.value)}
                style={chipStyle(status === s.value)}
                aria-pressed={status === s.value}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <span style={sectionLabel}>Period</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => choosePeriod(p)}
                style={chipStyle(period === p.key)}
                aria-pressed={period === p.key}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 150px', fontSize: 13, color: '#374151' }}>
                From
                <input
                  type="date"
                  className="form-input"
                  value={from}
                  min={EARLIEST_DATE}
                  max={to || today}
                  onChange={(e) => setFrom(e.target.value)}
                  style={{ marginTop: 4, width: '100%' }}
                />
              </label>
              <label style={{ flex: '1 1 150px', fontSize: 13, color: '#374151' }}>
                To
                <input
                  type="date"
                  className="form-input"
                  value={to}
                  min={from || EARLIEST_DATE}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                  style={{ marginTop: 4, width: '100%' }}
                />
              </label>
            </div>
          )}
        </div>
        </>
        )}

        <div style={{ marginBottom: 20 }}>
          <span style={sectionLabel}>File type</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FORMAT_CHOICES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                aria-pressed={format === f.value}
                style={{
                  ...chipStyle(format === f.value),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  textAlign: 'left'
                }}
              >
                <i className={`bi ${f.icon}`} style={{ fontSize: 22, color: f.color }} />
                <span>
                  <span style={{ display: 'block' }}>{f.label}</span>
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 400, color: '#6b7280' }}>{f.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ margin: '0 0 12px', padding: '8px 10px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="button button-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={loading}>
            <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-download'}`} style={{ marginRight: 6 }} />
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerateReportModal;
