import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import {
    toggleAnnouncementLike,
    fetchAnnouncementComments,
    postAnnouncementComment,
    deleteAnnouncementComment
} from "../../../Services/api";

const hostnameOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
};

// Matches the category colors used in the notification bell (ResidentNavbar)
// so a post reads the same way wherever a resident sees it.
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

const getCurrentUserId = () => {
    try {
        const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        return raw.id ?? raw.user_id ?? raw.userId ?? null;
    } catch {
        return null;
    }
};

// Shown for article links with no image (or one that fails to load), so the
// card shows which site the article is from instead of an empty box.
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
    formatNewsDate
}) {
    const { t } = useLanguage();
    const theme = themeFor(announcement.category);
    const currentUserId = getCurrentUserId();

    const photo =
        announcement.imageUrl ||
        announcement.sourceImage;

    // External article images are sometimes blocked by the other site;
    // fall back to the placeholder instead of a broken image.
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

    const [shareFeedback, setShareFeedback] = useState(false);

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

    const handleDeleteComment = async (commentId) => {
        const prevComments = comments;
        setComments((list) => (list || []).filter((c) => c.id !== commentId));
        setCommentCount((c) => Math.max(0, c - 1));
        const result = await deleteAnnouncementComment(commentId);
        if (!result?.success) {
            setComments(prevComments);
            setCommentCount((c) => c + 1);
        }
    };

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
                // User cancelled the native share sheet -- nothing to do.
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
            className="news-card"
            style={{ '--news-accent': theme.color }}
        >
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
                // Plain text announcements get no media block at all; only
                // article links keep the placeholder (it links to the site).
                <MediaPlaceholder announcement={announcement} />
            ) : null}

            <div className="news-card-content">
                <div className="news-card-top-row">
                    <span className="news-card-category" style={{ background: `${theme.color}18`, color: theme.color }}>
                        <i className={`bi ${theme.icon}`} />
                        {announcement.category}
                    </span>
                    <span className="news-card-date">
                        <i className="bi bi-clock" /> {formatNewsDate(announcement.date)}
                    </span>
                </div>

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
                            <p className="news-comments-empty">{t('news.loadingComments')}</p>
                        )}

                        {!commentsLoading && comments && comments.length === 0 && (
                            <p className="news-comments-empty">{t('news.noComments')}</p>
                        )}

                        {!commentsLoading && comments && comments.map((c) => (
                            <div className="news-comment" key={c.id}>
                                <div className="news-comment-avatar">{initialsOf(c.author)}</div>
                                <div className="news-comment-body">
                                    <div className="news-comment-head">
                                        <span className="news-comment-author">{c.author}</span>
                                        <span className="news-comment-time">{formatCommentTime(c.date)}</span>
                                    </div>
                                    <p className="news-comment-text">{c.text}</p>
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
                        ))}

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
