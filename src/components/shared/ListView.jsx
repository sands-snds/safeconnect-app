import React from 'react';
import Section from './Section';
import Table from './Table';

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
  // Optional: only rendered when provided, so tables that don't use them
  // (everything except Announcements, for now) keep working unchanged.
  sortOptions,
  sortValue,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  totalItems
}) => {
  const showPagination = typeof totalPages === 'number' && totalPages > 1;

  return (
    <div>
      <h1 className="font-bold text-2xl mb-5">{title}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-medium text-sm">Filter by Status:</label>
            <select
              value={filters[filterType].status}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                [filterType]: { ...prev[filterType], status: e.target.value }
              }))}
              className="form-select"
            >
              {statusOptions.map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {sortOptions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="font-medium text-sm">Sort by:</label>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          {onAdd && (
            <button onClick={onAdd} className="button button-primary self-start">
              + Add New
            </button>
          )}
        </div>
      </div>

      <Section title={`All ${title}`}>
        <Table headers={headers}>
          {data.map(item => renderRow(item))}
        </Table>

        {data.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            No results found.
          </div>
        )}

        {showPagination && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '.85rem', color: '#6b7280' }}>
              {typeof totalItems === 'number' ? `${totalItems} total · ` : ''}
              Page {page} of {totalPages}
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onPageChange && onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

export default ListView;