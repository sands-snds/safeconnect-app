import React, { useState, useEffect, useCallback, useMemo } from "react";
import ListView from "../shared/ListView";
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

const AnnouncementsTable = ({ filters, setFilters, onEdit }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

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
    } catch (err) {
      alert(err.message);
    }
  };

  const truncate = (text, length = 80) => {
    if (!text) return "";

    return text.length > length
      ? text.substring(0, length) + "..."
      : text;
  };

  const CATEGORY_COLORS = {
    "Emergency Alert": { bg: "#fee2e2", color: "#b91c1c" },
    "Weather Advisory": { bg: "#dbeafe", color: "#1e40af" },
    "Evacuation": { bg: "#fef3c7", color: "#92400e" },
    "Community Event": { bg: "#ede9fe", color: "#6d28d9" },
    "Community Update": { bg: "#dcfce7", color: "#166534" },
    "Announcement": { bg: "#f3f4f6", color: "#374151" },
    "General": { bg: "#f3f4f6", color: "#374151" }
  };

  const renderRow = (announcement) => {
    const image = announcement.imageUrl || announcement.sourceImage;
    const categoryStyle = CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS["General"];

    return (
      <div
        key={announcement.id}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {image ? (
          <img
            src={image}
            alt={announcement.title}
            style={{ width: "100%", height: 170, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 170,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f3f4f6",
              color: "#9ca3af",
              fontSize: 32
            }}
          >
            <i className="bi bi-image"></i>
          </div>
        )}

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 10px",
                borderRadius: 20,
                background: categoryStyle.bg,
                color: categoryStyle.color
              }}
            >
              {announcement.category}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {announcement.date}
            </span>
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
            {announcement.title}
          </div>

          <p style={{ fontSize: 13, color: "#4b5563", margin: "0 0 10px", flex: 1 }}>
            {truncate(announcement.message)}
          </p>

          {announcement.sourceUrl && (
            <a
              href={announcement.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
              style={{ marginBottom: 10 }}
            >
              <i className="bi bi-link-45deg"></i>{" "}
              {announcement.sourceSite || "View article"}
            </a>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
            <button
              className="button button-secondary"
              style={{ flex: 1, fontSize: 12.5 }}
              onClick={() => onEdit && onEdit(announcement)}
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>

            <button
              className="button button-secondary"
              style={{ flex: 1, fontSize: 12.5 }}
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
        .source-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6B2C3E;
          text-decoration: none;
          font-size: 0.75rem;
        }

        .source-link:hover {
          text-decoration: underline;
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
          layout="cards"
          cardsContainerStyle={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
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
          page={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={processedData.length}
        />
      )}
    </>
  );
};

export default AnnouncementsTable;