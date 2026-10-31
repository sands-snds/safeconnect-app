import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchNotifications, postAnnouncementComment } from '../../../Services/api';
import { showPopup } from '../../shared/popup';
import { timeAgo } from '../shared/timeUtils';
import { notificationType, notificationTarget } from './notificationTypes';
import { tx } from "../../../i18n/adminText";

const PAGE_SIZE = 20;
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' }
];

const tabStyle = (active) => ({
  padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
  background: active ? '#fff' : 'transparent', color: active ? '#111827' : '#6b7280',
  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
});

const chipStyle = (active) => ({
  padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  border: `1px solid ${active ? '#6B2C3E' : '#d1d5db'}`, background: active ? '#FDECEC' : '#fff', color: active ? '#6B2C3E' : '#374151'
});

const ReplyBox = ({ item, onReplied }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const reply = text.trim();
    if (!reply) return;
    setSending(true);
    try {
      const result = await postAnnouncementComment(item.referenceId, reply, item.commentId);
      if (!result?.success) {
        showPopup({ type: 'error', title: "Couldn't Send Reply", message: result?.message || 'Please try again.' });
        return;
      }
      setText('');
      setSent(true);
      onReplied && onReplied();
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      {sent && (
        <div style={{ fontSize: 12.5, color: '#166534', marginBottom: 6 }}>
          <i className="bi bi-check-circle-fill" /> {tx("Reply posted. The resident is notified and it shows under their comment.")}
        </div>
      )}
      <textarea
        className="form-input"
        rows={2}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={tx("Reply as the barangay...")}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: 13 }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" className="button button-primary" disabled={sending || !text.trim()} onClick={send} style={{ fontSize: 13 }}>
          <i className="bi bi-reply-fill" style={{ marginRight: 6 }} />
          {sending ? tx('Sending…') : tx('Reply')}
        </button>
      </div>
    </div>
  );
};

