import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAnnouncementComments,
  postAnnouncementComment,
  deleteAnnouncementComment
} from "../../../Services/api";
import { timeAgo } from "../shared/timeUtils";

// Comments panel under an admin announcement card: residents' comments with
// their replies, a box to comment as the barangay, a Reply box per comment,
// and Delete for moderation. Replies are one level deep (the backend attaches
// a reply-to-a-reply to the top-level comment). The resident is notified when
// an admin replies (see createComment in announcementController.js).
//
// onCountChange(delta) keeps the card's comment count in sync.
const initialsOf = (name) =>
  (name || "R").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const AnnouncementComments = ({ announcementId, onCountChange }) => {
  const [comments, setComments] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null); // top-level comment id
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAnnouncementComments(announcementId)
      .then((data) => { if (!cancelled) setComments(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) { setComments([]); setLoadError(true); } });
    return () => { cancelled = true; };
  }, [announcementId]);

  // [{ ...comment, replies: [...] }], oldest first.
  const threads = useMemo(() => {
    if (!comments) return [];
    const byParent = {};
    comments.forEach((c) => {
      if (c.parentId) (byParent[c.parentId] = byParent[c.parentId] || []).push(c);
    });
    return comments
      .filter((c) => !c.parentId)
      .map((c) => ({ ...c, replies: byParent[c.id] || [] }));
  }, [comments]);

  const post = async (text, parentId) => {
    setBusy(true);
    setError("");
    try {
      const result = await postAnnouncementComment(announcementId, text, parentId);
      if (!result?.success) throw new Error(result?.message || "Couldn't post your comment.");
      setComments((prev) => [...(prev || []), result.comment]);
      onCountChange && onCountChange(1);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (text && await post(text, null)) setDraft("");
  };

  const handleReply = async (e, parentId) => {
    e.preventDefault();
    const text = replyDraft.trim();
    if (text && await post(text, parentId)) {
      setReplyDraft("");
      setReplyTo(null);
    }
  };

  const handleDelete = async (comment) => {
    const replyCount = comments.filter((c) => c.parentId === comment.id).length;
    const what = replyCount ? `this comment and its ${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "this comment";
    if (!window.confirm(`Delete ${what}?`)) return;

    setError("");
    const result = await deleteAnnouncementComment(comment.id).catch(() => null);
    if (!result?.success) {
      setError(result?.message || "Couldn't delete the comment.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parentId !== comment.id));
    onCountChange && onCountChange(-(1 + replyCount));
  };

  // Replies are shown by default; this holds the threads the admin collapsed.
  const [collapsed, setCollapsed] = useState({});

  const openReply = (thread) => {
    setReplyTo(replyTo === thread.id ? null : thread.id);
    setReplyDraft("");
    setCollapsed((prev) => ({ ...prev, [thread.id]: false }));
  };

  const avatar = (c, small) => (
    <div className={`ac-avatar ${small ? "ac-avatar-sm" : ""} ${c.isAdmin ? "ac-avatar-admin" : ""}`}>
      {c.isAdmin ? <i className="bi bi-shield-check"></i> : initialsOf(c.author)}
    </div>
  );

  // replyingTo: the top-level comment's author, shown as an @mention on replies.
  const renderComment = (c, thread, replyingTo) => (
    <div className={`ac-comment ${replyingTo ? "ac-reply" : ""}`} key={c.id}>
      {avatar(c, !!replyingTo)}
      <div className="ac-body">
        <div className="ac-head">
          <span className="ac-author">{c.author}</span>
          {c.isAdmin && <span className="ac-admin-badge">Admin</span>}
          <span className="ac-time">{timeAgo(c.date)}</span>
        </div>
        <p className="ac-text">
          {replyingTo && <span className="ac-mention">@{replyingTo}</span>}
          {c.text}
        </p>
        <div className="ac-actions">
          <button type="button" onClick={() => openReply(thread)}>Reply</button>
          <button type="button" className="ac-delete" onClick={() => handleDelete(c)}>Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ac-panel">
      <style>{`
        .ac-panel { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f3f4f6; }
        .ac-empty { font-size: 13px; color: #9ca3af; margin: 4px 0 12px; }
        .ac-thread { margin-bottom: 16px; }
        .ac-comment { display: flex; gap: 12px; }
        .ac-avatar { width: 36px; height: 36px; border-radius: 50%; background: #f3f4f6; color: #4b5563;
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .ac-avatar-sm { width: 26px; height: 26px; font-size: 10px; }
        .ac-avatar-admin { background: #6B2C3E; color: #fff; font-size: 14px; }
        .ac-avatar-sm.ac-avatar-admin { font-size: 12px; }
        .ac-body { flex: 1; min-width: 0; }
        .ac-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .ac-author { font-size: 13px; font-weight: 700; color: #111827; }
        .ac-admin-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          background: rgba(107, 44, 62, 0.1); color: #6B2C3E; padding: 1px 8px; border-radius: 999px; }
        .ac-time { font-size: 12px; color: #9ca3af; }
        .ac-text { font-size: 14px; color: #1f2937; margin: 2px 0 4px; white-space: pre-wrap; overflow-wrap: anywhere; }
        .ac-mention { color: #6B2C3E; font-weight: 600; margin-right: 5px; }
        .ac-actions { display: flex; gap: 4px; margin-left: -8px; }
        .ac-actions button { border: none; background: none; padding: 4px 8px; border-radius: 999px;
          font-size: 12px; font-weight: 600; color: #4b5563; cursor: pointer; }
        .ac-actions button:hover { background: #f3f4f6; color: #111827; }
        .ac-actions .ac-delete:hover { color: #b91c1c; }
        /* Replies hang under the comment, lined up with its text (avatar 36px + 12px gap). */
        .ac-replies { margin-left: 48px; margin-top: 4px; }
        .ac-replies-toggle { display: inline-flex; align-items: center; gap: 6px; border: none; background: none;
          padding: 6px 12px; margin-left: -12px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #6B2C3E; cursor: pointer; }
        .ac-replies-toggle:hover { background: rgba(107, 44, 62, 0.08); }
        .ac-reply { margin-top: 10px; gap: 10px; }
        .ac-reply-form { display: flex; gap: 10px; margin-top: 8px; }
        .ac-reply-form .ac-reply-input { flex: 1; min-width: 0; }
        .ac-reply-input input { width: 100%; border: none; border-bottom: 1px solid #d1d5db; padding: 4px 0 6px; font-size: 13.5px; outline: none; background: none; }
        .ac-reply-input input:focus { border-bottom: 2px solid #6B2C3E; padding-bottom: 5px; }
        .ac-reply-buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
        .ac-reply-buttons button { border: none; border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ac-reply-cancel { background: none; color: #374151; }
        .ac-reply-cancel:hover { background: #f3f4f6; }
        .ac-reply-submit { background: #6B2C3E; color: #fff; }
        .ac-reply-submit:disabled { background: #e5e7eb; color: #9ca3af; cursor: default; }
        .ac-form { display: flex; gap: 8px; margin-top: 4px; }
        .ac-form input { flex: 1; min-width: 0; border: 1px solid #d1d5db; border-radius: 999px; padding: 8px 14px; font-size: 13px; outline: none; }
        .ac-form input:focus { border-color: #6B2C3E; }
        .ac-form button { border: none; border-radius: 999px; background: #6B2C3E; color: #fff; padding: 0 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ac-form button:disabled { opacity: 0.5; cursor: default; }
        .ac-error { font-size: 12.5px; color: #b91c1c; margin: 0 0 8px; }
      `}</style>

      {comments === null && <p className="ac-empty">Loading comments...</p>}
      {comments !== null && loadError && <p className="ac-error">Couldn't load comments.</p>}
      {comments !== null && !loadError && threads.length === 0 && (
        <p className="ac-empty">No comments from residents yet.</p>
      )}

      {threads.map((thread) => {
        const showReplies = !collapsed[thread.id];
        const count = thread.replies.length;
        return (
          <div className="ac-thread" key={thread.id}>
            {renderComment(thread, thread, null)}

            <div className="ac-replies">
              {replyTo === thread.id && (
                <form className="ac-reply-form" onSubmit={(e) => handleReply(e, thread.id)}>
                  {avatar({ isAdmin: true }, true)}
                  <div className="ac-reply-input">
                    <input
                      type="text"
                      autoFocus
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder={`Reply to ${thread.author}...`}
                      maxLength={1000}
                      disabled={busy}
                    />
                    <div className="ac-reply-buttons">
                      <button type="button" className="ac-reply-cancel" onClick={() => { setReplyTo(null); setReplyDraft(""); }}>
                        Cancel
                      </button>
                      <button type="submit" className="ac-reply-submit" disabled={!replyDraft.trim() || busy}>
                        Reply
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {count > 0 && (
                <button
                  type="button"
                  className="ac-replies-toggle"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [thread.id]: showReplies }))}
                  aria-expanded={showReplies}
                >
                  <i className={`bi ${showReplies ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  {showReplies ? "Hide replies" : `${count} ${count === 1 ? "reply" : "replies"}`}
                </button>
              )}

              {showReplies && thread.replies.map((r) => renderComment(r, thread, thread.author))}
            </div>
          </div>
        );
      })}

      {error && <p className="ac-error">{error}</p>}

      <form className="ac-form" onSubmit={handleComment}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment as the barangay..."
          maxLength={1000}
          disabled={busy}
        />
        <button type="submit" disabled={!draft.trim() || busy}>Post</button>
      </form>
    </div>
  );
};

export default AnnouncementComments;
