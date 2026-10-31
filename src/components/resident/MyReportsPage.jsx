import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchMyReports,
  deleteEmergencyReport,
  deleteAssistanceRequest,
  deletePettyCrimeReport
} from '../../Services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { flashHighlight } from '../shared/highlight';
import { showPopup, confirmPopup } from '../shared/popup';
import ResidentEmergencyModal from "./ResidentEmergencyModal";
import ResidentAssistanceModal from "./ResidentAssistanceModal";
import ResidentPettyCrimeModal from "./ResidentPettyCrimeModal";

const TYPE_LABEL_KEYS = { Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };
const typeLabel = (type, t) => (TYPE_LABEL_KEYS[type] ? t(`myReports.types.${TYPE_LABEL_KEYS[type]}`) : type);

const STATUS_LABEL_KEYS = {
  Received: 'received', Pending: 'pending', 'In Progress': 'inProgress',
  Resolved: 'resolved', Completed: 'completed', Dismissed: 'dismissed', Rejected: 'dismissed', Cancelled: 'cancelled'
};
const statusLabel = (status, t) => (STATUS_LABEL_KEYS[status] ? t(`myReports.status.${STATUS_LABEL_KEYS[status]}`) : status);

const STAGE_KEYS = ['received', 'inProgress', 'resolved'];

// Status filter choices (Pending counts as Received, Completed as Resolved,
// Cancelled as Dismissed).
const STATUS_FILTERS = ['Received', 'In Progress', 'Resolved', 'Dismissed'];

// The short message under each report's details, by status (Dismissed also
// shows the reason the barangay gave).
const STATUS_MESSAGES = {
  Received: { key: 'received', icon: 'bi-inbox-fill' },
  Pending: { key: 'received', icon: 'bi-inbox-fill' },
  'In Progress': { key: 'inProgress', icon: 'bi-truck' },
  Resolved: { key: 'resolved', icon: 'bi-patch-check-fill' },
  Completed: { key: 'resolved', icon: 'bi-patch-check-fill' },
  Dismissed: { key: 'dismissed', icon: 'bi-x-circle-fill' }
};

const PAGE_SIZE = 5;

// Page numbers with gaps, e.g. 1 … 4 5 6 … 12.
const pageItems = (page, count) => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const items = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) items.push('gap-start');
  for (let p = from; p <= to; p += 1) items.push(p);
  if (to < count - 1) items.push('gap-end');
  items.push(count);
  return items;
};

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
  Dismissed: { bg: '#fee2e2', color: '#991b1b' },
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

// Reports move Received/Pending -> In Progress -> Resolved/Completed. Dismissed
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

