import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { logger, AuthErrorCode } from '../../utils/logger';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  AuthErrorCode: {
    INVALID_CREDENTIALS: 'AUTH001',
    NETWORK_ERROR: 'AUTH002',
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
    (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  it('provides initial auth state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: true,
        isSignedIn: false,
        user: null,
        lastError: null,
      })
    );
  });

  it('handles successful sign in', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.lastError).toBeNull();
  });

  it('handles sign in error', async () => {
    const mockError = { message: 'Invalid credentials' };
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: mockError,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrong-password');
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrong-password',
    });
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.lastError).toBe(mockError.message);
  });

  it('handles successful sign up', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password', 'testuser', 'Test User');
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          username: 'testuser',
          full_name: 'Test User',
        },
      },
    });
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.lastError).toBeNull();
  });

  it('handles successful sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('handles password reset request', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com'
    );
    expect(result.current.lastError).toBeNull();
  });

  describe('Auth state changes', () => {
    it('should handle auth state changes', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
      };
      
      let authChangeCallback: (event: string, session: any) => void;
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        authChangeCallback('SIGNED_IN', mockSession);
      });
      
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
      
      await act(async () => {
        authChangeCallback('SIGNED_OUT', null);
      });
      
      expect(result.current.isSignedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
}); 