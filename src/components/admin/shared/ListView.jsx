import React, { useState, useEffect, useRef } from 'react';
import Section from './Section';
import Table from './Table';
import GenerateReportButton from './GenerateReportButton';
import Pagination from './Pagination';

const DEFAULT_PAGE_SIZE = 10;

// The filter value every tab treats as "don't filter by status".
export const ALL_OPTION = 'All Items';
export const allOption = (label) => ({ value: ALL_OPTION, label });

const ListView = ({
  title,
  data,
  filterType,
  filters,
  setFilters,
  onAdd,
  headers,
  renderRow,
  statusOptions,
  // "table" (default) renders the classic <table>. "cards" renders
  // renderRow() results in a plain stacked list instead -- used by the
  // report tables (emergency/assistance/petty crime).
  layout = 'table',
  // Only used when layout === 'cards'. Defaults to a stacked list (used by
  // the report tables); Announcements overrides this with a responsive grid.
  cardsContainerStyle = { display: 'flex', flexDirection: 'column', gap: '10px' },
  // Optional sort dropdown (Announcements).
  sortOptions,
  sortValue,
  onSortChange,
  // Pagination: by default ListView paginates `data` itself. Pass `page` +
  // `totalPages` + `onPageChange` (+ totalItems/pageSize) to control it from
  // outside instead -- Announcements does, since it sorts before paging and
  // passes in only the current page's items.
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  itemLabel,
  // Optional: pass an export type key (see exportService.js's EXPORTERS map
  // on the backend) to render a "Generate Report" PDF/Excel button in the
  // filter row. Omit to leave a page without one.
  exportType,
  exportLabel,
  // Optional override for the "+ Add New" button text.
  addLabel = '+ Add New',
  // Optional: extra filter controls rendered after the status filter
  // (e.g. the Users tab's role filter).
  extraFilters
}) => {
  const isControlled = typeof page === 'number';

  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const listTopRef = useRef(null);

  // Back to page 1 whenever the search/filters change -- but not when the
  // data itself refreshes (the 30s auto-refresh shouldn't throw you back to
  // page 1 while you're reading page 3).
  const filterKey = JSON.stringify(filters?.[filterType] || {});
  useEffect(() => {
    setInternalPage(1);
  }, [filterKey]);

  const effectivePageSize = isControlled ? (pageSize || DEFAULT_PAGE_SIZE) : internalPageSize;
  const effectiveTotalItems = isControlled ? (totalItems ?? data.length) : data.length;
  const effectiveTotalPages = isControlled
    ? (totalPages || 1)
    : Math.max(1, Math.ceil(data.length / internalPageSize));
  // Clamp in case the list shrank (e.g. a filter or refresh removed items).
  const currentPage = Math.min(isControlled ? page : internalPage, effectiveTotalPages);

  const visibleData = isControlled
    ? data
    : data.slice((currentPage - 1) * internalPageSize, currentPage * internalPageSize);

  const goToPage = (next) => {
    const clamped = Math.max(1, Math.min(effectiveTotalPages, next));
    if (isControlled) {
      onPageChange && onPageChange(clamped);
    } else {
      setInternalPage(clamped);
    }
    // Bring the top of the list back into view after switching pages.
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePageSizeChange = isControlled
    ? onPageSizeChange
    : (size) => {
        setInternalPageSize(size);
        setInternalPage(1);
      };

  return (
    <div ref={listTopRef} style={{ scrollMarginTop: 96 }}>
      {title && <h1 className="font-bold text-2xl mb-5">{title}</h1>}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 240px', minWidth: '200px' }}>
          <label className="font-medium text-sm">Search</label>
          <input
            type="text"
            placeholder="Search..."
            value={filters[filterType].search}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              [filterType]: { ...prev[filterType], search: e.target.value }
            }))}
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="font-medium text-sm">Filter by status</label>
          <select
            value={filters[filterType].status}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              [filterType]: { ...prev[filterType], status: e.target.value }
            }))}
            className="form-select"
          >
            {/* An option is either a string or { value, label } -- the
                "show everything" option must have the value 'All Items'
                (ALL_OPTION, top of this file), whatever its label. */}
            {statusOptions.map(opt => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
        </div>

        {extraFilters}

        {sortOptions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-medium text-sm">Sort by</label>
            <select
              value={sortValue}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="form-select"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {onAdd && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-medium text-sm" style={{ visibility: 'hidden' }}>.</label>
            <button onClick={onAdd} className="button button-primary">
              {addLabel}
            </button>
          </div>
        )}

        {exportType && (
          <GenerateReportButton
            type={exportType}
            label={exportLabel}
            filters={{
              status: filters[filterType]?.status !== 'All Items'
                ? filters[filterType]?.status
                : undefined,
              search: filters[filterType]?.search || undefined
            }}
          />
        )}
      </div>

      {layout === 'cards' ? (
        <div>
          <div style={cardsContainerStyle}>
            {visibleData.map(item => renderRow(item))}
          </div>

          {data.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              No results found.
            </div>
          )}
        </div>
      ) : (
        <Section title={`All ${title}`}>
          <Table headers={headers}>
            {visibleData.map(item => renderRow(item))}
          </Table>

          {data.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
              No results found.
            </div>
          )}
        </Section>
      )}

      <Pagination
        page={currentPage}
        totalPages={effectiveTotalPages}
        totalItems={effectiveTotalItems}
        pageSize={effectivePageSize}
        onPageChange={goToPage}
        onPageSizeChange={handlePageSizeChange}
        itemLabel={itemLabel}
      />
    </div>
  );
};

export default ListView;