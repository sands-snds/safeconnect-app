import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchVerifications, fetchValidIdBlob, decideVerification } from "../../../Services/api";
import { confirmPopup, showPopup } from "../../shared/popup";
import { tx } from "../../../i18n/adminText";

// Residents who signed up with a valid ID wait here until an Official or
// Admin checks that they live in Barangay Santa Fe. Approving activates the
// account; rejecting tells them why (by email) so they can sign up again.

const TABS = ["Pending", "Approved", "Rejected"];
const REFRESH_MS = 30 * 1000;
const REASON_MIN = 5;
const REASON_MAX = 500;
const QUICK_REASONS = [
    "The ID is blurry or can't be read. Please upload a clearer photo.",
    "The address on the ID is not in Barangay Santa Fe.",
    "The name on the ID doesn't match the name on the account.",
    "The ID is expired or is not one of the accepted IDs."
];
const STATUS_STYLE = {
    Pending: { background: "#fef3c7", color: "#92400e" },
    Approved: { background: "#dcfce7", color: "#166534" },
    Rejected: { background: "#fee2e2", color: "#991b1b" }
};

const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
};
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const StatusPill = ({ status }) => (
    <span className="av-pill" style={STATUS_STYLE[status] || STATUS_STYLE.Pending}>{tx(status)}</span>
);

