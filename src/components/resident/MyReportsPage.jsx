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

// Matches the look of the report categories used elsewhere in the app.
const TYPE_ICON = {
  Emergency: 'bi-exclamation-triangle-fill',
  Assistance: 'bi-life-preserver',
  'Petty Crime': 'bi-shield-exclamation'
};

const STATUS_STYLE = {
  Received: { bg: '#fef3c7', color: '#92400e' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  'In Progress': { bg: '#dbeafe', color: '#1e40af' },
  Resolved: { bg: '#dcfce7', color: '#166534' },
  Completed: { bg: '#dcfce7', color: '#166534' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' }
};

const getStatusStyle = (status) => STATUS_STYLE[status] || { bg: '#f3f4f6', color: '#374151' };

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const FILTERS = ['All', 'Emergency', 'Assistance', 'Petty Crime'];

function MyReportsPage({ isOpen, onClose, userId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
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
      setReports(data);
    } catch (err) {
      setError('Could not load your reports right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (activeFilter === 'All') return reports;
    return reports.filter((r) => r.type === activeFilter);
  }, [reports, activeFilter]);

  const counts = useMemo(() => {
    const c = { All: reports.length, Emergency: 0, Assistance: 0, 'Petty Crime': 0 };
    reports.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }, [reports]);

  
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
        }

        .myreports-close-btn:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .myreports-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) 4rem;
        }

        .myreports-filters {
          max-width: 900px;
          margin: 0 auto 1.75rem;
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
        }

        .myreports-filter-btn:hover {
          border-color: #6B2C3E;
        }

        .myreports-filter-btn.active {
          background: #6B2C3E;
          border-color: #6B2C3E;
          color: white;
        }

        .myreports-state-message {
          max-width: 900px;
          margin: 2.5rem auto;
          text-align: center;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .myreports-list {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .myreports-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          display: flex;
          gap: 1rem;
        }

        .myreports-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(107, 44, 62, 0.1);
          color: #6B2C3E;
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
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #9ca3af;
          margin: 0 0 0.35rem;
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
          margin: 0.35rem 0 0.6rem;
        }

        .myreports-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem 1rem;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .myreports-card-meta span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
          .myreports-actions{
            margin-top:15px;
            display:flex;
            gap:10px;
        }

        .edit-btn,
        .delete-btn{
            border:none;
            padding:8px 16px;
            border-radius:8px;
            cursor:pointer;
            font-weight:600;
            transition:.2s;
        }

        .edit-btn{
            background:#2563eb;
            color:white;
        }

        .edit-btn:hover{
            background:#1d4ed8;
        }

        .delete-btn{
            background:#dc2626;
            color:white;
        }

        .delete-btn:hover{
            background:#b91c1c;
        }
      `}</style>

      <div className="myreports-header">
        <h2><i className="bi bi-file-earmark-text-fill"></i> My Reports</h2>
        <button className="myreports-close-btn" onClick={onClose} aria-label="Close my reports">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="myreports-body">
        <div className="myreports-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`myreports-filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f} {counts[f] ? `(${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading && (
          <div className="myreports-state-message">Loading your reports...</div>
        )}
        {!loading && error && (
          <div className="myreports-state-message">{error}</div>
        )}
        {!loading && !error && filteredReports.length === 0 && (
          <div className="myreports-state-message">
            {activeFilter === 'All'
              ? "You haven't submitted any reports yet."
              : `You haven't submitted any ${activeFilter} reports yet.`}
          </div>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="myreports-list">
            {filteredReports.map((r) => {
              const style = getStatusStyle(r.status);
              const handleEdit = (report) => {

                  setEditingReport(report);

                  if (report.type === "Emergency") {
                      setShowEmergencyModal(true);
                  }

                  if (report.type === "Assistance") {
                      setShowAssistanceModal(true);
                  }

                  if (report.type === "Petty Crime") {
                      setShowCrimeModal(true);
                  }
              };

              const handleDelete = async (report) => {
              if (!window.confirm("Delete this report?")) return;

              let result;

              if (report.type === "Emergency") {
                  result = await deleteEmergencyReport(report.id);
              } else if (report.type === "Assistance") {
                  result = await deleteAssistanceRequest(report.id);
              } else if (report.type === "Petty Crime") {
                  result = await deletePettyCrimeReport(report.id);
              }

              console.log(result);

              if (result?.success) {
                  await loadReports();
              } else {
                  alert("Failed to delete report.");
              }
          };
              return (
                <div key={`${r.type}-${r.id}`} className="myreports-card">
                  <div className="myreports-card-icon">
                    <i className={`bi ${TYPE_ICON[r.type] || 'bi-file-earmark-text-fill'}`}></i>
                  </div>
                  <div className="myreports-card-main">
                    <p className="myreports-card-type">{r.type}</p>
                    <div className="myreports-card-top">
                      <h3 className="myreports-card-title">{r.title}</h3>
                      <span
                        className="myreports-status-pill"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.description && <p className="myreports-card-desc">{r.description}</p>}
                    <div className="myreports-card-meta">
                    {r.date && (
                      <span><i className="bi bi-clock"></i> {formatDate(r.date)}</span>
                    )}

                    {r.location && (
                      <span><i className="bi bi-geo-alt"></i> {r.location}</span>
                    )}
                  </div>

                  {(r.status === "Pending" || r.status === "Received") && (
                    <div className="myreports-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(r)}
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(r)}
                      >
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