export default function NotificationsPage({
  notifications,         // inbox (not archived), from useAdminData
  onMarkOneRead,
  onMarkManyRead,
  onMarkAllRead,
  onArchive,             // (ids, archived) -> Promise<boolean>
  onNavigate,
  focus
}) {
  const [box, setBox] = useState('inbox');        // inbox | archived
  const [filter, setFilter] = useState('all');
  const [archived, setArchived] = useState(null); // null = not loaded
  const [selected, setSelected] = useState(() => new Set());
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const focusRef = useRef(null);

  const loadArchived = () =>
    fetchNotifications({ archived: true }).then((r) => setArchived(r.notifications)).catch(() => setArchived([]));

  useEffect(() => {
    if (box === 'archived' && archived === null) loadArchived();
  }, [box, archived]);

  useEffect(() => {
    if (!focus?.id) return;
    setBox('inbox');
    setFilter('all');
    setOpenId(focus.id);
  }, [focus]);

  const list = useMemo(() => {
    const source = box === 'inbox' ? notifications : (archived || []);
    return source.filter((n) => filter === 'all' || (filter === 'unread' ? !n.isRead : n.isRead));
  }, [box, notifications, archived, filter]);

  // The page holding the focused notification.
  useEffect(() => {
    if (!focus?.id) return;
    const index = list.findIndex((n) => n.id === focus.id);
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, list.length]);

  useEffect(() => {
    if (focus?.id && openId === focus.id) focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focus, openId, page]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
  }, [box, filter]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const allVisibleSelected = visible.length > 0 && visible.every((n) => selected.has(n.id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    visible.forEach((n) => (allVisibleSelected ? next.delete(n.id) : next.add(n.id)));
    return next;
  });
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const ids = [...selected];

  const archiveSelected = async () => {
    setBusy(true);
    try {
      const restoring = box === 'archived';
      const ok = await onArchive(ids, !restoring);
      if (!ok) {
        showPopup({ type: 'error', title: `Couldn't ${restoring ? 'Restore' : 'Archive'} Notifications`, message: 'Please try again.' });
        return;
      }
      setSelected(new Set());
      loadArchived();
    } finally {
      setBusy(false);
    }
  };

  const markSelectedRead = async () => {
    setBusy(true);
    try {
      await onMarkManyRead(ids);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  };

  const open = (n) => {
    setOpenId((id) => (id === n.id ? null : n.id));
    if (!n.isRead && box === 'inbox') onMarkOneRead(n.id);
  };

  const goTo = (n) => {
    const target = notificationTarget(n);
    if (target && target.view !== 'notifications') onNavigate(target.view, target.focusId ? { focusId: target.focusId } : {});
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: '#f3f4f6', borderRadius: 8 }}>
          <button type="button" style={tabStyle(box === 'inbox')} onClick={() => setBox('inbox')}>
            {tx('Inbox')} ({notifications.length})
          </button>
          <button type="button" style={tabStyle(box === 'archived')} onClick={() => setBox('archived')}>
            {tx('Archived')}{archived ? ` (${archived.length})` : ''}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" style={chipStyle(filter === f.key)} onClick={() => setFilter(f.key)}>
              {tx(f.label)}{f.key === 'unread' && box === 'inbox' && unreadCount ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', margin: 0 }}>
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} disabled={!visible.length} aria-label="Select all on this page" />
            {selected.size ? tx('{{n}} selected', { n: selected.size }) : tx('Select all')}
          </label>
          <button type="button" className="button button-soft" style={{ fontSize: 12.5, padding: '5px 12px' }} disabled={!selected.size || busy} onClick={archiveSelected}>
            <i className={`bi ${box === 'archived' ? 'bi-box-arrow-up' : 'bi-archive'}`} style={{ marginRight: 6 }} />
            {box === 'archived' ? 'Restore' : 'Archive'}
          </button>
          {box === 'inbox' && (
            <button type="button" className="button button-secondary" style={{ fontSize: 12.5, padding: '5px 12px' }} disabled={!selected.size || busy} onClick={markSelectedRead}>
              <i className="bi bi-envelope-open" style={{ marginRight: 6 }} /> {tx("Mark as read")}
            </button>
          )}
          {box === 'inbox' && unreadCount > 0 && (
            <button type="button" onClick={onMarkAllRead} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#6B2C3E', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              <i className="bi bi-check2-all" /> {tx("Mark all as read")}
            </button>
          )}
        </div>

        {box === 'archived' && archived === null ? (
          <p style={{ padding: 20, margin: 0, color: '#6b7280', fontSize: 13 }}>{tx("Loading archived notifications…")}</p>
        ) : visible.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#6b7280' }}>
            <i className={`bi ${box === 'archived' ? 'bi-archive' : 'bi-bell-slash'}`} style={{ fontSize: 28 }} />
            <p style={{ margin: '8px 0 0', fontSize: 13.5 }}>
              {box === 'archived' ? tx('No archived notifications.') : filter === 'unread' ? tx("You're all caught up.") : tx('No notifications.')}
            </p>
          </div>
        ) : (
          visible.map((n) => {
            const { icon, color } = notificationType(n.type);
            const target = notificationTarget(n);
            const isOpen = openId === n.id;
            const isComment = n.type === 'announcement_comment' && n.commentId;
            return (
              <div
                key={n.id}
                ref={focus?.id === n.id ? focusRef : undefined}
                style={{ borderBottom: '1px solid #f3f4f6', background: isOpen ? '#fdf8f9' : n.isRead ? '#fff' : '#fdf4f5' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(n.id)}
                    onChange={() => toggleOne(n.id)}
                    aria-label={`Select "${n.title}"`}
                    style={{ marginTop: 10 }}
                  />
                  <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...(n.isRead ? { background: `${color}18`, color } : { background: color, color: '#fff' }) }}>
                    <i className={`bi ${icon}`} />
                  </span>
                  <button type="button" onClick={() => open(n)} style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: n.isRead ? 500 : 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isOpen ? 'normal' : 'nowrap' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#9ca3af', whiteSpace: 'nowrap' }} title={new Date(n.createdAt).toLocaleString()}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isOpen ? 'pre-wrap' : 'nowrap' }}>
                      {n.message}
                    </div>
                  </button>
                  {!n.isRead && <span style={{ marginTop: 8, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />}
                </div>

                {isOpen && (
                  <div style={{ padding: '0 14px 14px 92px' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(n.createdAt).toLocaleString()}</div>
                    {target && target.view !== 'notifications' && (
                      <button type="button" className="button button-primary" style={{ marginTop: 10, fontSize: 13 }} onClick={() => goTo(n)}>
                        {tx(notificationType(n.type).label || 'Open')} <i className="bi bi-arrow-right" />
                      </button>
                    )}
                    {isComment && box === 'inbox' && <ReplyBox item={n} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 13 }}>
          <button type="button" className="button button-secondary" disabled={current === 1} onClick={() => setPage(current - 1)}>{tx("Previous")}</button>
          <span>{tx('Page {{page}} of {{total}}', { page: current, total: totalPages })}</span>
          <button type="button" className="button button-secondary" disabled={current === totalPages} onClick={() => setPage(current + 1)}>{tx("Next")}</button>
        </div>
      )}
    </div>
  );
}
