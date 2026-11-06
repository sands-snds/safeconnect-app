import React, { useEffect, useMemo, useState } from "react";
import IncidentMap from "../../shared/location/IncidentMap";
import { MAP_TYPES, LEGEND_TYPES, MAIN_TYPES, RESOLVED_COLOR, fromAdminReport, isOpenStatus, timeAgo } from "../../shared/location/mapReports";
import StatusConfirmModal from "../shared/StatusConfirmModal";
import { statusBadge } from "../shared/StatusSelect";
import { tx } from "../../../i18n/adminText";

// General → Incident Map: every open report at the spot it was pinned,
// blinking until it is resolved. Uses the lists useAdminData already loads
// (refreshed by the live channel), so new reports and status changes show
// up without a reload.

const VIEW_FOR_KIND = { emergency: "emergency-reports", assistance: "assistance-requests", pettyCrime: "petty-crime-reports" };
const NEXT_STATUS = { Received: "In Progress", "In Progress": "Resolved" };
const NEXT_CLASS = { "In Progress": "button-status-progress", Resolved: "button-status-resolved" };
const FILTERS = [
    { key: "all", label: "All open", color: "#6B2C3E" },
    { key: "fire", label: "Fire", color: MAP_TYPES.fire.color },
    { key: "flood", label: "Flood", color: MAP_TYPES.flood.color },
    { key: "quake", label: "Earthquake", color: MAP_TYPES.quake.color },
    { key: "other", label: "Other reports", color: "#6b7280" }
];
const matchesFilter = (r, f) => f === "all" || r.type === f || (f === "other" && !MAIN_TYPES.includes(r.type));

const Pill = ({ status }) => {
    const b = statusBadge(status);
    return <span className="im-pill" style={{ background: b.bg, color: b.color }}>{tx(status)}</span>;
};

export function MapLegend() {
    return (
        <div className="im-legend" aria-label={tx("Legend")}>
            {LEGEND_TYPES.map((k) => (
                <span key={k}><span className="im-lg" style={{ "--c": MAP_TYPES[k].color }}><i className={`bi ${MAP_TYPES[k].icon}`} aria-hidden="true" /></span>{tx(MAP_TYPES[k].label)}</span>
            ))}
            <span><span className="im-lg" style={{ "--c": RESOLVED_COLOR }}><i className="bi bi-check-lg" aria-hidden="true" /></span>{tx("Resolved (stops blinking)")}</span>
        </div>
    );
}

export const MAP_PAGE_STYLE = `
    .im-pill { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
    .im-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 12px 18px; border-top: 1px solid #f0f0f2; font-size: 12.5px; color: #374151; }
    .im-legend > span { display: inline-flex; align-items: center; gap: 6px; }
    .im-lg { width: 20px; height: 20px; border-radius: 50%; background: var(--c); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
    .im-pop-title { margin: 0 22px 4px 0; font-size: 14px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 6px; }
    .im-pop-meta { margin: 0 0 8px; font-size: 12px; color: #6b7280; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
    .im-pop-addr { margin: 0 0 10px; font-size: 12.5px; color: #374151; line-height: 1.45; }
    .im-pop-acts { display: flex; flex-wrap: wrap; gap: 6px; }
    .im-pop-acts .button { padding: 6px 10px; font-size: 12.5px; }
`;