// The uploaded ID, fetched with the admin's token and shown from memory.
function IdViewer({ registration }) {
    const [url, setUrl] = useState(null);
    const [error, setError] = useState("");
    const isPdf = registration.idMimeType === "application/pdf";

    useEffect(() => {
        if (!registration.hasId) return undefined;
        let objectUrl = null;
        let cancelled = false;
        setUrl(null);
        setError("");
        fetchValidIdBlob(registration.id)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [registration.id, registration.hasId]);

    if (!registration.hasId) {
        return (
            <div className="av-id-empty">
                <i className="bi bi-file-earmark-x" aria-hidden="true" />
                <span>{registration.verificationStatus === "Rejected"
                    ? tx("The uploaded ID was deleted when this registration was rejected.")
                    : tx("No ID was uploaded.")}</span>
            </div>
        );
    }
    if (error) return <div className="av-id-empty error"><i className="bi bi-exclamation-triangle" aria-hidden="true" /><span>{error}</span></div>;
    if (!url) return <div className="av-id-empty"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> <span>{tx("Loading the ID…")}</span></div>;

    return (
        <div className="av-id-frame">
            {isPdf
                ? <iframe src={url} title={tx("Uploaded ID")} className="av-id-pdf" />
                : <img src={url} alt={tx("Uploaded ID of {{name}}", { name: registration.fullName })} className="av-id-img" />}
            <a href={url} target="_blank" rel="noopener noreferrer" className="av-id-open">
                <i className="bi bi-arrows-fullscreen" aria-hidden="true" /> {tx("Open full size")}
            </a>
        </div>
    );
}

function Detail({ label, children }) {
    return (
        <div className="av-detail">
            <dt>{tx(label)}</dt>
            <dd>{children || "—"}</dd>
        </div>
    );
}

function ReviewDialog({ registration, onClose, onDecided }) {
    const [mode, setMode] = useState("view"); // view | reject
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const closeRef = useRef(null);
    const isPending = registration.verificationStatus === "Pending";
    const trimmed = reason.trim();
    const closeIfIdle = useRef(onClose);
    closeIfIdle.current = () => { if (!saving) onClose(); };

    // Once on open: focus Close, Esc closes, the page behind doesn't scroll.
    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => { if (e.key === "Escape") closeIfIdle.current(); };
        window.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, []);

    const decide = async (decision) => {
        if (decision === "approve") {
            const ok = await confirmPopup({
                type: "warning",
                title: tx("Approve this account?"),
                message: tx("{{name}} will be able to sign in to SafeConnect as a resident of Barangay Santa Fe. They will get an email and a notification.", { name: registration.fullName }),
                confirmLabel: tx("Approve")
            });
            if (!ok) return;
        }
        setSaving(true);
        const result = await decideVerification(registration.id, decision, decision === "reject" ? trimmed : undefined);
        setSaving(false);
        if (!result.success) {
            showPopup({ type: "error", title: tx("Couldn't Save the Decision"), message: result.message });
            onDecided(false);
            return;
        }
        showPopup({
            type: "success",
            title: decision === "approve" ? tx("Account Approved") : tx("Registration Rejected"),
            message: decision === "approve"
                ? tx("{{name}} can now sign in. They were notified by email.", { name: registration.fullName })
                : tx("{{name}} was emailed the reason and can sign up again with another ID.", { name: registration.fullName })
        });
        onDecided(true);
    };

    return (
        <div className="av-overlay" onClick={() => closeIfIdle.current()}>
            <div className="av-dialog" role="dialog" aria-modal="true" aria-labelledby="av-dialog-title" onClick={(e) => e.stopPropagation()}>
                <div className="av-dialog-head">
                    <div>
                        <h3 id="av-dialog-title">{registration.fullName}</h3>
                        <p>{tx("Registered {{date}}", { date: formatDateTime(registration.createdAt) })} · <StatusPill status={registration.verificationStatus} /></p>
                    </div>
                    <button ref={closeRef} type="button" className="av-close" onClick={onClose} disabled={saving} aria-label={tx("Close")}>
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="av-dialog-body">
                    <section className="av-id-col" aria-label={tx("Uploaded ID")}>
                        <h4>{tx("Uploaded ID")}{registration.idType ? ` · ${tx(registration.idType)}` : ""}</h4>
                        <IdViewer registration={registration} />
                        {registration.hasId && (
                            <p className="av-file-meta">
                                <i className="bi bi-paperclip" aria-hidden="true" /> {registration.idFileName || tx("valid ID")} · {formatSize(registration.idFileSize)}
                            </p>
                        )}
                    </section>

                    <section className="av-info-col" aria-label={tx("Account details")}>
                        <h4>{tx("Account details")}</h4>
                        <dl className="av-details">
                            <Detail label="Full name">{registration.fullName}</Detail>
                            <Detail label="Username">{registration.username && `@${registration.username}`}</Detail>
                            <Detail label="Email">{registration.email && <a href={`mailto:${registration.email}`}>{registration.email}</a>}</Detail>
                            <Detail label="Contact number">{registration.contact && <a href={`tel:${registration.contact}`}>{registration.contact}</a>}</Detail>
                            <Detail label="Type of ID">{registration.idType && tx(registration.idType)}</Detail>
                            <Detail label="Account status">{tx(registration.accountStatus)}</Detail>
                            {!isPending && <Detail label="Reviewed by">{registration.verifiedBy}</Detail>}
                            {!isPending && <Detail label="Reviewed on">{formatDateTime(registration.verifiedAt)}</Detail>}
                            {registration.verificationStatus === "Rejected" && <Detail label="Reason">{registration.note}</Detail>}
                        </dl>

                        {isPending && (
                            <div className="av-checklist">
                                <p><i className="bi bi-list-check" aria-hidden="true" /> {tx("Before approving, check that:")}</p>
                                <ul>
                                    <li>{tx("the name on the ID matches the account's name;")}</li>
                                    <li>{tx("the address on the ID is in Barangay Santa Fe, Dasmariñas, Cavite;")}</li>
                                    <li>{tx("the ID is clear, complete and one of the accepted IDs.")}</li>
                                </ul>
                            </div>
                        )}

                        {isPending && mode === "reject" && (
                            <div className="av-reject">
                                <label htmlFor="av-reason">{tx("Reason (sent to the resident)")}</label>
                                <div className="av-quick">
                                    {QUICK_REASONS.map((r) => (
                                        <button key={r} type="button" className="av-chip" onClick={() => setReason(r)} disabled={saving}>{tx(r)}</button>
                                    ))}
                                </div>
                                <textarea id="av-reason" rows={3} value={reason} autoFocus disabled={saving}
                                    onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                                    placeholder={tx("e.g. The address on the ID is not in Barangay Santa Fe.")} />
                                <div className="av-count">
                                    <span>{trimmed.length < REASON_MIN ? tx("At least {{n}} characters.", { n: REASON_MIN }) : " "}</span>
                                    <span>{reason.length}/{REASON_MAX}</span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {isPending && (
                    <div className="av-dialog-foot">
                        {mode === "reject" ? (
                            <>
                                <button type="button" className="button button-secondary" onClick={() => { setMode("view"); setReason(""); }} disabled={saving}>{tx("Back")}</button>
                                <button type="button" className="button button-danger" onClick={() => decide("reject")} disabled={saving || trimmed.length < REASON_MIN}>
                                    {saving ? tx("Saving…") : tx("Reject Registration")}
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="button button-danger-soft" onClick={() => setMode("reject")} disabled={saving}>
                                    <i className="bi bi-x-circle" aria-hidden="true" /> {tx("Reject")}
                                </button>
                                <button type="button" className="button button-status-resolved" onClick={() => decide("approve")} disabled={saving || !registration.hasId}>
                                    <i className="bi bi-check-circle" aria-hidden="true" /> {saving ? tx("Saving…") : tx("Approve")}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AccountVerificationPage({ focusId, onClearFocus, onChanged }) {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState("Pending");
    const [search, setSearch] = useState("");
    const [reviewingId, setReviewingId] = useState(null);

    const load = useCallback(async () => {
        try {
            setRegistrations(await fetchVerifications());
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // New sign-ups show up without a reload (paused while one is open).
    useEffect(() => {
        if (reviewingId) return undefined;
        const timer = setInterval(() => { if (document.visibilityState !== "hidden") load(); }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [load, reviewingId]);

    // Opened from a notification: show that registration.
    useEffect(() => {
        if (!focusId || loading) return;
        const target = registrations.find((r) => String(r.id) === String(focusId));
        if (target) {
            setTab(target.verificationStatus);
            setReviewingId(target.id);
        }
        onClearFocus && onClearFocus();
    }, [focusId, loading, registrations, onClearFocus]);

    const counts = useMemo(() => Object.fromEntries(TABS.map((s) => [s, registrations.filter((r) => r.verificationStatus === s).length])), [registrations]);
    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return registrations
            .filter((r) => r.verificationStatus === tab)
            .filter((r) => !q || [r.fullName, r.username, r.email, r.contact, r.idType].some((v) => String(v || "").toLowerCase().includes(q)));
    }, [registrations, tab, search]);
    const reviewing = registrations.find((r) => r.id === reviewingId) || null;

    const handleDecided = async (changed) => {
        await load();
        if (changed) {
            setReviewingId(null);
            onChanged && onChanged();
        }
    };

    return (
        <div className="av-page">
            <style>{`
                .av-page { display: flex; flex-direction: column; gap: 16px; }
                .av-intro { margin: 0; color: #4b5563; font-size: 14px; line-height: 1.55; }
                .av-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
                .av-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 8px; background: #f3f4f6; }
                .av-tab { border: none; background: transparent; border-radius: 6px; padding: 7px 14px; font-size: 13.5px; font-weight: 600; color: #4b5563; cursor: pointer; white-space: nowrap; }
                .av-tab.active { background: #fff; color: #111827; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
                .av-tab .av-count-badge { margin-left: 6px; display: inline-block; min-width: 20px; padding: 1px 6px; border-radius: 999px; background: #e5e7eb; font-size: 11.5px; text-align: center; }
                .av-tab.active.pending .av-count-badge { background: #6B2C3E; color: #fff; }
                .av-search { position: relative; flex: 0 1 300px; min-width: 200px; }
                .av-search i { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
                .av-search input { width: 100%; height: 40px; padding: 0 12px 0 34px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
                .av-search input:focus { outline: none; border-color: #6B2C3E; box-shadow: 0 0 0 3px rgba(107, 44, 62, 0.12); }

                .av-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
                .av-card { display: flex; flex-direction: column; gap: 10px; background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #d97706; border-radius: 10px; padding: 16px; }
                .av-card.approved { border-left-color: #16a34a; }
                .av-card.rejected { border-left-color: #dc2626; }
                .av-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
                .av-card-name { margin: 0; font-size: 15.5px; font-weight: 700; color: #111827; overflow-wrap: anywhere; }
                .av-card-sub { margin: 2px 0 0; font-size: 12.5px; color: #6b7280; }
                .av-card-meta { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 13px; color: #374151; }
                .av-card-meta li { display: flex; gap: 8px; align-items: center; min-width: 0; }
                .av-card-meta li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .av-card-meta i { color: #9ca3af; flex-shrink: 0; }
                .av-card .button { align-self: flex-start; }
                .av-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; }
                .av-empty { background: #fff; border: 1px dashed #d1d5db; border-radius: 10px; padding: 32px 16px; text-align: center; color: #6b7280; font-size: 14px; }
                .av-empty i { display: block; font-size: 28px; margin-bottom: 6px; color: #9ca3af; }

                .av-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(17, 24, 39, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; }
                .av-dialog { background: #fff; width: 100%; max-width: 980px; max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
                .av-dialog-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 18px 22px; border-bottom: 1px solid #e5e7eb; }
                .av-dialog-head h3 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; overflow-wrap: anywhere; }
                .av-dialog-head p { margin: 4px 0 0; font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                .av-close { width: 36px; height: 36px; flex-shrink: 0; border: none; background: transparent; border-radius: 8px; color: #6b7280; cursor: pointer; font-size: 16px; }
                .av-close:hover { background: #f3f4f6; color: #111827; }
                .av-dialog-body { flex: 1; overflow-y: auto; display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 22px; padding: 20px 22px; }
                .av-dialog-body h4 { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #6B2C3E; text-transform: uppercase; letter-spacing: 0.04em; }
                .av-id-frame { position: relative; border: 1px solid #e5e7eb; border-radius: 10px; background: #111827; overflow: hidden; }
                .av-id-img { display: block; width: 100%; max-height: 60vh; object-fit: contain; background: #111827; }
                .av-id-pdf { display: block; width: 100%; height: 60vh; border: none; background: #fff; }
                .av-id-open { position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.92); color: #111827; font-size: 12.5px; font-weight: 600; text-decoration: none; }
                .av-id-open:hover { background: #fff; }
                .av-id-empty { min-height: 220px; border: 1px dashed #d1d5db; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; text-align: center; color: #6b7280; font-size: 13.5px; }
                .av-id-empty i { font-size: 26px; }
                .av-id-empty.error { color: #b91c1c; border-color: #fecaca; }
                .av-file-meta { margin: 8px 0 0; font-size: 12.5px; color: #6b7280; overflow-wrap: anywhere; }
                .av-details { margin: 0 0 16px; display: grid; gap: 10px; }
                .av-detail { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 8px; font-size: 13.5px; }
                .av-detail dt { color: #6b7280; font-weight: 600; }
                .av-detail dd { margin: 0; color: #111827; overflow-wrap: anywhere; }
                .av-detail a { color: #6B2C3E; font-weight: 600; text-decoration: none; }
                .av-checklist { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #374151; margin-bottom: 14px; }
                .av-checklist p { margin: 0 0 4px; font-weight: 700; display: flex; gap: 6px; align-items: center; }
                .av-checklist ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 2px; }
                .av-reject label { display: block; font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 6px; }
                .av-quick { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
                .av-chip { border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; border-radius: 999px; padding: 4px 10px; font-size: 12px; text-align: left; cursor: pointer; }
                .av-chip:hover:not(:disabled) { background: #fee2e2; }
                .av-reject textarea { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 14px; font-family: inherit; resize: vertical; }
                .av-reject textarea:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12); }
                .av-count { display: flex; justify-content: space-between; font-size: 11.5px; color: #6b7280; margin-top: 4px; }
                .av-dialog-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #e5e7eb; background: #fafafa; }
                .av-dialog-foot .button { display: inline-flex; align-items: center; gap: 6px; }

                @media (max-width: 768px) {
                    .av-toolbar { flex-direction: column; align-items: stretch; }
                    .av-tabs { display: grid; grid-template-columns: repeat(3, 1fr); }
                    .av-tab { padding: 8px 6px; font-size: 13px; }
                    .av-search { flex: 1 1 auto; min-width: 0; }
                    .av-list { grid-template-columns: 1fr; }
                    .av-overlay { padding: 0; align-items: stretch; }
                    .av-dialog { max-width: none; max-height: none; height: 100%; border-radius: 0; }
                    .av-dialog-head { padding: 14px 16px; }
                    .av-dialog-body { grid-template-columns: 1fr; gap: 18px; padding: 16px; }
                    .av-id-img { max-height: 50vh; }
                    .av-id-pdf { height: 55vh; }
                    .av-detail { grid-template-columns: 110px minmax(0, 1fr); }
                    .av-dialog-foot { padding: 12px 16px; }
                    .av-dialog-foot .button { flex: 1; justify-content: center; }
                }
            `}</style>

            <p className="av-intro">
                {tx("Residents upload a valid ID when they sign up. Check that each one lives in Barangay Santa Fe, then approve the account so they can sign in, or reject it with a reason.")}
            </p>

            <div className="av-toolbar">
                <div className="av-tabs" role="tablist" aria-label={tx("Registrations")}>
                    {TABS.map((s) => (
                        <button key={s} type="button" role="tab" aria-selected={tab === s}
                            className={`av-tab ${tab === s ? "active" : ""} ${s.toLowerCase()}`} onClick={() => setTab(s)}>
                            {tx(s)}<span className="av-count-badge">{counts[s]}</span>
                        </button>
                    ))}
                </div>
                <label className="av-search">
                    <i className="bi bi-search" aria-hidden="true" />
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder={tx("Search name, email, contact or ID")} aria-label={tx("Search registrations")} />
                </label>
            </div>

            {loading ? (
                <div className="av-empty"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {tx("Loading registrations…")}</div>
            ) : error ? (
                <div className="av-empty" role="alert">
                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />{error}
                    <div style={{ marginTop: 10 }}><button type="button" className="button button-soft" onClick={load}>{tx("Try again")}</button></div>
                </div>
            ) : shown.length === 0 ? (
                <div className="av-empty">
                    <i className={`bi ${tab === "Pending" ? "bi-inbox" : "bi-search"}`} aria-hidden="true" />
                    {search ? tx("No registrations match your search.")
                        : tab === "Pending" ? tx("No accounts are waiting for verification.")
                        : tx("No {{status}} registrations yet.", { status: tx(tab).toLowerCase() })}
                </div>
            ) : (
                <div className="av-list">
                    {shown.map((r) => (
                        <article key={r.id} className={`av-card ${r.verificationStatus.toLowerCase()}`}>
                            <div className="av-card-head">
                                <div style={{ minWidth: 0 }}>
                                    <h3 className="av-card-name">{r.fullName}</h3>
                                    <p className="av-card-sub">{tx("Registered {{date}}", { date: formatDateTime(r.createdAt) })}</p>
                                </div>
                                <StatusPill status={r.verificationStatus} />
                            </div>
                            <ul className="av-card-meta">
                                <li><i className="bi bi-envelope" aria-hidden="true" /><span>{r.email}</span></li>
                                <li><i className="bi bi-phone" aria-hidden="true" /><span>{r.contact || "—"}</span></li>
                                <li><i className="bi bi-person-vcard" aria-hidden="true" /><span>{r.idType ? tx(r.idType) : tx("No ID")}</span></li>
                                {r.verificationStatus !== "Pending" && r.verifiedBy && (
                                    <li><i className="bi bi-person-check" aria-hidden="true" /><span>{tx("Reviewed by {{name}}", { name: r.verifiedBy })}</span></li>
                                )}
                            </ul>
                            <button type="button" className={`button ${r.verificationStatus === "Pending" ? "button-primary" : "button-soft"}`} onClick={() => setReviewingId(r.id)}>
                                {r.verificationStatus === "Pending" ? tx("Review ID") : tx("View details")}
                            </button>
                        </article>
                    ))}
                </div>
            )}

            {reviewing && (
                <ReviewDialog
                    registration={reviewing}
                    onClose={() => setReviewingId(null)}
                    onDecided={handleDecided}
                />
            )}
        </div>
    );
}
