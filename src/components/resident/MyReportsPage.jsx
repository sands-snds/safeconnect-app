import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchMyReports,
  deleteEmergencyReport,
  deleteAssistanceRequest,
  deletePettyCrimeReport
} from '../../Services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import ResidentEmergencyModal from "./ResidentEmergencyModal";
import ResidentAssistanceModal from "./ResidentAssistanceModal";
import ResidentPettyCrimeModal from "./ResidentPettyCrimeModal";

const TYPE_LABEL_KEYS = { Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };
const typeLabel = (type, t) => (TYPE_LABEL_KEYS[type] ? t(`myReports.types.${TYPE_LABEL_KEYS[type]}`) : type);

const STATUS_LABEL_KEYS = {
  Received: 'received', Pending: 'pending', 'In Progress': 'inProgress',
  Resolved: 'resolved', Completed: 'completed', Rejected: 'rejected', Cancelled: 'cancelled'
};
const statusLabel = (status, t) => (STATUS_LABEL_KEYS[status] ? t(`myReports.status.${STATUS_LABEL_KEYS[status]}`) : status);

const STAGE_KEYS = ['received', 'inProgress', 'resolved'];

// Per-type accent color/icon so the three report kinds are easy to tell
// apart at a glance across the overview bar, tabs, and cards.
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

// Reports move Received/Pending -> In Progress -> Resolved/Completed. Rejected
// and Cancelled are terminal off-ramps, not a stage on that line, so they get
// their own badge instead of a half-filled progress stepper.
const STAGES = ['Received', 'In Progress', 'Resolved'];
const getStageIndex = (status) => {
  if (status === 'Received' || status === 'Pending') return 0;
  if (status === 'In Progress') return 1;
  if (status === 'Resolved' || status === 'Completed') return 2;
  return -1;
};

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
const FILTER_LABEL_KEYS = { All: 'all', Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };

