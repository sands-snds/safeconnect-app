import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { confirmPopup } from "../../shared/popup";
import SwipeToArchive from "./SwipeToArchive";

const SNACK_MS = 5000;

// What "View" opens for each kind of notification.
const openLabelKey = (n) => {
    if (!n.isPersonal) return "notificationsPage.openArticle";
    if (n.category === "comment_reply") return "notificationsPage.openComment";
    return "notificationsPage.openReport";
};

// Full list of the resident's notifications (the bell shows only the
// latest). Inbox / Archived, All / Unread / Read, select several to archive,
// restore, mark read or delete; swipe one away on phones.
export default function NotificationsPage({
    isOpen,
    notifications,
    archivedNotifications,
    onOpen,
    onArchive,
    onDelete,
    onMarkRead,
    formatRelativeTime,
    getCategoryIcon,
    getCategoryColor
}) {
    const { t, language } = useLanguage();
    const [box, setBox] = useState("inbox");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(() => new Set());
    // { text, undo: { ids, archived } | null }
    const [snack, setSnack] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setSelected(new Set());
            setSnack(null);
        }
    }, [isOpen]);

    useEffect(() => { setSelected(new Set()); }, [box, filter]);

    useEffect(() => {
        if (!snack) return undefined;
        const timer = setTimeout(() => setSnack(null), SNACK_MS);
        return () => clearTimeout(timer);
    }, [snack]);

    const source = box === "inbox" ? notifications : archivedNotifications;
    const visible = useMemo(() => source.filter((n) =>
        filter === "all" || (filter === "unread" ? n.unread : !n.unread)
    ), [source, filter]);

    // Drop selections that are no longer on screen (archived elsewhere, etc).
    useEffect(() => {
        setSelected((prev) => {
            const ids = new Set(visible.map((n) => n.id));
            const next = new Set([...prev].filter((id) => ids.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [visible]);

    const selectedIds = visible.filter((n) => selected.has(n.id)).map((n) => n.id);
    const allSelected = visible.length > 0 && selectedIds.length === visible.length;
    const anyUnreadSelected = visible.some((n) => selected.has(n.id) && n.unread);
    const unreadInbox = notifications.filter((n) => n.unread).length;

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((n) => n.id)));

    const archive = async (ids, archived) => {
        if (!ids.length) return;
        setSelected(new Set());
        const ok = await onArchive(ids, archived);
        if (ok === false) {
            setSnack({ text: t("notificationsPage.failed"), undo: null });
            return;
        }
        const many = ids.length > 1;
        setSnack({
            text: archived
                ? (many ? t("notificationsPage.archivedMany", { count: ids.length }) : t("notificationsPage.archivedOne"))
                : (many ? t("notificationsPage.restoredMany", { count: ids.length }) : t("notificationsPage.restoredOne")),
            undo: { ids, archived: !archived }
        });
    };

    const remove = async (ids) => {
        if (!ids.length) return;
        const many = ids.length > 1;
        const confirmed = await confirmPopup({
            type: "danger",
            title: t("notificationsPage.deleteTitle"),
            message: many ? t("notificationsPage.deleteBodyMany", { count: ids.length }) : t("notificationsPage.deleteBodyOne"),
            confirmLabel: t("notificationsPage.deleteConfirm"),
            cancelLabel: t("notificationsPage.cancel")
        });
        if (!confirmed) return;
        setSelected(new Set());
        const ok = await onDelete(ids);
        setSnack({
            text: ok === false
                ? t("notificationsPage.failed")
                : (many ? t("notificationsPage.deletedMany", { count: ids.length }) : t("notificationsPage.deletedOne")),
            undo: null
        });
    };

    const undo = () => {
        if (!snack?.undo) return;
        onArchive(snack.undo.ids, snack.undo.archived);
        setSnack(null);
    };

    const fullDate = (date) => {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString(language === "tl" ? "fil-PH" : "en-US", {
            month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
        });
    };

    const emptyText = box === "archived"
        ? t("notificationsPage.emptyArchived")
        : filter === "unread" ? t("notificationsPage.emptyUnread") : t("notificationsPage.emptyInbox");

    return (
        <div className={`notifications-fullscreen ${isOpen ? "show" : ""}`} aria-hidden={!isOpen}>
            <div className="np-header">
                <div className="np-header-icon"><i className="bi bi-bell-fill" aria-hidden="true"></i></div>
                <div>
                    <h2>{t("notificationsPage.title")}</h2>
                    <p className="np-header-sub">{t("notificationsPage.subtitle")}</p>
                </div>
            </div>

            <div className="np-body">
                <div className="np-wrap">
                    <div className="np-tabs" role="tablist">
                        {[["inbox", t("notificationsPage.inbox"), notifications.length], ["archived", t("notificationsPage.archivedTab"), archivedNotifications.length]].map(([key, label, count]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={box === key}
                                className={`np-tab ${box === key ? "active" : ""}`}
                                onClick={() => setBox(key)}
                            >
                                <i className={`bi ${key === "inbox" ? "bi-inbox-fill" : "bi-archive-fill"}`} aria-hidden="true"></i>
                                {label} <span className="count">{count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="np-filters" role="group">
                        {[["all", t("notificationsPage.all")], ["unread", t("notificationsPage.unread")], ["read", t("notificationsPage.read")]].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`np-filter ${filter === key ? "active" : ""}`}
                                aria-pressed={filter === key}
                                onClick={() => setFilter(key)}
                            >
                                {label}
                                {key === "unread" && box === "inbox" && unreadInbox > 0 && <span>{unreadInbox}</span>}
                            </button>
                        ))}
                    </div>

                    {visible.length > 0 && (
                        <div className={`np-bulk ${selectedIds.length ? "has-selection" : ""}`}>
                            <label className="np-check-all">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t("notificationsPage.selectAll")} />
                                <span>{selectedIds.length ? t("notificationsPage.selectedCount", { count: selectedIds.length }) : t("notificationsPage.selectAll")}</span>
                            </label>
                            <div className="np-bulk-actions">
                                {box === "inbox" && anyUnreadSelected && (
                                    <button type="button" className="np-btn" onClick={() => { onMarkRead(selectedIds); setSelected(new Set()); }}>
                                        <i className="bi bi-check2-all" aria-hidden="true"></i><span>{t("notificationsPage.markRead")}</span>
                                    </button>
                                )}
                                <button type="button" className="np-btn" disabled={!selectedIds.length} onClick={() => archive(selectedIds, box === "inbox")}>
                                    <i className={`bi ${box === "inbox" ? "bi-archive" : "bi-arrow-counterclockwise"}`} aria-hidden="true"></i>
                                    <span>{box === "inbox" ? t("notificationsPage.archive") : t("notificationsPage.restore")}</span>
                                </button>
                                <button type="button" className="np-btn danger" disabled={!selectedIds.length} onClick={() => remove(selectedIds)}>
                                    <i className="bi bi-trash3" aria-hidden="true"></i><span>{t("notificationsPage.delete")}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {box === "inbox" && visible.length > 0 && <p className="np-swipe-hint">{t("notificationsPage.swipeHint")}</p>}

                    {visible.length === 0 ? (
                        <div className="np-empty">
                            <i className={`bi ${box === "archived" ? "bi-archive" : filter === "unread" ? "bi-check2-circle" : "bi-bell-slash"}`} aria-hidden="true"></i>
                            <p>{emptyText}</p>
                        </div>
                    ) : (
                        <ul className={`np-list ${box}`}>
                            {visible.map((n) => {
                                const color = getCategoryColor ? getCategoryColor(n.category) : "#6B2C3E";
                                const isSelected = selected.has(n.id);
                                return (
                                    <li key={n.id}>
                                        <SwipeToArchive
                                            onArchive={box === "inbox" ? () => archive([n.id], true) : null}
                                            label={t("notificationPanel.archive")}
                                        >
                                            <div className={`np-item ${n.unread ? "unread" : ""} ${isSelected ? "selected" : ""}`} data-notification-id={n.id}>
                                                <input
                                                    type="checkbox"
                                                    className="np-item-check"
                                                    checked={isSelected}
                                                    onChange={() => toggle(n.id)}
                                                    aria-label={t("notificationsPage.select", { title: n.title })}
                                                />
                                                <div
                                                    className="np-item-icon"
                                                    style={n.unread ? { background: color, color: "#fff" } : { background: `${color}18`, color }}
                                                >
                                                    <i className={`bi ${getCategoryIcon(n.category)}`} aria-hidden="true"></i>
                                                </div>
                                                <button type="button" className="np-item-main" onClick={() => onOpen(n.id)}>
                                                    <span className="np-item-title-row">
                                                        <span className="np-item-title">{n.title}</span>
                                                        {n.isPersonal && <span className="n-tag">{t("notificationPanel.yourReport")}</span>}
                                                        {n.unread && <span className="unread-dot" aria-hidden="true"></span>}
                                                    </span>
                                                    <span className="np-item-message">{n.message}</span>
                                                    <span className="np-item-time" title={fullDate(n.date)}>
                                                        {fullDate(n.date)} · {formatRelativeTime(n.date)}
                                                    </span>
                                                </button>
                                                <div className="np-item-actions">
                                                    <button type="button" className="np-icon-btn" onClick={() => onOpen(n.id)} title={t(openLabelKey(n))} aria-label={t(openLabelKey(n))}>
                                                        <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="np-icon-btn"
                                                        onClick={() => archive([n.id], box === "inbox")}
                                                        title={box === "inbox" ? t("notificationsPage.archive") : t("notificationsPage.restore")}
                                                        aria-label={box === "inbox" ? t("notificationsPage.archive") : t("notificationsPage.restore")}
                                                    >
                                                        <i className={`bi ${box === "inbox" ? "bi-archive" : "bi-arrow-counterclockwise"}`} aria-hidden="true"></i>
                                                    </button>
                                                    <button type="button" className="np-icon-btn danger" onClick={() => remove([n.id])} title={t("notificationsPage.delete")} aria-label={t("notificationsPage.delete")}>
                                                        <i className="bi bi-trash3" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </SwipeToArchive>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {snack && (
                <div className="np-snack" role="status">
                    <span>{snack.text}</span>
                    {snack.undo && <button type="button" onClick={undo}>{t("notificationsPage.undo")}</button>}
                </div>
            )}
        </div>
    );
}
