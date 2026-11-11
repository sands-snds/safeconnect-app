import { useSyncedReadItems, markSyncedRead, unmarkSynced } from '../shared/useSyncedState';

// A resident's own archive of their reports (My Reports → Archived). Only
// tidies their list: the report itself, its status and what the barangay
// sees are unchanged. Saved with the account's synced settings (like archived
// notifications), so it follows the resident to their other devices.
//
// A report goes to Archived on its own 7 days after it was resolved or
// dismissed (open reports never do). The resident can still archive one by
// hand from its menu, and restoring an automatically archived report keeps it
// in the list for good ("report-kept:" marker).

const KIND = { Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };

export const AUTO_ARCHIVE_DAYS = 7;
const AUTO_ARCHIVE_MS = AUTO_ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
const CLOSED = ['Resolved', 'Dismissed'];

// type: 'Emergency' | 'Assistance' | 'Petty Crime' (as My Reports lists them)
export const reportArchiveKey = (type, id) => `report-archived:${KIND[type] || 'report'}-${id}`;
export const reportKeptKey = (type, id) => `report-kept:${KIND[type] || 'report'}-${id}`;

export const archiveReport = (type, id) => markSyncedRead([reportArchiveKey(type, id)]);
export const restoreReport = (type, id) => {
  unmarkSynced([reportArchiveKey(type, id)]);
  markSyncedRead([reportKeptKey(type, id)]);
};

// When the report was resolved or dismissed (ms), or null while it is open.
// Reports closed before resolved_at was recorded count from when they were
// filed, like the barangay's own auto-archive.
const closedAt = (report) => {
  if (!CLOSED.includes(report.status)) return null;
  const when = report.closedAt ?? report.resolved_at ?? report.date ?? report.at;
  if (when == null || when === '') return null; // no date known: leave it in the list
  const ms = typeof when === 'number' ? when : new Date(when).getTime();
  return Number.isFinite(ms) ? ms : null;
};

// Whether a report has been closed for at least AUTO_ARCHIVE_DAYS.
export const isAutoArchived = (report, now = Date.now()) => {
  const at = closedAt(report);
  return at != null && now - at >= AUTO_ARCHIVE_MS;
};

// isArchived(report), kept up to date (also when another device changes it).
// report: a My Reports item ({ type, id, status, resolved_at, date }) or a map
// item ({ reportType, id, status, closedAt, at }).
export function useReportArchive() {
  const items = useSyncedReadItems();
  return (report) => {
    if (!report) return false;
    const type = report.reportType || report.type;
    if (items.has(reportArchiveKey(type, report.id))) return true;
    return isAutoArchived(report) && !items.has(reportKeptKey(type, report.id));
  };
}
