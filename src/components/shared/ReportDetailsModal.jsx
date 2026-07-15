import React from 'react';

/**
 * Generic "View Details" modal shared by Emergency, Petty Crime, and
 * Assistance tables.
 *
 * Usage:
 *   <ReportDetailsModal
 *     title="Emergency Report Details"
 *     report={selectedReport}
 *     fields={[
 *       { label: 'Reporter', value: report.reporter },
 *       { label: 'Contact', value: report.phone },
 *       ...
 *     ]}
 *     images={[report.photoUrl]}
 *     onClose={() => setSelectedReport(null)}
 *   />
 *
 * `fields` is an array of { label, value } pairs so each table can decide
 * exactly what to show and in what order, without this component needing
 * to know about crime types vs. emergency types vs. assistance types.
 * Falsy values are skipped automatically.
 */
const ReportDetailsModal = ({ title, fields = [], images = [], onClose }) => {
  const visibleFields = fields.filter(
    (f) => f && f.value !== undefined && f.value !== null && f.value !== ''
  );

  const visibleImages = (images || []).filter(Boolean);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full"
        style={{ maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            style={{ fontSize: '20px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4">
          <dl>
            {visibleFields.map((f, i) => (
              <div
                key={i}
                className="py-2"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '12px',
                  borderBottom: i !== visibleFields.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}
              >
                <dt className="text-gray-500 text-xs font-medium" style={{ paddingTop: '2px' }}>
                  {f.label}
                </dt>
                <dd className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {f.value}
                </dd>
              </div>
            ))}
            {visibleFields.length === 0 && (
              <div className="text-sm text-gray-500 py-2">No additional details provided.</div>
            )}
          </dl>

          {visibleImages.length > 0 && (
            <div className="mt-4">
              <div className="text-gray-500 text-xs font-medium mb-2">
                {visibleImages.length > 1 ? 'Uploaded Photos' : 'Uploaded Photo'}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: visibleImages.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                  gap: '8px',
                }}
              >
                {visibleImages.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                    <img
                      src={src}
                      alt={`Uploaded photo ${i + 1}`}
                      style={{
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3" style={{ borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="text-sm"
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;