function MyReportsPage({ isOpen, onClose, userId }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [copiedKey, setCopiedKey] = useState('');
  const [expandedKeys, setExpandedKeys] = useState({});
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
      setError(t('myReports.noAccount'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyReports(userId);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t('myReports.loadError'));
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
    const total = reports.length;
    return { total, pending, inProgress, resolved, other: total - pending - inProgress - resolved };
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

  const copyReference = async (key, reference) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore, the reference is still visible to copy manually.
    }
  };

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    if (report.type === 'Emergency') setShowEmergencyModal(true);
    if (report.type === 'Assistance') setShowAssistanceModal(true);
    if (report.type === 'Petty Crime') setShowCrimeModal(true);
  };

  const handleDelete = async (report) => {
    if (!window.confirm(t('myReports.confirmDelete', { type: typeLabel(report.type, t).toLowerCase() }))) return;

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
      alert(t('myReports.deleteFailed'));
    }
  };

  const isSearchOrFilterActive = activeFilter !== 'All' || searchQuery.trim().length > 0;

  return (
    <div className={`myreports-fullscreen ${isOpen ? 'show' : ''}`}>
      <style>{`
        .myreports-fullscreen {
          position: fixed;
          /* Sits below the always-visible navbar instead of covering it. */
          top: var(--resident-navbar-height, 76px);
          left: 0;
          right: 0;
          bottom: 0;
          background: #f5f2f3;
          z-index: 900;
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
          background: #fff;
          padding: 1.1rem clamp(1.5rem, 5vw, 4rem);
          display: flex;
          align-items: center;
          gap: 0.9rem;
          border-bottom: 1px solid #f0e8ea;
          flex-shrink: 0;
        }

        .myreports-header-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          box-shadow: 0 4px 12px rgba(107, 44, 62, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #FFC107;
          flex-shrink: 0;
        }

        .myreports-header h2 {
          color: #1a1416;
          font-size: clamp(1.15rem, 2.5vw, 1.45rem);
          font-weight: 800;
          margin: 0;
          line-height: 1.25;
        }

        .myreports-header-sub {
          color: #938c8f;
          font-size: 0.82rem;
          font-weight: 500;
          margin: 0.15rem 0 0;
        }

        .myreports-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) 4rem;
        }

        .mr-wrap { max-width: 880px; margin: 0 auto; }

        /* ── Overview: one wide segmented-bar card instead of four generic stat tiles ── */
        .mr-overview {
          background: #fff;
          border-radius: 18px;
          padding: 1.5rem 1.75rem;
          box-shadow: 0 4px 18px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 1.75rem;
          margin-bottom: 1.75rem;
        }

        @media (max-width: 600px) {
          .mr-overview { flex-direction: column; align-items: stretch; gap: 1rem; }
        }

        .mr-overview-total {
          text-align: center;
          flex-shrink: 0;
          padding-right: 1.75rem;
          border-right: 1px solid #f0eaec;
        }

        @media (max-width: 600px) {
          .mr-overview-total { border-right: none; border-bottom: 1px solid #f0eaec; padding: 0 0 1rem; }
        }

        .mr-overview-total-num {
          display: block;
          font-size: 2.2rem;
          font-weight: 900;
          color: #6B2C3E;
          line-height: 1;
        }

        .mr-overview-total-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 0.35rem;
        }

        .mr-overview-bar-wrap { flex: 1; min-width: 0; }

        .mr-overview-bar {
          display: flex;
          width: 100%;
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: #f3f4f6;
          margin-bottom: 0.85rem;
        }

        .mr-seg { height: 100%; transition: width 0.4s ease; }
        .mr-seg.pending { background: #f59e0b; }
        .mr-seg.progress { background: #3b82f6; }
        .mr-seg.resolved { background: #22c55e; }
        .mr-seg.other { background: #ef4444; }

        .mr-overview-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 1.1rem;
          font-size: 0.8rem;
          color: #4b5563;
          font-weight: 600;
        }

        .mr-overview-legend .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 0.4rem;
        }
        .dot.pending { background: #f59e0b; }
        .dot.progress { background: #3b82f6; }
        .dot.resolved { background: #22c55e; }
        .dot.other { background: #ef4444; }

        /* ── Toolbar: underline tabs instead of pill buttons ── */
        .mr-toolbar { margin-bottom: 1.5rem; }

        .mr-tabs {
          display: flex;
          gap: 1.5rem;
          border-bottom: 2px solid #eee2e5;
          overflow-x: auto;
        }

        .mr-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          padding: 0 0.15rem 0.7rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #9ca3af;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s, border-color 0.2s;
        }

        .mr-tab:hover { color: #6B2C3E; }

        .mr-tab.active {
          color: #6B2C3E;
          border-bottom-color: #6B2C3E;
        }

        .mr-tab .count {
          background: #f3f4f6;
          color: #6b7280;
          font-size: 0.7rem;
          padding: 1px 7px;
          border-radius: 999px;
        }

        .mr-tab.active .count { background: #fbe4e9; color: #6B2C3E; }

        .mr-toolbar-row2 {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .mr-search {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .mr-search i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .mr-search input {
          width: 100%;
          padding: 0.6rem 0.9rem 0.6rem 2.3rem;
          border-radius: 10px;
          border: 1px solid #e5d9dc;
          font-size: 0.88rem;
          outline: none;
          background: white;
        }

        .mr-search input:focus { border-color: #6B2C3E; }

        .mr-sort {
          padding: 0.6rem 0.9rem;
          border-radius: 10px;
          border: 1px solid #e5d9dc;
          font-size: 0.85rem;
          background: white;
          color: #374151;
          cursor: pointer;
          outline: none;
        }

        .mr-refresh-btn {
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

        .mr-refresh-btn:hover { background: #6B2C3E; color: white; }

        .mr-result-count { font-size: 0.8rem; color: #9ca3af; margin: -0.6rem 0 1rem; }

        .myreports-state-message {
          max-width: 900px;
          margin: 2.5rem auto;
          text-align: center;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .myreports-empty { max-width: 460px; margin: 3rem auto; text-align: center; }

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

        .myreports-empty-icon.error { background: #fee2e2; color: #991b1b; }

        .myreports-empty-title {
          color: #374151;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 1rem;
        }

        .myreports-retry-btn, .myreports-clear-search {
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

        .myreports-retry-btn:hover, .myreports-clear-search:hover {
          background: #6B2C3E;
          color: white;
        }

        /* ── Cards ── */
        .mr-list { display: flex; flex-direction: column; gap: 1rem; }

        .mr-card {
          background: white;
          border-radius: 16px;
          border-left: 4px solid transparent;
          padding: 1.25rem 1.4rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .mr-card-top { display: flex; align-items: flex-start; gap: 0.85rem; }

        .mr-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          flex-shrink: 0;
        }

        .mr-card-heading { flex: 1; min-width: 0; }

        .mr-card-type {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0 0 0.15rem;
        }

        .mr-card-title {
          font-size: 1.02rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .mr-status-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 11px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Progress stepper */
        .mr-stepper {
          display: flex;
          align-items: center;
          margin: 0.9rem 0 0.7rem;
          padding-left: 3.2rem;
        }

        @media (max-width: 480px) { .mr-stepper { padding-left: 0; } }

        .mr-stepper-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }

        .mr-stepper-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #e5e7eb;
          border: 2px solid #e5e7eb;
          display: block;
          transition: all 0.2s;
        }

        .mr-stepper-step.done .mr-stepper-dot { background: var(--mr-accent, #6B2C3E); border-color: var(--mr-accent, #6B2C3E); }
        .mr-stepper-step.current .mr-stepper-dot { transform: scale(1.35); }

        .mr-stepper-label {
          font-size: 0.66rem;
          font-weight: 600;
          color: #9ca3af;
          white-space: nowrap;
        }

        .mr-stepper-step.done .mr-stepper-label { color: #374151; }

        .mr-stepper-line {
          flex: 1;
          height: 2px;
          background: #e5e7eb;
          margin: 0 4px 1.1rem;
          transition: background 0.2s;
        }

        .mr-stepper-line.done { background: var(--mr-accent, #6B2C3E); }

        .mr-terminal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #991b1b;
          background: #fee2e2;
          padding: 4px 12px;
          border-radius: 999px;
          margin: 0.9rem 0 0.7rem;
        }

        .mr-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 1rem;
          font-size: 0.79rem;
          color: #9ca3af;
        }

        .mr-card-meta span { display: flex; align-items: center; gap: 0.3rem; }

        .mr-ref-chip {
          cursor: pointer;
          border: 1px dashed #d1d5db;
          border-radius: 999px;
          padding: 2px 10px;
          transition: border-color 0.2s;
        }

        .mr-ref-chip:hover { border-color: #6B2C3E; color: #6B2C3E; }

        .mr-onbehalf {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: #6B2C3E;
          background: rgba(107, 44, 62, 0.06);
          border-radius: 8px;
          padding: 0.35rem 0.6rem;
          margin-top: 0.6rem;
        }

        .mr-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; }

        .mr-mini-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
        }

        .mr-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.9rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f5f0f1;
          flex-wrap: wrap;
        }

        .mr-toggle-btn {
          border: none;
          background: none;
          color: #6B2C3E;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0;
        }

        .mr-actions { display: flex; gap: 8px; }

        .mr-edit-btn, .mr-delete-btn {
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          transition: 0.2s;
        }

        .mr-edit-btn { background: #2563eb; color: white; }
        .mr-edit-btn:hover { background: #1d4ed8; }
        .mr-delete-btn { background: #dc2626; color: white; }
        .mr-delete-btn:hover { background: #b91c1c; }

        .mr-details {
          margin-top: 0.9rem;
          padding-top: 0.9rem;
          border-top: 1px solid #f5f0f1;
        }

        .mr-details-desc {
          font-size: 0.88rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 0.9rem;
        }

        .mr-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.7rem 1.25rem;
        }

        @media (max-width: 480px) { .mr-detail-grid { grid-template-columns: 1fr; } }

        .mr-detail-item { display: flex; flex-direction: column; gap: 0.15rem; }

        .mr-detail-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: #9ca3af;
        }

        .mr-detail-value { font-size: 0.85rem; color: #374151; }

        .mr-detail-value a { color: #6B2C3E; font-weight: 600; text-decoration: none; }
        .mr-detail-value a:hover { text-decoration: underline; }

        .mr-media-preview {
          grid-column: 1 / -1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          max-width: 320px;
        }

        .mr-media-preview img, .mr-media-preview video {
          display: block;
          width: 100%;
          max-height: 200px;
          object-fit: cover;
        }

        .skeleton-card {
          background: white;
          border-radius: 16px;
          padding: 1.25rem 1.4rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 1rem;
        }

        .skeleton-circle {
          width: 42px;
          height: 42px;
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

        .spin { animation: myreports-spin 0.8s linear infinite; }

        @keyframes myreports-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="myreports-header">
        <div className="myreports-header-icon">
          <i className="bi bi-file-earmark-text-fill"></i>
        </div>
        <div>
          <h2>{t('myReports.title')}</h2>
          <p className="myreports-header-sub">{t('myReports.subtitle')}</p>
        </div>
      </div>

      <div className="myreports-body">
        <div className="mr-wrap">

          {!loading && !error && reports.length > 0 && (
            <div className="mr-overview">
              <div className="mr-overview-total">
                <span className="mr-overview-total-num">{stats.total}</span>
                <span className="mr-overview-total-label">{t('myReports.totalReports')}</span>
              </div>
              <div className="mr-overview-bar-wrap">
                <div className="mr-overview-bar">
                  {stats.pending > 0 && <div className="mr-seg pending" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />}
                  {stats.inProgress > 0 && <div className="mr-seg progress" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />}
                  {stats.resolved > 0 && <div className="mr-seg resolved" style={{ width: `${(stats.resolved / stats.total) * 100}%` }} />}
                  {stats.other > 0 && <div className="mr-seg other" style={{ width: `${(stats.other / stats.total) * 100}%` }} />}
                </div>
                <div className="mr-overview-legend">
                  <span><i className="dot pending"></i>{t('myReports.status.pending')} ({stats.pending})</span>
                  <span><i className="dot progress"></i>{t('myReports.status.inProgress')} ({stats.inProgress})</span>
                  <span><i className="dot resolved"></i>{t('myReports.status.resolved')} ({stats.resolved})</span>
                  {stats.other > 0 && <span><i className="dot other"></i>{t('myReports.other')} ({stats.other})</span>}
                </div>
              </div>
            </div>
          )}

          <div className="mr-toolbar">
            <div className="mr-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`mr-tab ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {t(`myReports.filters.${FILTER_LABEL_KEYS[f]}`)}
                  {counts[f] > 0 && <span className="count">{counts[f]}</span>}
                </button>
              ))}
            </div>

            {reports.length > 0 && (
              <div className="mr-toolbar-row2">
                <div className="mr-search">
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    placeholder={t('myReports.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select className="mr-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">{t('myReports.newestFirst')}</option>
                  <option value="oldest">{t('myReports.oldestFirst')}</option>
                </select>
                <button className="mr-refresh-btn" onClick={loadReports} disabled={loading} aria-label="Refresh reports" title="Refresh">
                  <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                </button>
              </div>
            )}
          </div>

          {!loading && !error && reports.length > 0 && isSearchOrFilterActive && (
            <p className="mr-result-count">
              {reports.length === 1
                ? t('myReports.showingCountSingular', { shown: filteredReports.length, total: reports.length })
                : t('myReports.showingCountPlural', { shown: filteredReports.length, total: reports.length })}
            </p>
          )}

          {loading && (
            <div className="mr-list">
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
              <button className="myreports-retry-btn" onClick={loadReports}>{t('myReports.tryAgain')}</button>
            </div>
          )}

          {!loading && !error && filteredReports.length === 0 && (
            <div className="myreports-empty">
              <div className="myreports-empty-icon"><i className="bi bi-inbox"></i></div>
              <p className="myreports-empty-title">
                {searchQuery.trim()
                  ? t('myReports.noSearchMatch')
                  : activeFilter === 'All'
                    ? t('myReports.emptyAll')
                    : t('myReports.emptyFiltered', { type: typeLabel(activeFilter, t) })}
              </p>
              {(searchQuery.trim() || activeFilter !== 'All') && (
                <button
                  className="myreports-clear-search"
                  onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                >
                  {t('myReports.clearFilters')}
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredReports.length > 0 && (
            <div className="mr-list">
              {filteredReports.map((r) => {
                const key = `${r.type}-${r.id}`;
                const statusStyle = getStatusStyle(r.status);
                const theme = getTypeTheme(r.type);
                const stageIdx = getStageIndex(r.status);
                const isExpanded = !!expandedKeys[key];
                const description = r.description || '';
                const hasCoords = r.latitude != null && r.longitude != null;
                const canEditOrDelete = r.status === 'Pending' || r.status === 'Received';

                const detailItems = [];
                if (r.contact_number) detailItems.push({ label: t('myReports.detail.contactNumber'), value: r.contact_number });
                if (r.type === 'Emergency' && r.peopleAffected) detailItems.push({ label: t('myReports.detail.peopleAffected'), value: r.peopleAffected });
                if (r.type === 'Assistance' && r.number_of_people_needing_help) detailItems.push({ label: t('myReports.detail.peopleNeedingHelp'), value: r.number_of_people_needing_help });
                if (r.specialNeeds) detailItems.push({ label: t('myReports.detail.specialNeeds'), value: r.specialNeeds });
                if (r.suspectInfo) detailItems.push({ label: t('myReports.detail.suspectInfo'), value: r.suspectInfo });
                if (r.report_for === 'others' && r.victim_contact) detailItems.push({ label: t('reportForm.theirContact'), value: r.victim_contact });
                if (r.report_for === 'others' && r.victim_details) detailItems.push({ label: t('reportForm.additionalDetails'), value: r.victim_details });

                const hasMoreDetails = !!description || detailItems.length > 0 || hasCoords || !!r.photo_url;

                return (
                  <div key={key} className="mr-card" style={{ borderLeftColor: theme.accent, '--mr-accent': theme.accent }}>
                    <div className="mr-card-top">
                      <div className="mr-card-icon" style={{ background: theme.bg, color: theme.accent }}>
                        <i className={`bi ${theme.icon}`}></i>
                      </div>
                      <div className="mr-card-heading">
                        <p className="mr-card-type" style={{ color: theme.accent }}>{typeLabel(r.type, t)}</p>
                        <h3 className="mr-card-title">{r.title || t('myReports.untitledReport')}</h3>
                      </div>
                      <span className="mr-status-pill" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                        {statusLabel(r.status, t)}
                      </span>
                    </div>

                    {stageIdx >= 0 ? (
                      <div className="mr-stepper">
                        {STAGES.map((label, i) => (
                          <React.Fragment key={label}>
                            {i > 0 && <div className={`mr-stepper-line ${i <= stageIdx ? 'done' : ''}`} />}
                            <div className={`mr-stepper-step ${i <= stageIdx ? 'done' : ''} ${i === stageIdx ? 'current' : ''}`}>
                              <span className="mr-stepper-dot"></span>
                              <span className="mr-stepper-label">{t(`myReports.status.${STAGE_KEYS[i]}`)}</span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <div className="mr-terminal-badge">
                        <i className="bi bi-x-circle-fill"></i> {statusLabel(r.status, t)}
                      </div>
                    )}

                    <div className="mr-card-meta">
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
                          className="mr-ref-chip"
                          onClick={() => copyReference(key, r.report_reference)}
                          title="Click to copy"
                        >
                          <i className={`bi ${copiedKey === key ? 'bi-check2' : 'bi-hash'}`}></i>
                          {copiedKey === key ? t('myReports.copied') : r.report_reference}
                        </span>
                      )}
                    </div>

                    {r.report_for === 'others' && r.victim_name && (
                      <div className="mr-onbehalf">
                        <i className="bi bi-people-fill"></i>
                        {t('myReports.onBehalfOf')} <strong>&nbsp;{r.victim_name}</strong>
                        {r.victim_relationship ? ` (${r.victim_relationship})` : ''}
                      </div>
                    )}

                    {(r.severity || r.urgency) && (
                      <div className="mr-badges">
                        {r.type === 'Emergency' && r.severity && (
                          <span className="mr-mini-badge" style={{ background: getLevelStyle(r.severity).bg, color: getLevelStyle(r.severity).color }}>
                            {t('myReports.severity')}: {r.severity}
                          </span>
                        )}
                        {r.type === 'Assistance' && r.urgency && (
                          <span className="mr-mini-badge" style={{ background: getLevelStyle(r.urgency).bg, color: getLevelStyle(r.urgency).color }}>
                            {t('assistanceModal.urgency')}: {r.urgency}
                          </span>
                        )}
                      </div>
                    )}

                    {isExpanded && hasMoreDetails && (
                      <div className="mr-details">
                        {description && <p className="mr-details-desc">{description}</p>}
                        {(detailItems.length > 0 || hasCoords || r.photo_url) && (
                          <div className="mr-detail-grid">
                            {detailItems.map((item) => (
                              <div className="mr-detail-item" key={item.label}>
                                <span className="mr-detail-label">{item.label}</span>
                                <span className="mr-detail-value">{item.value}</span>
                              </div>
                            ))}
                            {hasCoords && (
                              <div className="mr-detail-item">
                                <span className="mr-detail-label">{t('myReports.map')}</span>
                                <span className="mr-detail-value">
                                  <a
                                    href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="bi bi-box-arrow-up-right"></i> {t('myReports.openInMaps')}
                                  </a>
                                </span>
                              </div>
                            )}
                            {r.photo_url && (
                              <div className="mr-media-preview">
                                {r.media_type === 'video' ? (
                                  <video src={r.photo_url} controls />
                                ) : (
                                  <img src={r.photo_url} alt="Attached evidence" />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mr-footer">
                      {hasMoreDetails ? (
                        <button className="mr-toggle-btn" onClick={() => toggleExpanded(key)}>
                          <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                          {isExpanded ? t('myReports.hideDetails') : t('myReports.viewDetails')}
                        </button>
                      ) : <span />}

                      {canEditOrDelete && (
                        <div className="mr-actions">
                          <button className="mr-edit-btn" onClick={() => handleEdit(r)}>
                            <i className="bi bi-pencil"></i> {t('myReports.edit')}
                          </button>
                          <button className="mr-delete-btn" onClick={() => handleDelete(r)}>
                            <i className="bi bi-trash"></i> {t('myReports.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

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
