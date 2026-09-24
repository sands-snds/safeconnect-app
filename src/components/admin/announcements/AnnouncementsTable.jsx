import React, { useState, useEffect, useCallback, useMemo } from "react";
import ListView from "../shared/ListView";
import AnnouncementModal from "./AnnouncementModal";
import { fetchAnnouncements, deleteAnnouncement } from "../../../Services/api";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest - Oldest" },
  { value: "oldest", label: "Oldest - Newest" },
];

const STATUS_OPTIONS = [
  "General",
  "Announcement",
  "Emergency Alert",
  "Weather Advisory",
  "Community Update",
  "Community Event",
  "Evacuation"
];

const CATEGORY_COLORS = {
  "Emergency Alert": { bg: "#fee2e2", color: "#b91c1c" },
  "Weather Advisory": { bg: "#dbeafe", color: "#1e40af" },
  "Evacuation": { bg: "#fef3c7", color: "#92400e" },
  "Community Event": { bg: "#ede9fe", color: "#6d28d9" },
  "Community Update": { bg: "#dcfce7", color: "#166534" },
  "Announcement": { bg: "rgba(107, 44, 62, 0.1)", color: "#6B2C3E" },
  "General": { bg: "rgba(107, 44, 62, 0.1)", color: "#6B2C3E" }
};

