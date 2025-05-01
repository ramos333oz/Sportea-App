import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { User, AuthError } from '@supabase/supabase-js';
import { logger, AuthErrorCode, createAuthError, formatUserErrorMessage } from '../utils/logger';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
  lastError: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes
const attemptTracker = new Map<string, { count: number; timestamp: number }>();

// Helper to check rate limiting
const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const attempt = attemptTracker.get(email);
  
  if (!attempt) {
    attemptTracker.set(email, { count: 1, timestamp: now });
    return false;
  }
  
  if (now - attempt.timestamp > ATTEMPT_WINDOW) {
    attemptTracker.set(email, { count: 1, timestamp: now });
    return false;
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  attempt.count += 1;
  attemptTracker.set(email, attempt);
  return false;
};

// Helper to clear rate limiting
const clearRateLimit = (email: string) => {
  attemptTracker.delete(email);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isSignedIn: false,
    user: null,
    lastError: null,
  });

  logger.debug('AuthProvider mounted', { initialState: authState });

  useEffect(() => {
    logger.debug('Setting up auth state listener');
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
    logger.debug('Auth state listener setup complete', { authListener });
    
    return () => {
      logger.debug('Cleaning up auth state listener');
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const checkUser = async () => {
    logger.debug('Checking current user session');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      setAuthState({
        isLoading: false,
        isSignedIn: !!session,
        user: session?.user || null,
        lastError: null,
      });
      
      logger.info('Session check complete', { 
        isSignedIn: !!session,
        userId: session?.user?.id 
      });
    } catch (error) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN,
        'Error checking auth state',
        error
      );
      
      setAuthState({
        isLoading: false,
        isSignedIn: false,
        user: null,
        lastError: formatUserErrorMessage(authError),
      });
    }
  };

  const handleAuthChange = async (event: string, session: any) => {
    logger.debug('Auth state changed', { event, userId: session?.user?.id });
    
    setAuthState({
      isLoading: false,
      isSignedIn: !!session,
      user: session?.user || null,
      lastError: null,
    });
  };

  const signIn = async (email: string, password: string) => {
    logger.debug('Attempting sign in', { email });
    
    try {
      if (checkRateLimit(email)) {
        throw createAuthError(
          AuthErrorCode.RATE_LIMITED,
          'Too many sign in attempts'
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      clearRateLimit(email);
      logger.info('User signed in successfully', { userId: data.user?.id });
      
      return { success: true };
    } catch (error) {
      const authError = error instanceof AuthError
        ? createAuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password',
            error
          )
        : createAuthError(
            AuthErrorCode.UNKNOWN,
            'Error signing in',
            error
          );

      setAuthState(prev => ({
        ...prev,
        lastError: formatUserErrorMessage(authError),
      }));
      
      return { success: false, error: formatUserErrorMessage(authError) };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    logger.debug('Attempting sign up', { email, username });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            username,
            full_name: fullName
          },
        },
      });

      if (error) {
        throw error;
      }

      logger.info('User signed up successfully', { userId: data.user?.id });
      
      return { success: true };
    } catch (error) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN,
        'Error signing up',
        error
      );

      setAuthState(prev => ({
        ...prev,
        lastError: formatUserErrorMessage(authError),
      }));
      
      return { success: false, error: formatUserErrorMessage(authError) };
    }
  };

  const signOut = async () => {
    logger.debug('Attempting sign out');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      logger.info('User signed out successfully');
      
      return { success: true };
    } catch (error) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN,
        'Error signing out',
        error
      );

      setAuthState(prev => ({
        ...prev,
        lastError: formatUserErrorMessage(authError),
      }));
      
      return { success: false, error: formatUserErrorMessage(authError) };
    }
  };

  const resetPassword = async (email: string) => {
    logger.debug('Attempting password reset', { email });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'sportea://auth/reset-password',
      });

      if (error) {
        throw error;
      }

      logger.info('Password reset email sent', { email });
      
      return { success: true };
    } catch (error) {
      const authError = createAuthError(
        AuthErrorCode.UNKNOWN,
        'Error resetting password',
        error
      );

      setAuthState(prev => ({
        ...prev,
        lastError: formatUserErrorMessage(authError),
      }));
      
      return { success: false, error: formatUserErrorMessage(authError) };
    }
  };

  const clearError = () => {
    setAuthState(prev => ({
      ...prev,
      lastError: null,
    }));
  };

  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  logger.debug('AuthProvider rendering', { 
    isLoading: value.isLoading,
    isSignedIn: value.isSignedIn,
    hasUser: !!value.user,
    hasError: !!value.lastError,
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};