// focusReport: { type, id, nonce } from a notification -- that report is
// shown (filters cleared, right page, details open) and highlighted.
// liveVersion: goes up when the barangay changes one of this resident's
// report statuses (live update), so an open page reloads in place.
function MyReportsPage({ isOpen, onClose, userId, focusReport, liveVersion = 0 }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const listTopRef = useRef(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [expandedKeys, setExpandedKeys] = useState({});
  const [editingReport, setEditingReport] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showCrimeModal, setShowCrimeModal] = useState(false);
  // Card whose three-dot (Edit / Delete) menu is open, by report key.
  const [openMenuKey, setOpenMenuKey] = useState(null);

  useEffect(() => {
    if (!openMenuKey) return undefined;
    const onPointerDown = (e) => {
      if (!e.target.closest(`[data-menu-key="${openMenuKey}"]`)) setOpenMenuKey(null);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      document.querySelector(`[data-menu-key="${openMenuKey}"] .mr-menu-btn`)?.focus();
      setOpenMenuKey(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenuKey]);

  useEffect(() => {
    if (!isOpen) setOpenMenuKey(null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const lastLoadedAt = useRef(0);
  const handledFocus = useRef(null);
  const skipPageReset = useRef(false);
  const [highlightKey, setHighlightKey] = useState(null);

  const loadSeq = useRef(0);

  // quiet: a live update -- swap in the new list without the loading
  // spinner (keeping the tab, filters, page and open cards), and keep the
  // current list if it fails. Only the latest load's answer is used.
  const loadReports = async ({ quiet = false } = {}) => {
    if (!userId) {
      setError(t('myReports.noAccount'));
      setLoading(false);
      return;
    }
    const seq = ++loadSeq.current;
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await fetchMyReports(userId);
      if (seq !== loadSeq.current) return;
      setReports(Array.isArray(data) ? data : []);
      if (quiet) setError('');
    } catch (err) {
      if (seq === loadSeq.current && !quiet) setError(t('myReports.loadError'));
    } finally {
      if (seq === loadSeq.current) {
        lastLoadedAt.current = Date.now();
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && liveVersion) loadReports({ quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveVersion]);

  const counts = useMemo(() => {
    const c = { All: reports.length, Emergency: 0, Assistance: 0, 'Petty Crime': 0 };
    reports.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }, [reports]);


  const filteredReports = useMemo(() => {
    let list = activeFilter === 'All' ? reports : reports.filter((r) => r.type === activeFilter);

    if (statusFilter !== 'all') {
      const stage = getStageIndex(statusFilter);
      list = list.filter((r) => getStageIndex(r.status) === stage);
    }

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
  }, [reports, activeFilter, statusFilter, searchQuery, sortOrder]);

  // Pages of PAGE_SIZE; back to page 1 whenever the filters change.
  const pageCount = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  useEffect(() => {
    // Opening a report from a notification picks its page itself.
    if (skipPageReset.current) { skipPageReset.current = false; return; }
    setPage(1);
  }, [activeFilter, statusFilter, searchQuery, sortOrder]);

  useEffect(() => {
    if (!isOpen || !focusReport || handledFocus.current === focusReport.nonce || loading) return;
    const key = `${focusReport.type}-${focusReport.id}`;
    // Same order as the list with no filters: newest first.
    const ordered = [...reports].sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    const index = ordered.findIndex((r) => `${r.type}-${r.id}` === key);
    if (index === -1) {
      // Maybe this list is from before the report existed: wait for a fresh load.
      if (lastLoadedAt.current > focusReport.nonce) handledFocus.current = focusReport.nonce;
      return;
    }
    handledFocus.current = focusReport.nonce;
    const filtersChange = activeFilter !== 'All' || statusFilter !== 'all' || searchQuery !== '' || sortOrder !== 'newest';
    skipPageReset.current = filtersChange;
    setActiveFilter('All');
    setStatusFilter('all');
    setSearchQuery('');
    setSortOrder('newest');
    setPage(Math.floor(index / PAGE_SIZE) + 1);
    setExpandedKeys((prev) => ({ ...prev, [key]: true }));
    setHighlightKey(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, focusReport, reports, loading]);

  useEffect(() => {
    if (!highlightKey) return undefined;
    // After the page change and the panel's slide-in.
    const timer = setTimeout(() => {
      flashHighlight(document.querySelector(`[data-report-key="${highlightKey}"]`));
      setHighlightKey(null);
    }, 350);
    return () => clearTimeout(timer);
  }, [highlightKey, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const pagedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToPage = (p) => {
    setPage(p);
    if (listTopRef.current) listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const confirmed = await confirmPopup({
      type: 'danger',
      title: t('myReports.deleteTitle'),
      message: t('myReports.deleteBody', { type: typeLabel(report.type, t).toLowerCase(), title: report.title }),
      confirmLabel: t('myReports.delete')
    });
    if (!confirmed) return;

    let result;
    try {
      if (report.type === 'Emergency') {
        result = await deleteEmergencyReport(report.id);
      } else if (report.type === 'Assistance') {
        result = await deleteAssistanceRequest(report.id);
      } else if (report.type === 'Petty Crime') {
        result = await deletePettyCrimeReport(report.id);
      }
    } catch {
      result = null;
    }

    if (result?.success) {
      await loadReports();
      showPopup({ type: 'success', title: t('myReports.deletedTitle'), message: t('myReports.deletedBody') });
    } else {
      showPopup({ type: 'error', message: t('myReports.deleteFailed') });
    }
  };

  const isSearchOrFilterActive = activeFilter !== 'All' || statusFilter !== 'all' || searchQuery.trim().length > 0;

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
          color: #fff;
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

        /* ── Toolbar: underline tabs instead of pill buttons ── */
        .mr-toolbar { margin-bottom: 1.5rem; }

        /* No scrolling: the tabs fit (tighter on phones) and wrap only on very
           narrow screens. (overflow-x: auto plus the tabs' -2px underline
           overlap used to show a scrollbar.) */
        .mr-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 1.5rem;
          border-bottom: 2px solid #eee2e5;
        }

        .mr-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          padding: 0 0.15rem 0.7rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #4b5563;
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

        /* Phones: all four tabs on one row (after the rules above so it wins). */
        @media (max-width: 576px) {
          .mr-tabs { justify-content: space-between; column-gap: 0.35rem; }
          .mr-tab { font-size: 0.76rem; gap: 0.25rem; padding: 0 0 0.6rem; }
          .mr-tab .count { font-size: 0.62rem; padding: 0 5px; }
        }

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
          color: #6b7280;
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

        /* Sort / status dropdowns: their own chevron, well away from the edge. */
        .mr-sort {
          -webkit-appearance: none;
          appearance: none;
          padding: 0.6rem 2.4rem 0.6rem 0.9rem;
          border-radius: 10px;
          border: 1px solid #e5d9dc;
          font-size: 0.85rem;
          background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%236B2C3E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M3 6l5 5 5-5'/%3E%3C/svg%3E") no-repeat right 0.9rem center / 12px;
          color: #374151;
          cursor: pointer;
          outline: none;
        }

        .mr-sort:focus { border-color: #6B2C3E; }

        @media (max-width: 576px) {
          .mr-search { flex-basis: 100%; min-width: 0; }
          .mr-sort { flex: 1; min-width: 0; }
        }

        /* Pagination */
        .mr-pagination { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem 1rem; flex-wrap: wrap; margin-top: 1.5rem; }
        .mr-page-range { font-size: 0.82rem; color: #4b5563; }
        .mr-pages { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .mr-page-btn { min-width: 38px; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #e5d9dc; background: #fff; color: #374151; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .mr-page-btn:hover:not(:disabled) { border-color: #6B2C3E; color: #6B2C3E; }
        .mr-page-btn.active { background: #6B2C3E; border-color: #6B2C3E; color: #fff; }
        .mr-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .mr-page-btn:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 2px; }
        .mr-page-gap { padding: 0 4px; color: #9ca3af; }
        @media (max-width: 576px) {
          .mr-pagination { justify-content: center; }
          .mr-page-range { width: 100%; text-align: center; }
          .mr-page-btn .mr-page-word { display: none; }
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

        .mr-result-count { font-size: 0.8rem; color: #4b5563; margin: -0.6rem 0 1rem; }

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
          color: #6b7280;
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

        /* Status message under the meta row (In Progress: "Help is on the way..."). */
        .mr-status-msg {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          margin: 0.8rem 0 0.2rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          font-size: 0.86rem;
          line-height: 1.45;
        }

        .mr-status-msg i { font-size: 1rem; margin-top: 0.05rem; }
        .mr-status-msg p { margin: 0; font-weight: 600; }
        .mr-status-msg .mr-status-reason { margin-top: 0.3rem; font-weight: 400; }

        .mr-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 1rem;
          font-size: 0.79rem;
          color: #4b5563;
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

        /* Three-dot menu (Edit / Delete). Opens upward so the last card's
           menu isn't cut off at the bottom of the list. */
        .mr-menu-wrap { position: relative; }

        .mr-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #4b5563;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .mr-menu-btn:hover, .mr-menu-btn[aria-expanded="true"] { background: #f3eef0; color: #6B2C3E; }
        .mr-menu-btn:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 2px; }

        .mr-menu {
          position: absolute;
          right: 0;
          bottom: calc(100% + 6px);
          min-width: 160px;
          background: #fff;
          border: 1px solid #f0eaec;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
          padding: 6px;
          z-index: 20;
          animation: mr-menu-in 0.12s ease-out;
        }

        @keyframes mr-menu-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }

        .mr-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          border: none;
          background: none;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 600;
          color: #374151;
          text-align: left;
          cursor: pointer;
        }

        .mr-menu-item:hover, .mr-menu-item:focus-visible { background: #f7f3f4; outline: none; }
        .mr-menu-item.danger { color: #dc2626; }
        .mr-menu-item.danger:hover, .mr-menu-item.danger:focus-visible { background: #fef2f2; }

        .mr-details {
          margin-top: 0.9rem;
          padding-top: 0.9rem;
          border-top: 1px solid #f5f0f1;
        }

        .mr-details-desc {
          font-size: 0.88rem;
          color: #374151;
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
          color: #4b5563;
        }

        .mr-detail-value { font-size: 0.85rem; color: #1f2937; }

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
                <select className="mr-sort" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t('myReports.statusFilterLabel')}>
                  <option value="all">{t('myReports.allStatuses')}</option>
                  {STATUS_FILTERS.map((st) => (
                    <option key={st} value={st}>{statusLabel(st, t)}</option>
                  ))}
                </select>
                <select className="mr-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label={t('myReports.sortLabel')}>
                  <option value="newest">{t('myReports.newestFirst')}</option>
                  <option value="oldest">{t('myReports.oldestFirst')}</option>
                </select>
                <button className="mr-refresh-btn" onClick={() => loadReports()} disabled={loading} aria-label="Refresh reports" title="Refresh">
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
              <button className="myreports-retry-btn" onClick={() => loadReports()}>{t('myReports.tryAgain')}</button>
            </div>
          )}

          {!loading && !error && filteredReports.length === 0 && (
            <div className="myreports-empty">
              <div className="myreports-empty-icon"><i className="bi bi-inbox"></i></div>
              <p className="myreports-empty-title">
                {searchQuery.trim()
                  ? t('myReports.noSearchMatch')
                  : statusFilter !== 'all'
                    ? t('myReports.noFilterMatch')
                  : activeFilter === 'All'
                    ? t('myReports.emptyAll')
                    : t('myReports.emptyFiltered', { type: typeLabel(activeFilter, t) })}
              </p>
              {(searchQuery.trim() || activeFilter !== 'All' || statusFilter !== 'all') && (
                <button
                  className="myreports-clear-search"
                  onClick={() => { setSearchQuery(''); setActiveFilter('All'); setStatusFilter('all'); }}
                >
                  {t('myReports.clearFilters')}
                </button>
              )}
            </div>
          )}

          <div ref={listTopRef} style={{ scrollMarginTop: '1rem' }} />
          {!loading && !error && filteredReports.length > 0 && (
            <div className="mr-list">
              {pagedReports.map((r) => {
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
                  <div key={key} data-report-key={key} className="mr-card" style={{ borderLeftColor: theme.accent, '--mr-accent': theme.accent }}>
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

                    {STATUS_MESSAGES[r.status] && (
                      <div className="mr-status-msg" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        <i className={`bi ${STATUS_MESSAGES[r.status].icon}`} aria-hidden="true"></i>
                        <div>
                          <p>{t(`myReports.statusMessage.${STATUS_MESSAGES[r.status].key}`)}</p>
                          {r.status === 'Dismissed' && r.dismissal_reason && (
                            <p className="mr-status-reason">
                              <strong>{t('myReports.statusMessage.reason')}</strong> {r.dismissal_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {r.report_for === 'others' && r.victim_name && (
                      <div className="mr-onbehalf">
                        <i className="bi bi-people-fill"></i>
                        {t('myReports.onBehalfOf')} <strong>&nbsp;{r.victim_name}</strong>
                        {r.victim_relationship ? ` (${r.victim_relationship})` : ''}
                      </div>
                    )}

                    {r.type === 'Assistance' && r.urgency && (
                      <div className="mr-badges">
                        <span className="mr-mini-badge" style={{ background: getLevelStyle(r.urgency).bg, color: getLevelStyle(r.urgency).color }}>
                          {t('assistanceModal.urgency')}: {r.urgency}
                        </span>
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
                        <div className="mr-menu-wrap" data-menu-key={key}>
                          <button
                            type="button"
                            className="mr-menu-btn"
                            aria-label={t('myReports.moreOptions')}
                            aria-haspopup="menu"
                            aria-expanded={openMenuKey === key}
                            onClick={() => setOpenMenuKey((open) => (open === key ? null : key))}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {openMenuKey === key && (
                            <div className="mr-menu" role="menu" aria-label={t('myReports.moreOptions')}>
                              <button
                                type="button"
                                role="menuitem"
                                className="mr-menu-item"
                                autoFocus
                                onClick={() => { setOpenMenuKey(null); handleEdit(r); }}
                              >
                                <i className="bi bi-pencil"></i> {t('myReports.edit')}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="mr-menu-item danger"
                                onClick={() => { setOpenMenuKey(null); handleDelete(r); }}
                              >
                                <i className="bi bi-trash"></i> {t('myReports.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredReports.length > PAGE_SIZE && (
            <nav className="mr-pagination" aria-label={t('myReports.paginationLabel')}>
              <span className="mr-page-range">
                {t('myReports.pageRange', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, filteredReports.length),
                  total: filteredReports.length
                })}
              </span>
              <div className="mr-pages">
                <button type="button" className="mr-page-btn" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label={t('myReports.prevPage')}>
                  <i className="bi bi-chevron-left" aria-hidden="true" /> <span className="mr-page-word">{t('myReports.prevPage')}</span>
                </button>
                {pageItems(page, pageCount).map((p) => (typeof p === 'number' ? (
                  <button
                    key={p}
                    type="button"
                    className={`mr-page-btn ${p === page ? 'active' : ''}`}
                    aria-current={p === page ? 'page' : undefined}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={p} className="mr-page-gap" aria-hidden="true">…</span>
                )))}
                <button type="button" className="mr-page-btn" onClick={() => goToPage(page + 1)} disabled={page === pageCount} aria-label={t('myReports.nextPage')}>
                  <span className="mr-page-word">{t('myReports.nextPage')}</span> <i className="bi bi-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}

        </div>

        {/* Rendered into <body>: .myreports-fullscreen has a transform (its
            slide-in), which makes it the containing block for position:fixed
            children -- the edit modals were laid out inside it, pushed down
            by the navbar's height (their Save button off-screen) and stacked
            under the navbar. */}
        {createPortal(
        <>
        <ResidentEmergencyModal
          show={showEmergencyModal}
          editingReport={editingReport}
          onClose={() => {
            setShowEmergencyModal(false);
            setEditingReport(null);
          }}
          onUpdated={() => loadReports()}
        />

        <ResidentAssistanceModal
          show={showAssistanceModal}
          editingReport={editingReport}
          onClose={() => {
            setShowAssistanceModal(false);
            setEditingReport(null);
          }}
          onUpdated={() => loadReports()}
        />

        <ResidentPettyCrimeModal
          show={showCrimeModal}
          editingReport={editingReport}
          onClose={() => {
            setShowCrimeModal(false);
            setEditingReport(null);
          }}
          onUpdated={() => loadReports()}
        />
        </>,
        document.body
        )}
      </div>
    </div>
  );
}

export default MyReportsPage;
