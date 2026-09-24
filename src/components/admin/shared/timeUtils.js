// "just now" / "5m ago" / "3h ago" / "2d ago" for an ISO string or Date.
export const timeAgo = (value) => {
    if (!value) return "";
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "";