export default function IncidentMapPage({ emergencyReports = [], assistanceRequests = [], pettyCrimeReports = [], onUpdateStatus, onNavigate, focusKey, onClearFocus }) {
    const [filter, setFilter] = useState("all");
    const [showResolved, setShowResolved] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [pending, setPending] = useState(null); // { report, next }
    const [saving, setSaving] = useState(false);
    const [, setTick] = useState(0);

    // "x min ago" stays current.
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 30000);
        return () => clearInterval(t);
    }, []);

    const all = useMemo(() => [
        ...emergencyReports.map((r) => fromAdminReport("emergency", r)),
        ...assistanceRequests.map((r) => fromAdminReport("assistance", r)),
        ...pettyCrimeReports.map((r) => fromAdminReport("pettyCrime", r))
    ].filter((r) => !r.archived && r.status !== "Dismissed"), [emergencyReports, assistanceRequests, pettyCrimeReports]);

    // Opened from the new-report alert: show that report.
    useEffect(() => {
        if (!focusKey) return;
        if (all.some((r) => r.key === focusKey)) {
            setFilter("all");
            setSelectedKey(focusKey);
        }
        onClearFocus && onClearFocus();
    }, [focusKey, all, onClearFocus]);

    const open = all.filter((r) => isOpenStatus(r.status));
    const shown = all
        .filter((r) => (showResolved || isOpenStatus(r.status)) && matchesFilter(r, filter))
        .sort((a, b) => (isOpenStatus(b.status) - isOpenStatus(a.status)) || ((b.at || 0) - (a.at || 0)));
    const openShown = shown.filter((r) => isOpenStatus(r.status)).length;

    const confirm = async (reason) => {
        if (!pending) return;
        setSaving(true);
        try {
            await onUpdateStatus(pending.report.id, pending.next, pending.report.kind, reason);
        } finally {
            setSaving(false);
            setPending(null);
        }
    };

    const renderPopup = (r) => {
        const t = MAP_TYPES[r.type] || MAP_TYPES.emergency;
        const next = NEXT_STATUS[r.status];
        return (
            <div>
                <p className="im-pop-title"><i className={`bi ${t.icon}`} style={{ color: t.color }} aria-hidden="true" /> {tx(r.title)}</p>
                <p className="im-pop-meta">{r.reference}{r.at ? ` · ${timeAgo(r.at)}` : ""} <Pill status={r.status} /></p>
                <p className="im-pop-addr">{r.who && <><b>{r.who}</b><br /></>}{r.location}</p>
                <div className="im-pop-acts">
                    {next && (
                        <button type="button" className={`button ${NEXT_CLASS[next]}`} onClick={() => setPending({ report: r, next })}>
                            {tx("Move to {{status}} →", { status: tx(next) })}
                        </button>
                    )}
                    <button type="button" className="button button-soft" onClick={() => onNavigate(VIEW_FOR_KIND[r.kind], { focusId: r.id })}>
                        {tx("View report")}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="im-page">
            <style>{MAP_PAGE_STYLE + `
                .im-page { display: flex; flex-direction: column; gap: 16px; }
                .im-intro { margin: 0; color: #4b5563; font-size: 14px; }
                .im-chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
                .im-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
                .im-chip .n { font-variant-numeric: tabular-nums; color: #6b7280; font-weight: 700; }
                .im-chip .sw { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
                .im-chip[aria-pressed="true"] { border-color: var(--c); background: color-mix(in srgb, var(--c) 10%, #fff); color: var(--c); }
                .im-chip[aria-pressed="true"] .n { color: inherit; }
                .im-resolved { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; cursor: pointer; }
                .im-resolved input { accent-color: #6B2C3E; width: 16px; height: 16px; }
                .im-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
                .im-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; min-width: 0; }
                .im-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 18px; border-bottom: 1px solid #f0f0f2; }
                .im-card-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }
                .im-card-head span { font-size: 12.5px; color: #6b7280; }
                .im-list { max-height: 470px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
                .im-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; text-align: left; width: 100%; font: inherit; color: inherit; }
                .im-row:hover { border-color: #d1d5db; background: #fcfcfd; }
                .im-row.sel { border-color: #6B2C3E; box-shadow: 0 0 0 1px #6B2C3E; }
                .im-accent { width: 6px; align-self: stretch; border-radius: 4px; background: var(--c); flex-shrink: 0; }
                .im-row-main { flex: 1; min-width: 0; }
                .im-row-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .im-row-title { font-size: 14px; font-weight: 600; color: #111827; }
                .im-row-sub { display: block; font-size: 12.5px; color: #6b7280; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .im-empty { margin: 8px; color: #6b7280; font-size: 13.5px; }
                @media (max-width: 768px) {
                    .im-page { gap: 12px; }
                    .im-grid { grid-template-columns: 1fr; }
                    .im-resolved { margin-left: 0; width: 100%; }
                    .im-list { max-height: none; }
                    .im-legend { padding: 10px 12px; gap: 6px 12px; }
                }
            `}</style>

            <p className="im-intro">{tx("Every open report in Barangay Santa Fe, at the spot the reporter pinned. Markers blink until the report is resolved.")}</p>

            <div className="im-chips">
                {FILTERS.map((f) => (
                    <button key={f.key} type="button" className="im-chip" aria-pressed={filter === f.key} style={{ "--c": f.color }} onClick={() => setFilter(f.key)}>
                        {f.key !== "all" && <span className="sw" />}{tx(f.label)} <span className="n">{open.filter((r) => matchesFilter(r, f.key)).length}</span>
                    </button>
                ))}
                <label className="im-resolved">
                    <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> {tx("Show resolved")}
                </label>
            </div>

            <div className="im-grid">
                <section className="im-card">
                    <IncidentMap
                        reports={shown}
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                        renderPopup={renderPopup}
                        height={window.matchMedia?.("(max-width: 768px)").matches ? 340 : 470}
                        label={tx("Map of Barangay Santa Fe")}
                    />
                    <MapLegend />
                </section>
                <section className="im-card" aria-labelledby="im-list-title">
                    <div className="im-card-head"><h3 id="im-list-title">{tx("Open reports")}</h3><span>{tx("{{n}} open", { n: openShown })}</span></div>
                    <div className="im-list">
                        {shown.length === 0 && <p className="im-empty">{tx("No open reports for this filter.")}</p>}
                        {shown.map((r) => {
                            const t = MAP_TYPES[r.type] || MAP_TYPES.emergency;
                            return (
                                <button key={r.key} type="button" className={`im-row${selectedKey === r.key ? " sel" : ""}`}
                                    style={{ "--c": isOpenStatus(r.status) ? t.color : RESOLVED_COLOR }} onClick={() => setSelectedKey(r.key)}>
                                    <span className="im-accent" />
                                    <span className="im-row-main">
                                        <span className="im-row-top"><span className="im-row-title">{tx(r.title)}</span><Pill status={r.status} /></span>
                                        <span className="im-row-sub">{[r.reference, r.at && timeAgo(r.at), r.position ? r.location : tx("No pin: {{address}}", { address: r.location })].filter(Boolean).join(" · ")}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <StatusConfirmModal
                show={Boolean(pending)}
                fromStatus={pending?.report.status}
                toStatus={pending?.next}
                isSubmitting={saving}
                onConfirm={confirm}
                onCancel={() => setPending(null)}
            />
        </div>
    );
}
