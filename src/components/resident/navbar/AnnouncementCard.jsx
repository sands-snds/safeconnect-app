import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { flashHighlight } from "../../shared/highlight";
import CommentAvatar from "../../shared/CommentAvatar";
import {
    toggleAnnouncementLike,
    fetchAnnouncementComments,
    postAnnouncementComment,
    deleteAnnouncementComment
} from "../../../Services/api";



const FOCUS_EVENT = "safeconnect:focus-news";
export const focusNewsItem = (detail) => window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail }));

const hostnameOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
};



const CATEGORY_THEME = {
    'Emergency Alert':   { color: '#dc2626', icon: 'bi-exclamation-triangle-fill' },
    'Weather Advisory':  { color: '#3b82f6', icon: 'bi-cloud-rain-fill' },
    'Evacuation':        { color: '#f97316', icon: 'bi-signpost-split-fill' },
    'Community Event':   { color: '#8b5cf6', icon: 'bi-calendar-event-fill' },
    'Community Update':  { color: '#0ea5e9', icon: 'bi-info-circle-fill' },
    'Announcement':      { color: '#6B2C3E', icon: 'bi-megaphone-fill' },
    'General':           { color: '#6B2C3E', icon: 'bi-megaphone-fill' }
};
const themeFor = (category) => CATEGORY_THEME[category] || { color: '#6B2C3E', icon: 'bi-megaphone-fill' };



