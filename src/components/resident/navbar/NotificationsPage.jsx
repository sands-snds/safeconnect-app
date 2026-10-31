import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { confirmPopup } from "../../shared/popup";
import SwipeToArchive from "./SwipeToArchive";

const SNACK_MS = 5000;
const PAGE_SIZE = 20;

// What "View" opens for each kind of notification.
const openLabelKey = (n) => {
    if (!n.isPersonal) return "notificationsPage.openArticle";
    if (n.category === "comment_reply") return "notificationsPage.openComment";
    return "notificationsPage.openReport";
};

// Full list of the resident's notifications (the bell shows only the
// latest), laid out like the admin's Notifications page: Inbox / Archived
// and All / Unread / Read on one row, then one card with a toolbar (select
// all, archive or restore, mark read, delete, mark all read) over the list.
// Click a notification to open it in place -- the whole message, its date,
// and View / Archive / Delete; swipe one away on phones. 20 per page.
export default function NotificationsPage({
    isOpen,
    notifications,
    archivedNotifications,
    onOpen,
    onArchive,
    onDelete,
    onMarkRead,
    onMarkAllRead,
    formatRelativeTime,
    getCategoryIcon,
    getCategoryColor
}) {
    const { t, language } = useLanguage();
    const [box, setBox] = useState("inbox");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(() => new Set());
    const [openId, setOpenId] = useState(null);
    const [page, setPage] = useState(1);
    // { text, undo: { ids, archived } | null }
    const [snack, setSnack] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setSelected(new Set());
            setSnack(null);
            setOpenId(null);
        }
    }, [isOpen]);

    // A different tab or filter starts with nothing selected, on page 1.
    useEffect(() => {
        setSelected(new Set());
        setOpenId(null);
        setPage(1);
    }, [box, filter]);

    useEffect(() => {
        if (!snack) return undefined;
        const timer = setTimeout(() => setSnack(null), SNACK_MS);
        return () => clearTimeout(timer);
    }, [snack]);

    const source = box === "inbox" ? notifications : archivedNotifications;
    const list = useMemo(() => source.filter((n) =>
        filter === "all" || (filter === "unread" ? n.unread : !n.unread)
    ), [source, filter]);

    // Drop selections that are no longer listed (archived elsewhere, etc).
    useEffect(() => {
        setSelected((prev) => {
            const ids = new Set(list.map((n) => n.id));
            const next = new Set([...prev].filter((id) => ids.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [list]);

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const selectedIds = list.filter((n) => selected.has(n.id)).map((n) => n.id);
    const allVisibleSelected = visible.length > 0 && visible.every((n) => selected.has(n.id));
    const anyUnreadSelected = list.some((n) => selected.has(n.id) && n.unread);
    const unreadInbox = notifications.filter((n) => n.unread).length;

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    // Select all: the notifications on this page.
    const toggleAll = () => setSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((n) => (allVisibleSelected ? next.delete(n.id) : next.add(n.id)));
        return next;
    });

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

    const markSelectedRead = () => {
        const ids = list.filter((n) => selected.has(n.id) && n.unread).map((n) => n.id);
        if (ids.length) onMarkRead(ids);
        setSelected(new Set());
    };

    // Opening one shows all of it (and counts as read).
    const toggleOpen = (n) => {
        setOpenId((id) => (id === n.id ? null : n.id));
        if (n.unread && box === "inbox") onMarkRead([n.id]);
    };

    const goToPage = (p) => {
        setPage(p);
        setOpenId(null);
        document.querySelector(".notifications-fullscreen .np-body")?.scrollTo({ top: 0, behavior: "smooth" });
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

    const archiveLabel = box === "inbox" ? t("notificationsPage.archive") : t("notificationsPage.restore");
    const archiveIcon = box === "inbox" ? "bi-archive" : "bi-arrow-counterclockwise";

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
                    {/* Tabs, filters and the toolbar stay at the top while the list scrolls. */}
                    <div className="np-sticky">
                        <div className="np-topbar">
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
                        </div>

                        {/* Toolbar: select all, then actions for the ticked notifications */}
                        <div className={`np-toolbar ${selectedIds.length ? "has-selection" : ""}`}>
                            <label className="np-check-all">
                                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} disabled={!visible.length} aria-label={t("notificationsPage.selectAll")} />
                                <span>{selectedIds.length ? t("notificationsPage.selectedCount", { count: selectedIds.length }) : t("notificationsPage.selectAll")}</span>
                            </label>
                            <div className="np-toolbar-actions">
                                <button type="button" className="np-btn" disabled={!selectedIds.length} onClick={() => archive(selectedIds, box === "inbox")}>
                                    <i className={`bi ${archiveIcon}`} aria-hidden="true"></i><span>{archiveLabel}</span>
                                </button>
                                {box === "inbox" && (
                                    <button type="button" className="np-btn" disabled={!anyUnreadSelected} onClick={markSelectedRead}>
                                        <i className="bi bi-envelope-open" aria-hidden="true"></i><span>{t("notificationsPage.markRead")}</span>
                                    </button>
                                )}
                                <button type="button" className="np-btn danger" disabled={!selectedIds.length} onClick={() => remove(selectedIds)}>
                                    <i className="bi bi-trash3" aria-hidden="true"></i><span>{t("notificationsPage.delete")}</span>
                                </button>
                            </div>
                            {box === "inbox" && unreadInbox > 0 && onMarkAllRead && (
                                <button type="button" className="np-mark-all" onClick={onMarkAllRead}>
                                    <i className="bi bi-check2-all" aria-hidden="true"></i> {t("notificationPanel.markAllRead")}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="np-card">
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
                                    const isOpenItem = openId === n.id;
                                    return (
                                        <li key={n.id} className={isOpenItem ? "open" : ""}>
                                            <SwipeToArchive
                                                onArchive={box === "inbox" ? () => archive([n.id], true) : null}
                                                label={t("notificationPanel.archive")}
                                            >
                                                <div className={`np-item ${n.unread ? "unread" : ""} ${isSelected ? "selected" : ""} ${isOpenItem ? "open" : ""}`} data-notification-id={n.id}>
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
                                                    <button type="button" className="np-item-main" onClick={() => toggleOpen(n)} aria-expanded={isOpenItem}>
                                                        <span className="np-item-title-row">
                                                            <span className="np-item-title">{n.title}</span>
                                                            {n.isPersonal && <span className="n-tag">{t("notificationPanel.yourReport")}</span>}
                                                            <span className="np-item-time" title={fullDate(n.date)}>{formatRelativeTime(n.date)}</span>
                                                        </span>
                                                        <span className="np-item-message">{n.message}</span>
                                                    </button>
                                                    {n.unread && <span className="unread-dot np-item-dot" aria-hidden="true"></span>}
                                                </div>
                                            </SwipeToArchive>

                                            {isOpenItem && (
                                                <div className="np-detail">
                                                    <p className="np-detail-date">{fullDate(n.date)}</p>
                                                    <div className="np-detail-actions">
                                                        <button type="button" className="np-btn primary" onClick={() => onOpen(n.id)}>
                                                            {t(openLabelKey(n))} <i className="bi bi-arrow-right" aria-hidden="true"></i>
                                                        </button>
                                                        <button type="button" className="np-btn" onClick={() => archive([n.id], box === "inbox")}>
                                                            <i className={`bi ${archiveIcon}`} aria-hidden="true"></i><span>{archiveLabel}</span>
                                                        </button>
                                                        <button type="button" className="np-btn danger" onClick={() => remove([n.id])}>
                                                            <i className="bi bi-trash3" aria-hidden="true"></i><span>{t("notificationsPage.delete")}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <nav className="np-pagination" aria-label={t("notificationsPage.pagination")}>
                            <button type="button" className="np-page-btn" disabled={current === 1} onClick={() => goToPage(current - 1)}>
                                <i className="bi bi-chevron-left" aria-hidden="true"></i><span>{t("notificationsPage.prevPage")}</span>
                            </button>
                            <span className="np-page-info">{t("notificationsPage.pageOf", { page: current, total: totalPages })}</span>
                            <button type="button" className="np-page-btn" disabled={current === totalPages} onClick={() => goToPage(current + 1)}>
                                <span>{t("notificationsPage.nextPage")}</span><i className="bi bi-chevron-right" aria-hidden="true"></i>
                            </button>
                        </nav>
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
