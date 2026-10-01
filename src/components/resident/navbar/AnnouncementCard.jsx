import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import {
    isLiked,
    toggleLike,
    getComments,
    addComment,
    deleteComment,
    getCurrentResidentName
} from "./newsEngagement";

const hostnameOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
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
    const photo =
        announcement.imageUrl ||
        announcement.sourceImage;

    // External article images are sometimes blocked by the other site;
    // fall back to the placeholder instead of a broken image.
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = photo && !imageFailed;

    const [liked, setLiked] = useState(() => isLiked(announcement.id));
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(() => getComments(announcement.id));
    const [commentDraft, setCommentDraft] = useState("");
    const [shareFeedback, setShareFeedback] = useState(false);

    useEffect(() => {
        setLiked(isLiked(announcement.id));
        setComments(getComments(announcement.id));
    }, [announcement.id]);

    const handleToggleLike = () => {
        setLiked(toggleLike(announcement.id));
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        const text = commentDraft.trim();
        if (!text) return;
        const next = addComment(announcement.id, text, getCurrentResidentName());
        setComments(next);
        setCommentDraft("");
    };

    const handleDeleteComment = (commentId) => {
        setComments(deleteComment(announcement.id, commentId));
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
                <span className="news-card-category">
                    {announcement.category}
                </span>

                <div className="news-card-date">
                    {formatNewsDate(
                        announcement.date
                    )}
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
                    </button>

                    <button
                        type="button"
                        className={`news-engage-btn ${showComments ? 'active' : ''}`}
                        onClick={() => setShowComments((v) => !v)}
                    >
                        <i className="bi bi-chat-left-text" />
                        {t('news.comment')}{comments.length > 0 ? ` (${comments.length})` : ''}
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
                        {comments.length === 0 && (
                            <p className="news-comments-empty">{t('news.noComments')}</p>
                        )}

                        {comments.map((c) => (
                            <div className="news-comment" key={c.id}>
                                <div className="news-comment-avatar">{initialsOf(c.author)}</div>
                                <div className="news-comment-body">
                                    <div className="news-comment-head">
                                        <span className="news-comment-author">{c.author}</span>
                                        <span className="news-comment-time">{formatCommentTime(c.date)}</span>
                                    </div>
                                    <p className="news-comment-text">{c.text}</p>
                                </div>
                                {c.mine && (
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
                                maxLength={500}
                            />
                            <button type="submit" disabled={!commentDraft.trim()}>
                                <i className="bi bi-send-fill" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