const AVATAR_COLORS = ['#6B2C3E', '#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#059669'];
const colorForName = (name) => {
    const str = name || 'R';
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getCurrentUserId = () => {
    try {
        const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        return raw.id ?? raw.user_id ?? raw.userId ?? null;
    } catch {
        return null;
    }
};



const MediaPlaceholder = ({ announcement }) => {
    const { t } = useLanguage();
    const site = announcement.sourceSite || hostnameOf(announcement.sourceUrl);

    return (
        <a
            href={announcement.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-media news-card-placeholder"
        >
            <i className="bi bi-newspaper" />
            <span className="news-card-placeholder-site">{site || t('news.externalArticle')}</span>
            {announcement.sourceTitle && (
                <span className="news-card-placeholder-title">{announcement.sourceTitle}</span>
            )}
            <span className="news-card-placeholder-cta">
                {t('news.openArticle')} <i className="bi bi-box-arrow-up-right" />
            </span>
        </a>
    );
};

const initialsOf = (name) => (name || "R").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const formatCommentTime = (iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};


export default function AnnouncementCard({
    announcement,
    formatNewsDate,
    featured = false
}) {
    const { t } = useLanguage();
    const theme = themeFor(announcement.category);
    const currentUserId = getCurrentUserId();

    const photo =
        announcement.imageUrl ||
        announcement.sourceImage;

    
    
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = photo && !imageFailed;

    const [liked, setLiked] = useState(!!announcement.likedByMe);
    const [likeCount, setLikeCount] = useState(announcement.likeCount || 0);
    const [likeBusy, setLikeBusy] = useState(false);

    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(null); // null = not loaded yet
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentCount, setCommentCount] = useState(announcement.commentCount || 0);
    const [commentDraft, setCommentDraft] = useState("");
    const [postingComment, setPostingComment] = useState(false);
    
    
    const [replyTo, setReplyTo] = useState(null); // { threadId, name }
    const [replyDraft, setReplyDraft] = useState("");
    const [postingReply, setPostingReply] = useState(false);

    const [shareFeedback, setShareFeedback] = useState(false);

    
    const [focusCommentId, setFocusCommentId] = useState(null);

    useEffect(() => {
        const onFocus = async (e) => {
            const { announcementId, commentId, openComments } = e.detail || {};
            if (String(announcementId) !== String(announcement.id)) return;
            const card = document.getElementById(`news-item-${announcement.id}`);
            if (!openComments) {
                flashHighlight(card, "start");
                return;
            }
            
            setShowComments(true);
            setCollapsedReplies({});
            setCommentsLoading(true);
            try {
                const data = await fetchAnnouncementComments(announcement.id);
                setComments(Array.isArray(data) ? data : []);
            } catch {
                setComments((prev) => prev || []);
            } finally {
                setCommentsLoading(false);
            }
            if (commentId) setFocusCommentId(commentId);
            else flashHighlight(card, "start");
        };
        window.addEventListener(FOCUS_EVENT, onFocus);
        return () => window.removeEventListener(FOCUS_EVENT, onFocus);
    }, [announcement.id]);

    useEffect(() => {
        if (!focusCommentId || commentsLoading || !comments) return;
        const el = document.getElementById(`news-comment-${focusCommentId}`)
            || document.getElementById(`news-item-${announcement.id}`);
        setFocusCommentId(null);
        // Let the opened comments lay out first.
        setTimeout(() => flashHighlight(el), 60);
    }, [focusCommentId, comments, commentsLoading, announcement.id]);

    const handleToggleLike = async () => {
        if (likeBusy) return;
        const wasLiked = liked;
        setLikeBusy(true);
        setLiked(!wasLiked);
        setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
        try {
            const result = await toggleAnnouncementLike(announcement.id);
            if (result?.success) {
                setLiked(result.liked);
                setLikeCount(result.count);
            } else {
                setLiked(wasLiked);
                setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
            }
        } catch {
            setLiked(wasLiked);
            setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
        } finally {
            setLikeBusy(false);
        }
    };

    const handleToggleComments = async () => {
        const next = !showComments;
        setShowComments(next);
        if (next && comments === null) {
            setCommentsLoading(true);
            try {
                const data = await fetchAnnouncementComments(announcement.id);
                setComments(Array.isArray(data) ? data : []);
            } catch {
                setComments([]);
            } finally {
                setCommentsLoading(false);
            }
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        const text = commentDraft.trim();
        if (!text || postingComment) return;
        setPostingComment(true);
        try {
            const result = await postAnnouncementComment(announcement.id, text);
            if (result?.success) {
                setComments((prev) => [...(prev || []), result.comment]);
                setCommentCount((c) => c + 1);
                setCommentDraft("");
            }
        } finally {
            setPostingComment(false);
        }
    };

    const startReply = (threadId, name) => {
        setReplyTo({ threadId, name });
        setReplyDraft("");
        setCollapsedReplies((prev) => ({ ...prev, [threadId]: false }));
    };

    const handlePostReply = async (e) => {
        e.preventDefault();
        const text = replyDraft.trim();
        if (!text || postingReply || !replyTo) return;
        setPostingReply(true);
        try {
            const result = await postAnnouncementComment(announcement.id, text, replyTo.threadId);
            if (result?.success) {
                setComments((prev) => [...(prev || []), result.comment]);
                setCommentCount((c) => c + 1);
                setReplyTo(null);
                setReplyDraft("");
            }
        } finally {
            setPostingReply(false);
        }
    };

    
    const handleDeleteComment = async (commentId) => {
        const prevComments = comments;
        const removed = (comments || []).filter((c) => c.id === commentId || c.parentId === commentId).length;
        setComments((list) => (list || []).filter((c) => c.id !== commentId && c.parentId !== commentId));
        setCommentCount((c) => Math.max(0, c - removed));
        const result = await deleteAnnouncementComment(commentId);
        if (!result?.success) {
            setComments(prevComments);
            setCommentCount((c) => c + removed);
        }
    };

    
    
    const threads = useMemo(() => {
        if (!comments) return [];
        const replies = {};
        comments.forEach((c) => {
            if (c.parentId) (replies[c.parentId] = replies[c.parentId] || []).push(c);
        });
        return comments
            .filter((c) => !c.parentId)
            .map((c) => ({ ...c, replies: replies[c.id] || [] }));
    }, [comments]);

    
    const [collapsedReplies, setCollapsedReplies] = useState({});

    
    
    const renderComment = (c, replyingTo, threadId = c.id) => (
        <div className={`news-comment ${replyingTo ? 'news-comment-reply' : ''}`} key={c.id} id={`news-comment-${c.id}`}>
            <CommentAvatar
                photoUrl={c.photoUrl}
                className={`news-comment-avatar ${c.isAdmin ? 'news-comment-avatar-admin' : ''}`}
                style={c.isAdmin ? undefined : { background: colorForName(c.author) }}
            >
                {c.isAdmin ? <i className="bi bi-shield-check" /> : initialsOf(c.author)}
            </CommentAvatar>
            <div className="news-comment-body">
                <div className="news-comment-head">
                    <span className="news-comment-author">{c.author}</span>
                    {c.isAdmin && <span className="news-comment-admin">{t(c.role === 'admin' ? 'news.officialBadge' : 'news.adminBadge')}</span>}
                    <span className="news-comment-time">{formatCommentTime(c.date)}</span>
                </div>
                <p className="news-comment-text">
                    {replyingTo && <span className="news-reply-mention">@{replyingTo}</span>}
                    {c.text}
                </p>
                {currentUserId != null && (
                    <button type="button" className="news-comment-reply-btn" onClick={() => startReply(threadId, c.author)}>
                        <i className="bi bi-reply" aria-hidden="true" /> {t('news.reply')}
                    </button>
                )}
            </div>
            {currentUserId != null && String(c.userId) === String(currentUserId) && (
                <button
                    type="button"
                    className="news-comment-delete"
                    onClick={() => handleDeleteComment(c.id)}
                    aria-label={t('news.deleteComment')}
                >
                    <i className="bi bi-trash3" />
                </button>
            )}
        </div>
    );

    const handleShare = async () => {
        const shareUrl = announcement.sourceUrl || window.location.href;
        const shareData = {
            title: announcement.title,
            text: announcement.message,
            url: shareUrl
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(`${announcement.title}\n\n${announcement.message}\n\n${shareUrl}`);
            setShareFeedback(true);
            setTimeout(() => setShareFeedback(false), 1800);
        } catch {
            // Clipboard API unavailable -- silently ignore.
        }
    };

    return (
        <div
            id={`news-item-${announcement.id}`}
            className={`news-card${featured ? " featured" : ""}${showImage || announcement.sourceUrl ? "" : " no-media"}`}
            style={{ '--news-accent': theme.color }}
        >
            {featured && (
                <span className="news-card-latest">
                    <i className="bi bi-stars" aria-hidden="true" /> {t('news.latestBadge')}
                </span>
            )}
            {showImage ? (
                <div className="news-card-media">
                    <img
                        src={photo}
                        alt={announcement.title}
                        className="news-card-image"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                </div>
            ) : announcement.sourceUrl ? (
                <MediaPlaceholder announcement={announcement} />
            ) : null}

            <div className="news-card-content">

                <h3>
                    {announcement.title}
                </h3>

                <p>
                    {announcement.message}
                </p>

                {announcement.sourceUrl && (
                    <a
                        href={announcement.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-card-source-link"
                    >
                        <i className="bi bi-box-arrow-up-right"></i>
                        {" "}
                        {t('news.readFullArticle')}
                        {(announcement.sourceSite || hostnameOf(announcement.sourceUrl)) &&
                            ` ${t('news.on')} ${announcement.sourceSite || hostnameOf(announcement.sourceUrl)}`}
                    </a>
                )}

                
                <div className="news-card-meta-row">
                    <span className="news-card-category" style={{ background: `${theme.color}18`, color: theme.color }}>
                        <i className={`bi ${theme.icon}`} />
                        {announcement.category}
                    </span>
                    <span className="news-card-date">
                        <i className="bi bi-clock" /> <time dateTime={announcement.date}>{formatNewsDate(announcement.date)}</time>
                    </span>
                </div>

                <div className="news-card-engagement">
                    <button
                        type="button"
                        className={`news-engage-btn ${liked ? 'liked' : ''}`}
                        onClick={handleToggleLike}
                    >
                        <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} />
                        {liked ? t('news.liked') : t('news.like')}
                        {likeCount > 0 && <span className="news-engage-count">{likeCount}</span>}
                    </button>

                    <button
                        type="button"
                        className={`news-engage-btn ${showComments ? 'active' : ''}`}
                        onClick={handleToggleComments}
                    >
                        <i className="bi bi-chat-left-text" />
                        {t('news.comment')}
                        {commentCount > 0 && <span className="news-engage-count">{commentCount}</span>}
                    </button>

                    <button
                        type="button"
                        className="news-engage-btn"
                        onClick={handleShare}
                    >
                        <i className="bi bi-share" />
                        {shareFeedback ? t('news.copied') : t('news.share')}
                    </button>
                </div>

                {showComments && (
                    <div className="news-comments">
                        {commentsLoading && (
                            <p className="news-comments-empty">
                                <i className="bi bi-arrow-repeat news-comments-spin" /> {t('news.loadingComments')}
                            </p>
                        )}

                        {!commentsLoading && comments && comments.length === 0 && (
                            <p className="news-comments-empty">
                                <i className="bi bi-chat-square-text" /> {t('news.noComments')}
                            </p>
                        )}

                        {!commentsLoading && threads.map((thread) => {
                            const showReplies = !collapsedReplies[thread.id];
                            const count = thread.replies.length;
                            return (
                                <div className="news-thread" key={thread.id}>
                                    {renderComment(thread, null)}

                                    {(count > 0 || replyTo?.threadId === thread.id) && (
                                        <div className="news-replies">
                                            {count > 0 && <button
                                                type="button"
                                                className="news-replies-toggle"
                                                onClick={() => setCollapsedReplies((prev) => ({ ...prev, [thread.id]: showReplies }))}
                                                aria-expanded={showReplies}
                                            >
                                                <i className={`bi ${showReplies ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                                                {showReplies
                                                    ? t('news.hideReplies')
                                                    : count === 1 ? t('news.viewOneReply') : t('news.viewReplies', { count })}
                                            </button>}
                                            {showReplies && thread.replies.map((r) => renderComment(r, thread.author, thread.id))}
                                            {replyTo?.threadId === thread.id && (
                                                <form className="news-comment-form news-reply-form" onSubmit={handlePostReply}>
                                                    <input
                                                        type="text"
                                                        value={replyDraft}
                                                        onChange={(e) => setReplyDraft(e.target.value)}
                                                        placeholder={t('news.replyPlaceholder', { name: replyTo.name })}
                                                        aria-label={t('news.replyPlaceholder', { name: replyTo.name })}
                                                        maxLength={1000}
                                                        disabled={postingReply}
                                                        autoFocus
                                                    />
                                                    <button type="button" className="news-reply-cancel" onClick={() => setReplyTo(null)} aria-label={t('news.cancelReply')}>
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                    <button type="submit" disabled={!replyDraft.trim() || postingReply} aria-label={t('news.sendReply')}>
                                                        <i className="bi bi-send-fill" />
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <form className="news-comment-form" onSubmit={handlePostComment}>
                            <input
                                type="text"
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                placeholder={t('news.commentPlaceholder')}
                                maxLength={1000}
                                disabled={postingComment}
                            />
                            <button type="submit" disabled={!commentDraft.trim() || postingComment}>
                                <i className="bi bi-send-fill" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
