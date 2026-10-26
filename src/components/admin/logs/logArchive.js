// Auto-archive periods for the System logs (days; 0 = off). Must match
// ALLOWED_DAYS in backend/services/logArchiveService.js.
export const LOG_PERIOD_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 30, label: "After 30 days" },
  { value: 90, label: "After 90 days" },
  { value: 180, label: "After 6 months" },
  { value: 365, label: "After 1 year" }
];
