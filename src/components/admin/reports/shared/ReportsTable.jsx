import React, { useCallback, useEffect, useRef, useState } from "react";
import { tx } from "../../../../i18n/adminText";

// The report tabs as a table (Emergency, Assistance, Petty Crime).
// - Column widths can be dragged at each header's right edge; they're
//   remembered per tab in this browser.
// - A faint line between columns; each row has its type's accent bar.
// - "View details" opens a row underneath with the full details.
// - When the space gets narrow (tablets, phones) each row becomes a card with
//   its column names, so there's no sideways scrolling.
//
// columns: [{ key, label, width, minWidth, render(report) }]
// renderActions(report): the row's buttons (Move to …, Archive).
// renderDetails(report): the opened row (details, Dismiss).

const MIN_WIDTH = 70;
const ACCENT_WIDTH = 6;
const TOGGLE_WIDTH = 116;

const storageKey = (type) => `sc_report_columns_${type}`;
const loadWidths = (type) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(type)) || "null");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
};
const saveWidths = (type, widths) => {
  try { localStorage.setItem(storageKey(type), JSON.stringify(widths)); } catch { /* storage unavailable */ }
};

const STYLE = `
  .rt-wrap { container-type: inline-size; width: 100%; }
  .rt-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .rt { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
  .rt th { position: relative; text-align: left; padding: 11px 10px; font-size: 11.5px; font-weight: 600; color: #6b7280;
           text-transform: uppercase; letter-spacing: .04em; background: #faf8f9; border-bottom: 2px solid #e5e7eb;
           border-right: 1px solid #f1ecee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none; }
  .rt td { padding: 11px 10px; border-bottom: 1px solid #f3f4f6; border-right: 1px solid #f4f1f2; vertical-align: middle;
           overflow: hidden; overflow-wrap: anywhere; color: #1f2937; }
  .rt th:last-child, .rt td:last-child { border-right: 0; }
  .rt .rt-accent { padding: 0; border-right: 0; }
  .rt .rt-accent span { display: block; width: 4px; min-height: 48px; height: 100%; margin-left: 2px; border-radius: 2px; }
  .rt tbody tr.rt-row:hover > td { background: #fcfafb; }
  .rt tbody tr.rt-row.open > td { background: #fff7f8; }
  .rt .rt-details > td { background: #fffafa; padding: 16px 18px 18px; border-right: 0; }
  .rt-resize { position: absolute; top: 0; right: -4px; width: 9px; height: 100%; cursor: col-resize; z-index: 1; touch-action: none; }
  .rt-resize::after { content: ""; position: absolute; top: 25%; bottom: 25%; left: 4px; width: 1px; background: transparent; }
  .rt th:hover .rt-resize::after, .rt-resize.dragging::after { background: #6B2C3E; }
  .rt-id { font-weight: 700; white-space: nowrap; }
  .rt-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .rt-muted { color: #6b7280; font-size: 13px; }
  .rt-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .rt-toggle { min-height: 34px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #374151;
               font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .rt-toggle:hover { border-color: #6B2C3E; color: #6B2C3E; }
  .rt-empty { padding: 32px; text-align: center; color: #6b7280; }

  @container (max-width: 760px) {
    .rt, .rt tbody { display: block; }
    .rt colgroup, .rt thead { display: none; }
    .rt-box { background: transparent; border: 0; overflow: visible; }
    .rt tr.rt-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 12px; padding: 12px 14px 12px 18px;
                    margin-bottom: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; position: relative; }
    .rt tr.rt-row.open { border-radius: 12px 12px 0 0; margin-bottom: 0; }
    .rt tr.rt-row > td { display: block; padding: 0; border: 0; background: none !important; }
    .rt tr.rt-row > td[data-label]::before { content: attr(data-label); display: block; margin-bottom: 2px; font-size: 11px; font-weight: 600;
                                             color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
    .rt tr.rt-row > td.rt-accent { position: absolute; left: 6px; top: 12px; bottom: 12px; }
    .rt tr.rt-row > td.rt-wide { grid-column: 1 / -1; }
    .rt .rt-details { display: block; margin-bottom: 10px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px; overflow: hidden; }
    .rt .rt-details > td { display: block; }
    .rt-toggle { min-height: 40px; }
  }
`;

