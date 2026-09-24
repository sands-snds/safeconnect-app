import React from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Page numbers to show: always first/last, the current page and its
// neighbours, with "…" for gaps. e.g. 1 … 4 5 6 … 12
const getPageItems = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
};

const pageButtonStyle = (active) => ({
  minWidth: 34,
  height: 34,
  padding: '0 10px',
  borderRadius: 8,
  border: `1px solid ${active ? '#6B2C3E' : '#e5e7eb'}`,
  background: active ? '#6B2C3E' : '#fff',
  color: active ? '#fff' : '#374151',
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  cursor: active ? 'default' : 'pointer'
});

const navButtonStyle = (disabled) => ({
  ...pageButtonStyle(false),
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color: disabled ? '#d1d5db' : '#374151',
  cursor: disabled ? 'not-allowed' : 'pointer'
});

// Shared footer for every paginated admin list. The page controls only
// appear when there's more than one page; the "Showing x–y of z" summary
// and the rows-per-page picker are always there so it's clear the list is
// paginated.
const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
  style
}) => {
  if (!totalItems) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
        <span>
          Showing <strong style={{ color: '#374151' }}>{start}–{end}</strong> of{' '}
          <strong style={{ color: '#374151' }}>{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-select"
              style={{
                // Keep right padding so the number doesn't sit under
                // Bootstrap's dropdown arrow (drawn as a background image).
                padding: '4px 30px 4px 10px',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px 10px',
                fontSize: 13,
                height: 34,
                minWidth: 72,
                width: 'auto',
                borderRadius: 8
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={navButtonStyle(page <= 1)}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left" /> Prev
          </button>

          {getPageItems(page, totalPages).map(item =>
            typeof item === 'string' ? (
              <span key={item} style={{ color: '#9ca3af', padding: '0 2px' }}>…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => item !== page && onPageChange(item)}
                style={pageButtonStyle(item === page)}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={navButtonStyle(page >= totalPages)}
            aria-label="Next page"
          >
            Next <i className="bi bi-chevron-right" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
