import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchMyReports,
  deleteEmergencyReport,
  deleteAssistanceRequest,
  deletePettyCrimeReport
} from '../../Services/api';
import ResidentEmergencyModal from "./ResidentEmergencyModal";
import ResidentAssistanceModal from "./ResidentAssistanceModal";
import ResidentPettyCrimeModal from "./ResidentPettyCrimeModal";

// Per-type accent color/icon so the three report kinds are easy to tell
// apart at a glance across the stats bar, filter pills, and cards.
const TYPE_THEME = {
  Emergency: { accent: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', icon: 'bi-exclamation-triangle-fill' },
  Assistance: { accent: '#0d9488', bg: 'rgba(13, 148, 136, 0.1)', icon: 'bi-life-preserver' },
  'Petty Crime': { accent: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', icon: 'bi-shield-exclamation' }
};
const getTypeTheme = (type) => TYPE_THEME[type] || { accent: '#6B2C3E', bg: 'rgba(107, 44, 62, 0.1)', icon: 'bi-file-earmark-text-fill' };

const STATUS_STYLE = {
  Received: { bg: '#fef3c7', color: '#92400e' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  'In Progress': { bg: '#dbeafe', color: '#1e40af' },
  Resolved: { bg: '#dcfce7', color: '#166534' },
  Completed: { bg: '#dcfce7', color: '#166534' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
  Cancelled: { bg: '#fee2e2', color: '#991b1b' }
};
const getStatusStyle = (status) => STATUS_STYLE[status] || { bg: '#f3f4f6', color: '#374151' };

const LEVEL_STYLE = {
  Critical: { bg: '#fee2e2', color: '#991b1b' },
  Urgent: { bg: '#fee2e2', color: '#991b1b' },
  High: { bg: '#ffedd5', color: '#9a3412' },
  Medium: { bg: '#fef9c3', color: '#854d0e' },
  Low: { bg: '#dcfce7', color: '#166534' },
  Variable: { bg: '#f3f4f6', color: '#374151' }
};
const getLevelStyle = (level) => LEVEL_STYLE[level] || { bg: '#f3f4f6', color: '#374151' };

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getRelativeTime = (dateStr) => {
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
};

const FILTERS = ['All', 'Emergency', 'Assistance', 'Petty Crime'];
const DESC_PREVIEW_LENGTH = 140;

function MyReportsPage({ isOpen, onClose, userId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [expandedKeys, setExpandedKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  const [editingReport, setEditingReport] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showCrimeModal, setShowCrimeModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const loadReports = async () => {
    if (!userId) {
      setError('We could not identify your account. Please sign in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyReports(userId);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load your reports right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const c = { All: reports.length, Emergency: 0, Assistance: 0, 'Petty Crime': 0 };
    reports.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }, [reports]);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => r.status === 'Received' || r.status === 'Pending').length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved' || r.status === 'Completed').length;
    return { total: reports.length, pending, inProgress, resolved };
  }, [reports]);

  const filteredReports = useMemo(() => {
    let list = activeFilter === 'All' ? reports : reports.filter((r) => r.type === activeFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.report_reference || '').toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return sortOrder === 'oldest' ? da - db : db - da;
    });
  }, [reports, activeFilter, searchQuery, sortOrder]);

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyReference = async (key, reference) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore, the reference is still visible to copy manually.
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    if (report.type === 'Emergency') setShowEmergencyModal(true);
    if (report.type === 'Assistance') setShowAssistanceModal(true);
    if (report.type === 'Petty Crime') setShowCrimeModal(true);
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete this ${report.type.toLowerCase()} report? This cannot be undone.`)) return;

    let result;
    if (report.type === 'Emergency') {
      result = await deleteEmergencyReport(report.id);
    } else if (report.type === 'Assistance') {
      result = await deleteAssistanceRequest(report.id);
    } else if (report.type === 'Petty Crime') {
      result = await deletePettyCrimeReport(report.id);
    }

    if (result?.success) {
      await loadReports();
    } else {
      alert('Failed to delete report.');
    }
  };

  const isSearchOrFilterActive = activeFilter !== 'All' || searchQuery.trim().length > 0;

  return (
    <div className={`myreports-fullscreen ${isOpen ? 'show' : ''}`}>
      <style>{`
        .myreports-fullscreen {
          position: fixed;
          inset: 0;
          background: #f7f5f6;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .myreports-fullscreen.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .myreports-header {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .myreports-header h2 {
          color: white;
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .myreports-header-sub {
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.8rem;
          margin: 0.2rem 0 0 2.2rem;
        }

        .myreports-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .myreports-close-btn:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .myreports-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) 4rem;
        }

        .myreports-stats {
          max-width: 960px;
          margin: 0 auto 1.75rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.9rem;
        }

        @media (max-width: 640px) {
          .myreports-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 0.9rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .stat-icon.total { background: rgba(107, 44, 62, 0.1); color: #6B2C3E; }
        .stat-icon.pending { background: #fef3c7; color: #92400e; }
        .stat-icon.progress { background: #dbeafe; color: #1e40af; }
        .stat-icon.resolved { background: #dcfce7; color: #166534; }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 0.72rem;
          color: #6b7280;
          margin: 0.1rem 0 0;
          font-weight: 600;
        }

        .myreports-toolbar {
          max-width: 960px;
          margin: 0 auto 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .myreports-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .myreports-filters {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .myreports-filter-btn {
          border: 1px solid #e5d9dc;
          background: white;
          color: #6b7280;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .myreports-filter-btn:hover {
          border-color: #6B2C3E;
        }

        .myreports-filter-btn.active {
          background: #6B2C3E;
          border-color: #6B2C3E;
          color: white;
        }

        .myreports-refresh-btn {
          border: 1px solid #e5d9dc;
          background: white;
          color: #6B2C3E;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .myreports-refresh-btn:hover {
          background: #6B2C3E;
          color: white;
        }

        .myreports-search-sort {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .myreports-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .myreports-search i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .myreports-search input {
          width: 100%;
          padding: 0.6rem 0.9rem 0.6rem 2.3rem;
          border-radius: 10px;
          border: 1px solid #e5d9dc;
          font-size: 0.88rem;
          outline: none;
          background: white;
        }

        .myreports-search input:focus {
          border-color: #6B2C3E;
        }

        .myreports-sort {
          padding: 0.6rem 0.9rem;
          border-radius: 10px;
          border: 1px solid #e5d9dc;
          font-size: 0.85rem;
          background: white;
          color: #374151;
          cursor: pointer;
          outline: none;
        }

        .myreports-result-count {
          max-width: 960px;
          margin: -0.75rem auto 1rem;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .myreports-state-message {
          max-width: 900px;
          margin: 2.5rem auto;
          text-align: center;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .myreports-empty {
          max-width: 500px;
          margin: 3rem auto;
          text-align: center;
        }

        .myreports-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(107, 44, 62, 0.08);
          color: #6B2C3E;
          font-size: 1.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .myreports-empty-icon.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .myreports-empty-title {
          color: #374151;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        .myreports-retry-btn,
        .myreports-clear-search {
          border: 1px solid #6B2C3E;
          background: white;
          color: #6B2C3E;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .myreports-retry-btn:hover,
        .myreports-clear-search:hover {
          background: #6B2C3E;
          color: white;
        }

        .myreports-list {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .myreports-card {
          background: white;
          border-radius: 16px;
          border-left: 4px solid transparent;
          padding: 1.35rem 1.5rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 1rem;
        }

        .myreports-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .myreports-card-main {
          flex: 1;
          min-width: 0;
        }

        .myreports-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.35rem;
        }

        .myreports-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .myreports-card-type {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0 0 0.3rem;
        }

        .myreports-status-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .myreports-card-desc {
          font-size: 0.9rem;
          color: #6b7280;
          line-height: 1.55;
          margin: 0.5rem 0 0;
        }

        .myreports-onbehalf {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: #6B2C3E;
          background: rgba(107, 44, 62, 0.06);
          border-radius: 8px;
          padding: 0.4rem 0.65rem;
          margin: 0.55rem 0 0;
        }

        .myreports-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.6rem;
        }

        .mini-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
        }

        .myreports-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 1rem;
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 0.55rem;
        }

        .myreports-card-meta span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .ref-chip {
          cursor: pointer;
          border: 1px dashed #d1d5db;
          border-radius: 999px;
          padding: 2px 10px;
          transition: border-color 0.2s;
        }

        .ref-chip:hover {
          border-color: #6B2C3E;
          color: #6B2C3E;
        }

        .myreports-expand-btn {
          border: none;
          background: none;
          color: #6B2C3E;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.6rem 0 0;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .myreports-detail-grid {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f0eaec;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.7rem 1.25rem;
        }

        @media (max-width: 560px) {
          .myreports-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .detail-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: #9ca3af;
        }

        .detail-value {
          font-size: 0.85rem;
          color: #374151;
        }

        .detail-value a {
          color: #6B2C3E;
          font-weight: 600;
          text-decoration: none;
        }

        .detail-value a:hover {
          text-decoration: underline;
        }

        .myreports-media-preview {
          grid-column: 1 / -1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          max-width: 320px;
        }

        .myreports-media-preview img,
        .myreports-media-preview video {
          display: block;
          width: 100%;
          max-height: 200px;
          object-fit: cover;
        }

        .myreports-actions {
          margin-top: 1rem;
          display: flex;
          gap: 10px;
        }

        .edit-btn,
        .delete-btn {
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: 0.2s;
        }

        .edit-btn {
          background: #2563eb;
          color: white;
        }

        .edit-btn:hover {
          background: #1d4ed8;
        }

        .delete-btn {
          background: #dc2626;
          color: white;
        }

        .delete-btn:hover {
          background: #b91c1c;
        }

        .skeleton-card {
          background: white;
          border-radius: 16px;
          padding: 1.35rem 1.5rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 1rem;
        }

        .skeleton-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 37%, #f0f0f0 63%);
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
          flex-shrink: 0;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 6px;
          margin-bottom: 10px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e5 37%, #f0f0f0 63%);
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

        .spin {
          animation: myreports-spin 0.8s linear infinite;
        }

        @keyframes myreports-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="myreports-header">
        <div>
          <h2><i className="bi bi-file-earmark-text-fill"></i> My Reports</h2>
          <p className="myreports-header-sub">Track and manage everything you've submitted</p>
        </div>
        <button className="myreports-close-btn" onClick={onClose} aria-label="Close my reports">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="myreports-body">
        {!loading && !error && reports.length > 0 && (
          <div className="myreports-stats">
            <div className="stat-card">
              <div className="stat-icon total"><i className="bi bi-inbox-fill"></i></div>
              <div>
                <p className="stat-value">{stats.total}</p>
                <p className="stat-label">Total</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending"><i className="bi bi-hourglass-split"></i></div>
              <div>
                <p className="stat-value">{stats.pending}</p>
                <p className="stat-label">Pending</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon progress"><i className="bi bi-arrow-repeat"></i></div>
              <div>
                <p className="stat-value">{stats.inProgress}</p>
                <p className="stat-label">In Progress</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon resolved"><i className="bi bi-check-circle-fill"></i></div>
              <div>
                <p className="stat-value">{stats.resolved}</p>
                <p className="stat-label">Resolved</p>
              </div>
            </div>
          </div>
        )}

        <div className="myreports-toolbar">
          <div className="myreports-toolbar-row">
            <div className="myreports-filters">
              {FILTERS.map((f) => {
                const theme = f === 'All' ? null : getTypeTheme(f);
                return (
                  <button
                    key={f}
                    className={`myreports-filter-btn ${activeFilter === f ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {theme && <i className={`bi ${theme.icon}`} style={{ color: activeFilter === f ? 'white' : theme.accent }}></i>}
                    {f} {counts[f] ? `(${counts[f]})` : ''}
                  </button>
                );
              })}
            </div>
            <button className="myreports-refresh-btn" onClick={loadReports} disabled={loading} aria-label="Refresh reports" title="Refresh">
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
          </div>

          {reports.length > 0 && (
            <div className="myreports-search-sort">
              <div className="myreports-search">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search by title, description, location, or reference number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="myreports-sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          )}
        </div>

        {!loading && !error && reports.length > 0 && isSearchOrFilterActive && (
          <p className="myreports-result-count">
            Showing {filteredReports.length} of {reports.length} report{reports.length === 1 ? '' : 's'}
          </p>
        )}

        {loading && (
          <div className="myreports-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-circle"></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-line" style={{ width: '25%' }}></div>
                  <div className="skeleton-line" style={{ width: '55%', height: '16px' }}></div>
                  <div className="skeleton-line" style={{ width: '90%' }}></div>
                  <div className="skeleton-line" style={{ width: '40%' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="myreports-empty">
            <div className="myreports-empty-icon error"><i className="bi bi-exclamation-circle"></i></div>
            <p className="myreports-empty-title">{error}</p>
            <button className="myreports-retry-btn" onClick={loadReports}>Try again</button>
          </div>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <div className="myreports-empty">
            <div className="myreports-empty-icon"><i className="bi bi-inbox"></i></div>
            <p className="myreports-empty-title">
              {searchQuery.trim()
                ? 'No reports match your search.'
                : activeFilter === 'All'
                  ? "You haven't submitted any reports yet."
                  : `You haven't submitted any ${activeFilter} reports yet.`}
            </p>
            {(searchQuery.trim() || activeFilter !== 'All') && (
              <button
                className="myreports-clear-search"
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="myreports-list">
            {filteredReports.map((r) => {
              const key = `${r.type}-${r.id}`;
              const statusStyle = getStatusStyle(r.status);
              const theme = getTypeTheme(r.type);
              const isExpanded = !!expandedKeys[key];
              const description = r.description || '';
              const needsTruncation = description.length > DESC_PREVIEW_LENGTH;
              const hasCoords = r.latitude != null && r.longitude != null;
              const canEditOrDelete = r.status === 'Pending' || r.status === 'Received';

              const detailItems = [];
              if (r.contact_number) detailItems.push({ label: 'Contact Number', value: r.contact_number });
              if (r.type === 'Emergency' && r.peopleAffected) detailItems.push({ label: 'People Affected', value: r.peopleAffected });
              if (r.type === 'Assistance' && r.number_of_people_needing_help) detailItems.push({ label: 'People Needing Help', value: r.number_of_people_needing_help });
              if (r.specialNeeds) detailItems.push({ label: 'Special Needs', value: r.specialNeeds });
              if (r.suspectInfo) detailItems.push({ label: 'Suspect Info', value: r.suspectInfo });
              if (r.report_for === 'others' && r.victim_contact) detailItems.push({ label: 'Their Contact', value: r.victim_contact });

              return (
                <div key={key} className="myreports-card" style={{ borderLeftColor: theme.accent }}>
                  <div className="myreports-card-icon" style={{ background: theme.bg, color: theme.accent }}>
                    <i className={`bi ${theme.icon}`}></i>
                  </div>
                  <div className="myreports-card-main">
                    <div className="myreports-card-top">
                      <div>
                        <p className="myreports-card-type" style={{ color: theme.accent }}>{r.type}</p>
                        <h3 className="myreports-card-title">{r.title || 'Untitled report'}</h3>
                      </div>
                      <span
                        className="myreports-status-pill"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="myreports-card-meta">
                      {r.date && (
                        <span title={formatDate(r.date)}>
                          <i className="bi bi-clock"></i> {formatDate(r.date)} ({getRelativeTime(r.date)})
                        </span>
                      )}
                      {r.location && (
                        <span><i className="bi bi-geo-alt"></i> {r.location}</span>
                      )}
                      {r.report_reference && (
                        <span
                          className="ref-chip"
                          onClick={() => copyReference(key, r.report_reference)}
                          title="Click to copy"
                        >
                          <i className={`bi ${copiedKey === key ? 'bi-check2' : 'bi-hash'}`}></i>
                          {copiedKey === key ? 'Copied!' : r.report_reference}
                        </span>
                      )}
                    </div>

                    {r.report_for === 'others' && r.victim_name && (
                      <div className="myreports-onbehalf">
                        <i className="bi bi-people-fill"></i>
                        Reported on behalf of <strong>&nbsp;{r.victim_name}</strong>
                        {r.victim_relationship ? ` (${r.victim_relationship})` : ''}
                      </div>
                    )}

                    {description && (
                      <p className="myreports-card-desc">
                        {isExpanded || !needsTruncation ? description : `${description.slice(0, DESC_PREVIEW_LENGTH)}…`}
                      </p>
                    )}

                    <div className="myreports-badges">
                      {r.type === 'Emergency' && r.severity && (
                        <span className="mini-badge" style={{ background: getLevelStyle(r.severity).bg, color: getLevelStyle(r.severity).color }}>
                          Severity: {r.severity}
                        </span>
                      )}
                      {r.type === 'Assistance' && r.urgency && (
                        <span className="mini-badge" style={{ background: getLevelStyle(r.urgency).bg, color: getLevelStyle(r.urgency).color }}>
                          Urgency: {r.urgency}
                        </span>
                      )}
                    </div>

                    {(needsTruncation || detailItems.length > 0 || hasCoords || r.photo_url) && (
                      <button className="myreports-expand-btn" onClick={() => toggleExpanded(key)}>
                        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        {isExpanded ? 'Show less' : 'View details'}
                      </button>
                    )}

                    {isExpanded && (detailItems.length > 0 || hasCoords || r.photo_url) && (
                      <div className="myreports-detail-grid">
                        {detailItems.map((item) => (
                          <div className="detail-item" key={item.label}>
                            <span className="detail-label">{item.label}</span>
                            <span className="detail-value">{item.value}</span>
                          </div>
                        ))}
                        {hasCoords && (
                          <div className="detail-item">
                            <span className="detail-label">Map</span>
                            <span className="detail-value">
                              <a
                                href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="bi bi-box-arrow-up-right"></i> Open in Google Maps
                              </a>
                            </span>
                          </div>
                        )}
                        {r.photo_url && (
                          <div className="myreports-media-preview">
                            {r.media_type === 'video' ? (
                              <video src={r.photo_url} controls />
                            ) : (
                              <img src={r.photo_url} alt="Attached evidence" />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {canEditOrDelete && (
                      <div className="myreports-actions">
                        <button className="edit-btn" onClick={() => handleEdit(r)}>
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(r)}>
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ResidentEmergencyModal
          show={showEmergencyModal}
          editingReport={editingReport}
          onClose={() => {
            setShowEmergencyModal(false);
            setEditingReport(null);
          }}
          onUpdated={loadReports}
        />

        <ResidentAssistanceModal
          show={showAssistanceModal}
          editingReport={editingReport}
          onClose={() => {
            setShowAssistanceModal(false);
            setEditingReport(null);
          }}
          onUpdated={loadReports}
        />

        <ResidentPettyCrimeModal
          show={showCrimeModal}
          editingReport={editingReport}
          onClose={() => {
            setShowCrimeModal(false);
            setEditingReport(null);
          }}
          onUpdated={loadReports}
        />
      </div>
    </div>
  );
}

export default MyReportsPage;
