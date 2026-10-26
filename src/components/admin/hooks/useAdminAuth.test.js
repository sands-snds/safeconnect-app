import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useAdminAuth from './useAdminAuth';
import { fetchCurrentUser, getAuthToken, clearAuthToken } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({
  fetchCurrentUser: jest.fn(),
  getAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
  logoutUser: jest.fn(),
  logoutAdmin: jest.fn(),
  fetchUserProfile: jest.fn(() => Promise.resolve(null)),
  resolveAssetUrl: (p) => p,
  SESSION_EXPIRED_EVENT: 'safeconnect:session-expired'
}));

const wrapper = ({ children }) => <MemoryRouter initialEntries={['/admin']}>{children}</MemoryRouter>;

beforeEach(() => sessionStorage.clear());

test('a resident account does not open the admin panel, even with the browser flag set', async () => {
  sessionStorage.setItem('adminAuthenticated', 'true'); // anyone can set this
  getAuthToken.mockReturnValue('resident.token');
  fetchCurrentUser.mockResolvedValue({ success: true, isAdmin: false, user: { id: 7, role: 'resident' } });
  const { result } = renderHook(() => useAdminAuth(), { wrapper });
  expect(result.current.isAuthenticated).toBe(false); // not before the server answers either
  await waitFor(() => expect(result.current.authChecked).toBe(true));
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.showSigninModal).toBe(true);
  expect(sessionStorage.getItem('adminAuthenticated')).toBeNull();
  expect(clearAuthToken).toHaveBeenCalled();
});

test('no sign-in: shows the sign-in box', async () => {
  getAuthToken.mockReturnValue(null);
  const { result } = renderHook(() => useAdminAuth(), { wrapper });
  await waitFor(() => expect(result.current.authChecked).toBe(true));
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.showSigninModal).toBe(true);
  expect(fetchCurrentUser).not.toHaveBeenCalled();
});

test('a server-confirmed admin opens the panel', async () => {
  getAuthToken.mockReturnValue('admin.token');
  fetchCurrentUser.mockResolvedValue({ success: true, isAdmin: true, user: { id: 1, role: 'admin' } });
  const { result } = renderHook(() => useAdminAuth(), { wrapper });
  await waitFor(() => expect(result.current.authChecked).toBe(true));
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.showSigninModal).toBe(false);
  expect(fetchCurrentUser).toHaveBeenCalledWith({ admin: true });
});

test('a rejected admin sign-in shows the sign-in box', async () => {
  getAuthToken.mockReturnValue('expired.token');
  fetchCurrentUser.mockResolvedValue({ success: false, message: 'Invalid token.' });
  const { result } = renderHook(() => useAdminAuth(), { wrapper });
  await waitFor(() => expect(result.current.authChecked).toBe(true));
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.showSigninModal).toBe(true);
});
