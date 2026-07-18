export const STATUS_COLORS = {
  Received: "#fbbf24",
  Pending: "#fbbf24",
  "In Progress": "#3b82f6",
  Resolved: "#10b981",
  Approved: "#10b981",
  Rejected: "#ef4444"
};

export const SEVERITY_COLORS = {
    Low: "#16a34a",
    Medium: "#ca8a04",
    High: "#ea580c",
    Critical: "#dc2626"
};

export const getSeverityColor = severity =>
    SEVERITY_COLORS[severity] || "#6b7280";

export const FALLBACK_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6"
];