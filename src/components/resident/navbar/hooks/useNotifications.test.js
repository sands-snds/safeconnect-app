import { renderHook, act, waitFor } from '@testing-library/react';
import useNotifications from './useNotifications';
import { refreshSyncedState, __resetSyncedState } from '../../../shared/useSyncedState';
import {
  fetchMyNotifications, markAllMyNotificationsRead, markMyNotificationRead, fetchMyState, markItemsRead,
  archiveMyNotifications, deleteMyNotifications, unmarkItems
} from '../../../../Services/api';

jest.mock('../../../../Services/api', () => ({
  fetchMyNotifications: jest.fn(),
  markAllMyNotificationsRead: jest.fn(),
  markMyNotificationRead: jest.fn(),
  fetchMyState: jest.fn(),
  markItemsRead: jest.fn(),
  archiveMyNotifications: jest.fn(),
  deleteMyNotifications: jest.fn(),
  unmarkItems: jest.fn()
}));

const ANNOUNCEMENTS = [
  { id: 11, title: 'Flood drill', message: 'Saturday', date: '2026-10-20', category: 'general' },
  { id: 12, title: 'Clean-up', message: 'Sunday', date: '2026-10-21', category: 'general' }
];
const PERSONAL = [{ id: 5, title: 'Report updated', message: 'In progress', type: 'status', isRead: false, createdAt: '2026-10-22' }];

beforeEach(() => {
  __resetSyncedState();
  localStorage.clear();
  fetchMyNotifications.mockResolvedValue(PERSONAL);
  markAllMyNotificationsRead.mockResolvedValue(true);
  markMyNotificationRead.mockResolvedValue(true);
  markItemsRead.mockResolvedValue(true);
  archiveMyNotifications.mockResolvedValue(true);
  deleteMyNotifications.mockResolvedValue(true);
  unmarkItems.mockResolvedValue(true);
  fetchMyState.mockResolvedValue({ success: true, readItems: [], preferences: { language: null } });
});

const setup = (showRainNotice = false) =>
  renderHook(({ rain }) => useNotifications(ANNOUNCEMENTS, rain, 7), { initialProps: { rain: showRainNotice } });

test('"Mark all read" brings the count to zero and saves it for the account', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  act(() => result.current.markAllAsRead());
  expect(result.current.unreadCount).toBe(0);
  expect(result.current.totalBadgeCount).toBe(0);
  expect(markItemsRead).toHaveBeenCalledWith(['announcement:11', 'announcement:12']);
  expect(markAllMyNotificationsRead).toHaveBeenCalled();
});

test('marking one as read lowers the count by one', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  act(() => result.current.markOneAsRead(12));
  expect(result.current.unreadCount).toBe(2);
  act(() => result.current.markOneAsRead('personal-5'));
  expect(result.current.unreadCount).toBe(1);
  expect(markMyNotificationRead).toHaveBeenCalledWith('5');
});

test('a refresh that started before the save does not bring a read item back', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  act(() => result.current.markAllAsRead());
  
  await act(() => result.current.reloadPersonalNotifications());
  expect(result.current.unreadCount).toBe(0);
});

test('announcements read on another device show as read here', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  fetchMyState.mockResolvedValue({ success: true, readItems: ['announcement:11', 'announcement:12'], preferences: {} });
  await act(() => refreshSyncedState());
  expect(result.current.unreadCount).toBe(1);
});

test('reads saved in this browser before syncing are moved to the account once', async () => {
  localStorage.setItem('resident_read_announcements', JSON.stringify([11]));
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(2));
  expect(markItemsRead).toHaveBeenCalledWith(['announcement:11']);
  expect(localStorage.getItem('resident_read_announcements')).toBeNull();
});

test('a save that fails is kept and sent again on the next refresh', async () => {
  markItemsRead.mockResolvedValueOnce(false);
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  act(() => result.current.markOneAsRead(11));
  await waitFor(() => expect(markItemsRead).toHaveBeenCalledTimes(1));
  await act(() => refreshSyncedState());
  expect(markItemsRead).toHaveBeenLastCalledWith(['announcement:11']);
  expect(result.current.unreadCount).toBe(2);
});

test('archiving moves notifications out of the bell, marks them read, and saves it', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  await act(() => result.current.archiveNotifications([11, 'personal-5']));
  expect(result.current.notifications.map((n) => n.id)).toEqual([12]);
  expect(result.current.archivedNotifications.map((n) => n.id).sort()).toEqual([11, 'personal-5'].sort());
  expect(result.current.unreadCount).toBe(1);
  expect(markItemsRead).toHaveBeenCalledWith(['notif-archived:11', 'announcement:11']);
  expect(archiveMyNotifications).toHaveBeenCalledWith([5], true);
});

test('restoring brings archived notifications back to the inbox', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  await act(() => result.current.archiveNotifications([11, 'personal-5']));
  await act(() => result.current.archiveNotifications([11, 'personal-5'], false));
  expect(result.current.archivedNotifications).toHaveLength(0);
  expect(result.current.notifications).toHaveLength(3);
  expect(unmarkItems).toHaveBeenCalledWith(['notif-archived:11']);
  expect(archiveMyNotifications).toHaveBeenLastCalledWith([5], false);
});

test('deleting removes notifications for good, even after a refresh', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.unreadCount).toBe(3));
  await act(() => result.current.deleteNotifications([12, 'personal-5']));
  expect(result.current.notifications.map((n) => n.id)).toEqual([11]);
  expect(deleteMyNotifications).toHaveBeenCalledWith([5]);
  expect(markItemsRead).toHaveBeenCalledWith(['notif-deleted:12', 'announcement:12']);
  
  await act(() => result.current.reloadPersonalNotifications());
  expect(result.current.notifications.map((n) => n.id)).toEqual([11]);
});
