import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

// Page numbers in the My Reports style (same look as MyReportsPage's
// .mr-pagination): "Showing 1–10 of 34", Previous, 1 … 4 5 6 … 12, Next.
// Used by the resident Notifications page.

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

export default function ResidentPagination({ page, pageSize, total, onPageChange, label }) {
  const { t } = useLanguage();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  return (
    <nav className="rp-pagination" aria-label={label || t('myReports.paginationLabel')}>
      <style>{`
        .rp-pagination { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem 1rem; flex-wrap: wrap; margin-top: 1.25rem; }
        .rp-page-range { font-size: 0.82rem; color: #4b5563; }
        .rp-pages { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .rp-page-btn { min-width: 38px; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #e5d9dc; background: #fff; color: #374151; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .rp-page-btn:hover:not(:disabled) { border-color: #6B2C3E; color: #6B2C3E; }
        .rp-page-btn.active { background: #6B2C3E; border-color: #6B2C3E; color: #fff; }
        .rp-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .rp-page-btn:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 2px; }
        .rp-page-gap { padding: 0 4px; color: #9ca3af; }
        @media (max-width: 576px) {
          .rp-pagination { justify-content: center; }
          .rp-page-range { width: 100%; text-align: center; }
          .rp-page-btn .rp-page-word { display: none; }
        }
      `}</style>
      <span className="rp-page-range">
        {t('myReports.pageRange', {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
          total
        })}
      </span>
      <div className="rp-pages">
        <button type="button" className="rp-page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label={t('myReports.prevPage')}>
          <i className="bi bi-chevron-left" aria-hidden="true" /> <span className="rp-page-word">{t('myReports.prevPage')}</span>
        </button>
        {pageItems(page, pageCount).map((p) => (typeof p === 'number' ? (
          <button
            key={p}
            type="button"
            className={`rp-page-btn ${p === page ? 'active' : ''}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ) : (
          <span key={p} className="rp-page-gap" aria-hidden="true">…</span>
        )))}
        <button type="button" className="rp-page-btn" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label={t('myReports.nextPage')}>
          <span className="rp-page-word">{t('myReports.nextPage')}</span> <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
