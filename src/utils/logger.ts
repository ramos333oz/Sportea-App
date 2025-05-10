import { Platform } from 'react-native';

// Error codes for different types of auth errors
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH001',
  NETWORK_ERROR = 'AUTH002',
  SESSION_EXPIRED = 'AUTH003',
  EMAIL_NOT_VERIFIED = 'AUTH004',
  RATE_LIMITED = 'AUTH005',
  DATABASE_ERROR = 'AUTH006',
  UNKNOWN = 'AUTH999',
}

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  code?: string;
  details?: any;
  platform: string;
}

// Maximum number of logs to keep in memory
const MAX_LOGS = 100;
let inMemoryLogs: LogEntry[] = [];

// Helper to get readable platform name
const getPlatform = () => {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return 'Web';
};

// Helper to format timestamp
const getTimestamp = () => new Date().toISOString();

// Helper to format auth errors
const formatAuthError = (error: Error): { code: AuthErrorCode; message: string; details: any } => {
  // Extract error details based on error message patterns
  if (error.message.includes('invalid credentials')) {
    return {
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: error.message,
      details: { originalError: error },
    };
  }
  if (error.message.includes('network')) {
    return {
      code: AuthErrorCode.NETWORK_ERROR,
      message: error.message,
      details: { originalError: error },
    };
  }
  if (error.message.includes('session expired')) {
    return {
      code: AuthErrorCode.SESSION_EXPIRED,
      message: error.message,
      details: { originalError: error },
    };
  }
  if (error.message.includes('email not verified')) {
    return {
      code: AuthErrorCode.EMAIL_NOT_VERIFIED,
      message: error.message,
      details: { originalError: error },
    };
  }
  if (error.message.includes('rate limited')) {
    return {
      code: AuthErrorCode.RATE_LIMITED,
      message: error.message,
      details: { originalError: error },
    };
  }
  return {
    code: AuthErrorCode.UNKNOWN,
    message: error.message,
    details: { originalError: error },
  };
};

// Helper to create auth errors
export const createAuthError = (code: AuthErrorCode, message: string, originalError?: any) => {
  return {
    code,
    message,
    details: { originalError },
  };
};

// Helper to format user-friendly error messages
export const formatUserErrorMessage = (code: AuthErrorCode): string => {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case AuthErrorCode.NETWORK_ERROR:
      return 'Network error. Please check your internet connection and try again.';
    case AuthErrorCode.SESSION_EXPIRED:
      return 'Your session has expired. Please sign in again.';
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
      return 'Please verify your email address before signing in.';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many attempts. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Logger implementation
export const logger = {
  debug: (message: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'debug',
      message,
      details,
      platform: getPlatform(),
    };
    inMemoryLogs.push(entry);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.shift();
    }
    console.log(`[DEBUG][${entry.timestamp}][${entry.platform}]`, message, details || '');
  },

  info: (message: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'info',
      message,
      details,
      platform: getPlatform(),
    };
    inMemoryLogs.push(entry);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.shift();
    }
    console.info(`[INFO][${entry.timestamp}][${entry.platform}]`, message, details || '');
  },

  warn: (message: string, details?: any) => {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'warn',
      message,
      details,
      platform: getPlatform(),
    };
    inMemoryLogs.push(entry);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.shift();
    }
    console.warn(`[WARN][${entry.timestamp}][${entry.platform}]`, message, details || '');
  },

  error: (message: string, code?: AuthErrorCode, details?: any) => {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'error',
      message,
      code,
      details,
      platform: getPlatform(),
    };
    inMemoryLogs.push(entry);
    if (inMemoryLogs.length > MAX_LOGS) {
      inMemoryLogs.shift();
    }
    console.error(`[ERROR][${entry.timestamp}][${entry.platform}]`, message, details || '');
  },

  getLogs: () => [...inMemoryLogs],

  clearLogs: () => {
    inMemoryLogs = [];
  },

  getLogsByLevel: (level: LogLevel) => inMemoryLogs.filter(log => log.level === level),

  formatAuthError,
  formatUserErrorMessage,
}; 