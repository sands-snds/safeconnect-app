import React, { useState, useEffect, useRef } from 'react';
import Section from './Section';
import Table from './Table';
import GenerateReportButton from './GenerateReportButton';
import Pagination from './Pagination';
import { tx } from "../../../i18n/adminText";

const DEFAULT_PAGE_SIZE = 10;

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

  layout = 'table',

  cardsContainerStyle = { display: 'flex', flexDirection: 'column', gap: '10px' },
  // Optional sort dropdown (Announcements).
  sortOptions,
  sortValue,
  onSortChange,

  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  itemLabel,

  exportType,
  exportLabel,
  exportWithOptions = false,
  exportTitle = '',

  exportFilters = {},

  addLabel = '+ Add New',

  extraFilters,

  sectionTitle,

  showFilters = true
}) => {
  const isControlled = typeof page === 'number';

  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const listTopRef = useRef(null);

  const filterKey = JSON.stringify(filters?.[filterType] || {});
  useEffect(() => {
    setInternalPage(1);
  }, [filterKey]);

  const effectivePageSize = isControlled ? (pageSize || DEFAULT_PAGE_SIZE) : internalPageSize;
  const effectiveTotalItems = isControlled ? (totalItems ?? data.length) : data.length;
  const effectiveTotalPages = isControlled
    ? (totalPages || 1)
    : Math.max(1, Math.ceil(data.length / internalPageSize));

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

      {showFilters && (
      <div className="lv-filters" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', marginBottom: '20px' }}>
        <div className="lv-search" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 240px', minWidth: '200px' }}>
          <label className="font-medium text-sm">{tx("Search")}</label>
          <input
            type="text"
            placeholder={tx("Search...")}
            value={filters[filterType].search}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              [filterType]: { ...prev[filterType], search: e.target.value }
            }))}
            className="form-input"
          />
        </div>

        <div className="lv-filter" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="font-medium text-sm">{tx("Filter by status")}</label>
          <select
            value={filters[filterType].status}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              [filterType]: { ...prev[filterType], status: e.target.value }
            }))}
            className="form-select"
          >

            {statusOptions.map(opt => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return <option key={value} value={value}>{tx(label)}</option>;
            })}
          </select>
        </div>

        {extraFilters && <div className="lv-filter lv-extra">{extraFilters}</div>}

        {sortOptions && (
          <div className="lv-filter" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-medium text-sm">{tx("Sort by")}</label>
            <select
              value={sortValue}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="form-select"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{tx(opt.label)}</option>
              ))}
            </select>
          </div>
        )}

        {onAdd && (
          <div className="lv-action" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-medium text-sm lv-spacer" style={{ visibility: 'hidden' }}>.</label>
            <button onClick={onAdd} className="button button-primary">
              {addLabel}
            </button>
          </div>
        )}

        {exportType && (
          <div className="lv-action">
          <GenerateReportButton
            type={exportType}
            label={exportLabel}
            withOptions={exportWithOptions}
            optionsTitle={exportTitle}
            filters={{
              status: filters[filterType]?.status !== 'All Items'
                ? filters[filterType]?.status
                : undefined,
              search: filters[filterType]?.search || undefined,
              ...exportFilters
            }}
          />
          </div>
        )}
      </div>
      )}

      {layout === 'cards' ? (
        <div>
          <div className="lv-cards" style={cardsContainerStyle}>
            {visibleData.map(item => renderRow(item))}
          </div>

          {data.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              {tx("No results found.")}
            </div>
          )}
        </div>
      ) : (
        <Section title={sectionTitle ?? (title ? `All ${title}` : undefined)}>
          <Table headers={headers}>
            {visibleData.map(item => renderRow(item))}
          </Table>

          {data.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
              {tx("No results found.")}
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