import React, { useState, useRef, useEffect } from 'react';
import { exportReport } from '../../../Services/api';

// Drop-in "Generate Report" control for an admin list page. Renders a single
// button that opens a small PDF/Excel choice, calls the export endpoint, and
// triggers the browser download. Designed to sit in the same row as a
// ListView's search/filter controls.
//
// Props:
//   type    - export type key the backend understands, e.g. "emergency"
//   label   - optional button label override (defaults to "Generate Report")
//   filters - optional plain object of the currently-applied filters/search,
//             forwarded to the backend so the export matches what's on screen
//   inline  - true when not in a labelled form row (e.g. above a chart); drops
//             the invisible spacer label used to line up with ListView fields
const GenerateReportButton = ({ type, label = 'Generate Report', filters = {}, inline = false }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleExport = async (format) => {
    setOpen(false);
    setLoading(true);
    try {
      await exportReport(type, format, filters);
    } catch (err) {
      console.error('Error generating report:', err);
      alert(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }} ref={menuRef}>
      {!inline && <label className="font-medium text-sm" style={{ visibility: 'hidden' }}>.</label>}
      <button
        type="button"
        className="button button-secondary"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
      >
        <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-file-earmark-arrow-down'}`}></i>
        {loading ? 'Generating…' : label}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 20,
            minWidth: '160px',
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            style={dropdownItemStyle}
          >
            <i className="bi bi-file-earmark-pdf" style={{ color: '#dc3545' }}></i>
            Download as PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            style={dropdownItemStyle}
          >
            <i className="bi bi-file-earmark-excel" style={{ color: '#16a34a' }}></i>
            Download as Excel
          </button>
        </div>
      )}
    </div>
  );
};

const dropdownItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontSize: '13px',
  cursor: 'pointer'
};

export default GenerateReportButton;