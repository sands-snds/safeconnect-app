import React, { useState, useEffect, useCallback, useMemo } from "react";
import ListView from "../../shared/ListView";

const API_BASE = "http://localhost/safeconnect-app/backend";
const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest - Oldest" },
  { value: "oldest", label: "Oldest - Newest" },
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
      const res = await fetch(
        `${API_BASE}/announcements.php?action=list`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || "Failed to load announcements"
        );
      }

      setData(json);
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
          item.source_site,
          item.date_posted,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(searchTerm));
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date_posted).getTime() || 0;
      const dateB = new Date(b.date_posted).getTime() || 0;

      if (dateA !== dateB) {
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      }

      // Same date posted - fall back to id so ordering stays stable.
      return sortOrder === "newest" ? b.id - a.id : a.id - b.id;
    });

    return result;
  }, [data, currentFilters.search, sortOrder]);

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
      const res = await fetch(
        `${API_BASE}/announcements.php?action=delete&id=${id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || "Failed to delete announcement."
        );
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

  const renderThumbnail = (announcement) => {
    let image = "";

    if (announcement.image_path) {
    image = announcement.image_path;
    } else if (announcement.source_image) {
      image = announcement.source_image;
    }

    if (!image) {
      return (
        <div className="thumb-placeholder">
          <i className="bi bi-image"></i>
        </div>
      );
    }

    return (
      <img
        src={image}
        alt={announcement.title}
        className="thumb"
      />
    );
  };

  const renderRow = (announcement) => (
    <tr key={announcement.id}>
      <td className="table-cell">
        {renderThumbnail(announcement)}
      </td>

      <td className="table-cell">
        <div
          className="font-medium text-sm"
          style={{ fontWeight: 600 }}
        >
          {announcement.title}
        </div>

        {announcement.source_url && (
          <a
            href={announcement.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            <i className="bi bi-link-45deg"></i>{" "}
            {announcement.source_site || "View article"}
          </a>
        )}
      </td>

      <td className="table-cell text-sm">
        {announcement.category}
      </td>

      <td className="table-cell text-sm">
        {truncate(announcement.message)}
      </td>

      <td className="table-cell text-sm">
        {announcement.date_posted}
      </td>

      <td className="table-cell">
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="button button-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
            }}
            onClick={() =>
              onEdit && onEdit(announcement)
            }
          >
            Edit
          </button>

          <button
            className="button button-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
            }}
            onClick={() =>
              handleDelete(announcement.id)
            }
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <style>{`
        .thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .thumb-placeholder {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #9ca3af;
          border-radius: 6px;
          font-size: 1.2rem;
        }

        .source-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
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
          title="ANNOUNCEMENTS"
          data={pagedData}
          filterType="announcements"
          filters={filters}
          setFilters={setFilters}
          headers={[
            "PHOTO",
            "TITLE",
            "CATEGORY",
            "MESSAGE",
            "DATE",
            "ACTIONS",
          ]}
          renderRow={renderRow}
          statusOptions={["All Items"]}
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