const AnnouncementsTable = ({
  filters,
  setFilters,
  // Optional: the current logged-in-once-per-app editingAnnouncement state
  // (from useAdminNavigation, threaded through AdminPage -> AnnouncementsPage)
  // doubles as "which announcement is open in the edit modal, if any".
  editingAnnouncement,
  setEditingAnnouncement,
  // Optional: lets the Dashboard's "Create Announcement" shortcut open this
  // modal directly once it has navigated here, instead of just landing on
  // the list. See useEffect below.
  pendingCreateAnnouncement,
  onConsumePendingCreateAnnouncement,
  // Optional: useAdminData's own announcements loader, kept separate from
  // this table's local `data` state (see loadAnnouncements below) so the
  // dashboard's stat counts stay in sync too after a create/edit/delete.
  refreshDashboardData
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const filterType = "announcements";
  const currentFilters = filters[filterType] || { status: "All Items", search: "" };

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAnnouncements();
      setData(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Dashboard FAB clicked -> already navigated to this tab -> open the
  // create modal, then tell the parent we've handled it so it doesn't
  // reopen every time this component happens to re-render.
  useEffect(() => {
    if (pendingCreateAnnouncement) {
      setShowCreateModal(true);
      if (onConsumePendingCreateAnnouncement) onConsumePendingCreateAnnouncement();
    }
  }, [pendingCreateAnnouncement, onConsumePendingCreateAnnouncement]);

  const isModalOpen = showCreateModal || !!editingAnnouncement;

  const closeModal = () => {
    setShowCreateModal(false);
    if (setEditingAnnouncement) setEditingAnnouncement(null);
  };

  const handleSaved = () => {
    closeModal();
    loadAnnouncements();
    if (refreshDashboardData) refreshDashboardData();
  };

  // The search box and sort dropdown live in ListView, but this table owns
  // the raw data, so filtering/sorting/pagination all happen here.
  const processedData = useMemo(() => {
    let result = [...data];

    const searchTerm = (currentFilters.search || "").trim().toLowerCase();

    if (searchTerm) {
      result = result.filter((item) => {
        return [
          item.title,
          item.message,
          item.category,
          item.sourceSite,
          item.date,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(searchTerm));
      });
    }

    // "All Items" is the placeholder/default option - treat it (and an
    // empty value) as "no filter applied".
    const statusFilter = (currentFilters.status || "").trim();

    if (statusFilter && statusFilter.toLowerCase() !== "all items") {
      result = result.filter(
        (item) =>
          (item.category || "").trim().toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;

      if (dateA !== dateB) {
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      }

      // Same date posted - fall back to id so ordering stays stable.
      return sortOrder === "newest" ? b.id - a.id : a.id - b.id;
    });

    return result;
  }, [data, currentFilters.search, currentFilters.status, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return processedData.slice(start, start + PAGE_SIZE);
  }, [processedData, safePage]);

  // Reset back to page 1 whenever the search term or sort order changes,
  // so the user isn't stranded on an empty page.
  useEffect(() => {
    setCurrentPage(1);
  }, [currentFilters.search, currentFilters.status, sortOrder]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      const success = await deleteAnnouncement(id);

      if (!success) {
        throw new Error("Failed to delete announcement.");
      }

      setData((prev) =>
        prev.filter(
          (announcement) => announcement.id !== id
        )
      );

      if (refreshDashboardData) refreshDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const truncate = (text, length = 240) => {
    if (!text) return "";

    return text.length > length
      ? text.substring(0, length) + "..."
      : text;
  };

  const renderRow = (announcement) => {
    const image = announcement.imageUrl || announcement.sourceImage;
    const categoryStyle = CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS["General"];

    return (
      <div key={announcement.id} className="announcement-admin-card">
        {image && (
          <div
            className="announcement-admin-card-media"
            style={{ backgroundImage: `url(${image})` }}
          />
        )}

        <div className="announcement-admin-card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              className="announcement-admin-card-badge"
              style={{
                background: categoryStyle.bg,
                color: categoryStyle.color
              }}
            >
              {announcement.category}
            </span>
            <span className="announcement-admin-card-date">
              {announcement.date}
            </span>
          </div>

          <h3 className="announcement-admin-card-title">
            {announcement.title}
          </h3>

          <p className="announcement-admin-card-message">
            {truncate(announcement.message)}
          </p>

          {announcement.sourceUrl && (
            <a
              href={announcement.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="announcement-admin-card-source"
            >
              <i className="bi bi-box-arrow-up-right"></i>{" "}
              {announcement.sourceSite || "View article"}
            </a>
          )}

          <div className="announcement-admin-card-actions">
            <button
              type="button"
              className="button button-secondary"
              style={{ fontSize: 12.5, padding: '8px 18px' }}
              onClick={() => setEditingAnnouncement && setEditingAnnouncement(announcement)}
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>

            <button
              type="button"
              className="button button-secondary"
              style={{ fontSize: 12.5, padding: '8px 18px' }}
              onClick={() => handleDelete(announcement.id)}
            >
              <i className="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .announcement-admin-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .announcement-admin-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.1);
        }

        .announcement-admin-card-media {
          width: 100%;
          height: clamp(220px, 38vw, 380px);
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .announcement-admin-card-body {
          padding: 22px 26px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .announcement-admin-card-badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .announcement-admin-card-date {
          font-size: 12px;
          color: #9ca3af;
        }

        .announcement-admin-card-title {
          font-size: 19px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .announcement-admin-card-message {
          font-size: 14.5px;
          color: #6b7280;
          line-height: 1.65;
          margin: 0 0 14px;
          flex: 1;
        }

        .announcement-admin-card-source {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6B2C3E;
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .announcement-admin-card-source:hover {
          text-decoration: underline;
        }

        .announcement-admin-card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid #f3f4f6;
        }
      `}</style>

      {error && (
        <div
          style={{
            color: "#dc2626",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading announcements...</div>
      ) : (
        <ListView
          data={pagedData}
          title="Announcements"
          layout="cards"
          cardsContainerStyle={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '70%',
            margin: '0 auto'
          }}
          filterType="announcements"
          filters={filters}
          setFilters={setFilters}
          renderRow={renderRow}
          statusOptions={[
            "Select Category",
            ...STATUS_OPTIONS
          ]}
          sortOptions={SORT_OPTIONS}
          sortValue={sortOrder}
          onSortChange={setSortOrder}
          onAdd={() => setShowCreateModal(true)}
          addLabel="+ New Announcement"
          page={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={processedData.length}
        />
      )}

      <AnnouncementModal
        show={isModalOpen}
        editingAnnouncement={editingAnnouncement}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </>
  );
};

export default AnnouncementsTable;