/// <reference types="jest" />

import '@testing-library/jest-native/extend-expect';
import { NativeModules } from 'react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Supabase client
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock platform-specific modules
NativeModules.PlatformConstants = NativeModules.PlatformConstants || {
  forceTouchAvailable: false,
  interfaceIdiom: 'phone',
};

// Mock performance.now()
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// Mock console methods for testing
const originalConsole = { ...console };

// Setup global test environment
const setupTestEnv = () => {
  global.console = {
    ...console,
    // Ignore console.log in tests
    log: jest.fn(),
    // Keep error and warn for debugging
    error: jest.fn(),
    warn: jest.fn(),
    // Ignore info and debug
    info: jest.fn(),
    debug: jest.fn(),
  };
};

// Cleanup test environment
const cleanupTestEnv = () => {
  global.console = originalConsole;
  jest.clearAllMocks();
};

setupTestEnv(); 