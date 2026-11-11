import { useSyncedReadItems, markSyncedRead, unmarkSynced } from '../shared/useSyncedState';

// A resident's own archive of their reports (My Reports → Archived). Only
// tidies their list: the report itself, its status and what the barangay
// sees are unchanged. Saved with the account's synced settings (like archived
// notifications), so it follows the resident to their other devices.

const KIND = { Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };

// type: 'Emergency' | 'Assistance' | 'Petty Crime' (as My Reports lists them)
export const reportArchiveKey = (type, id) => `report-archived:${KIND[type] || 'report'}-${id}`;

export const archiveReport = (type, id) => markSyncedRead([reportArchiveKey(type, id)]);
export const restoreReport = (type, id) => unmarkSynced([reportArchiveKey(type, id)]);

// isArchived(type, id), kept up to date (also when another device changes it).
export function useReportArchive() {
  const items = useSyncedReadItems();
  return (type, id) => items.has(reportArchiveKey(type, id));
}