export default function ReportsTable({
  type,
  accentColor,
  columns,
  items,
  expandedId,
  onToggle,
  renderActions,
  renderDetails,
  actionsWidth = 220
}) {
  const [widths, setWidths] = useState(() => loadWidths(type));
  const drag = useRef(null);
  const [dragging, setDragging] = useState(null);

  useEffect(() => { setWidths(loadWidths(type)); }, [type]);

  const widthOf = (col) => widths[col.key] || col.width;

  // Drag a header's right edge to resize that column.
  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d) return;
    const next = Math.max(d.min, Math.round(d.startWidth + (e.clientX - d.startX)));
    setWidths((w) => (w[d.key] === next ? w : { ...w, [d.key]: next }));
  }, []);
  const onPointerUp = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(null);
    setWidths((w) => { saveWidths(type, w); return w; });
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove, type]);
  useEffect(() => () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp]);

  const startResize = (col, e) => {
    e.preventDefault();
    const th = e.currentTarget.parentElement;
    drag.current = { key: col.key, startX: e.clientX, startWidth: th.getBoundingClientRect().width, min: col.minWidth || MIN_WIDTH };
    setDragging(col.key);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Keyboard: arrow keys on a focused resize handle.
  const nudge = (col, e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = widthOf(col) || e.currentTarget.parentElement.getBoundingClientRect().width;
    const next = Math.max(col.minWidth || MIN_WIDTH, Math.round(current + (e.key === "ArrowRight" ? 16 : -16)));
    const updated = { ...widths, [col.key]: next };
    setWidths(updated);
    saveWidths(type, updated);
  };

  const span = columns.length + 3; // accent + columns + actions + toggle

  return (
    <div className="rt-wrap">
      <style>{STYLE}</style>
      <div className="rt-box">
        <table className="rt">
          <colgroup>
            <col style={{ width: ACCENT_WIDTH }} />
            {columns.map((col) => <col key={col.key} style={{ width: widthOf(col) }} />)}
            <col style={{ width: widths.actions || actionsWidth }} />
            <col style={{ width: TOGGLE_WIDTH }} />
          </colgroup>
          <thead>
            <tr>
              <th className="rt-accent" aria-hidden="true"></th>
              {[...columns, { key: "actions", label: "Actions", minWidth: 150 }].map((col) => (
                <th key={col.key} scope="col">
                  {tx(col.label)}
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={tx("Resize the {{column}} column", { column: tx(col.label) })}
                    tabIndex={0}
                    className={`rt-resize${dragging === col.key ? " dragging" : ""}`}
                    onPointerDown={(e) => startResize(col, e)}
                    onKeyDown={(e) => nudge(col, e)}
                  />
                </th>
              ))}
              <th scope="col"><span className="visually-hidden">{tx("Details")}</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((report) => {
              const open = expandedId === report.id;
              return (
                <React.Fragment key={report.id}>
                  <tr className={`rt-row${open ? " open" : ""}`} id={`report-row-${type}-${report.id}`}>
                    <td className="rt-accent" aria-hidden="true"><span style={{ background: accentColor }} /></td>
                    {columns.map((col) => (
                      <td key={col.key} data-label={tx(col.label)} className={col.wide ? "rt-wide" : undefined}>
                        {col.render(report)}
                      </td>
                    ))}
                    <td data-label={tx("Actions")} className="rt-wide">
                      <div className="rt-actions">{renderActions(report)}</div>
                    </td>
                    <td className="rt-wide">
                      <button type="button" className="rt-toggle" aria-expanded={open} onClick={() => onToggle(report.id)}>
                        {open ? `${tx("Hide details")} ▲` : `${tx("View details")} ▼`}
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="rt-details">
                      <td colSpan={span}>{renderDetails(report)}</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <div className="rt-empty">{tx("No results found.")}</div>}
      </div>
    </div>
  );
}

// A status pill in the cards' colors.
export const StatusPill = ({ badge }) => (
  <span className="rt-pill" style={{ background: badge.bg, color: badge.color }}>{tx(badge.text)}</span>
);
