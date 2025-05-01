import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger, AuthErrorCode } from './logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for storage keys
const STORAGE_PREFIX = 'sportea_';
const AUTH_KEY = `${STORAGE_PREFIX}auth`;
const SESSION_KEY = `${STORAGE_PREFIX}session`;
const REFRESH_TOKEN_KEY = `${STORAGE_PREFIX}refresh_token`;

// Interface for storage adapter
interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Helper to encrypt/decrypt data for web storage
const webCrypto = {
  encrypt: async (data: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a random key
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        dataBuffer
      );
      
      // Export the key
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      
      // Combine IV, key, and encrypted data
      const combined = new Uint8Array(iv.length + exportedKey.byteLength + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(exportedKey), iv.length);
      combined.set(new Uint8Array(encryptedData), iv.length + exportedKey.byteLength);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Error encrypting data', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  decrypt: async (encryptedData: string): Promise<string> => {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Extract IV, key, and encrypted data
      const iv = combined.slice(0, 12);
      const keyData = combined.slice(12, 44);
      const data = combined.slice(44);
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        data
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      logger.error('Error decrypting data', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
};

// Web storage adapter with encryption
const WebStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;
      return await webCrypto.decrypt(encryptedData);
    } catch (error) {
      logger.error('Error getting item from web storage', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string) => {
    try {
      const encryptedData = await webCrypto.encrypt(value);
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      logger.error('Error setting item in web storage', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Error removing item from web storage', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
};

// Native storage adapter using Expo SecureStore
const NativeStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('Error getting item from secure store', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('Error setting item in secure store', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('Error removing item from secure store', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
};

// Fallback storage adapter using AsyncStorage (less secure)
const FallbackStorageAdapter: StorageAdapter = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.error('Error getting item from async storage', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logger.error('Error setting item in async storage', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('Error removing item from async storage', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
};

// Get the appropriate storage adapter based on platform
export const getStorageAdapter = (): StorageAdapter => {
  if (Platform.OS === 'web') {
    return WebStorageAdapter;
  }
  
  // Try to use SecureStore first
  return NativeStorageAdapter;
};

// Main storage interface
export const secureStorage = {
  getAuthData: async () => {
    const adapter = getStorageAdapter();
    try {
      const data = await adapter.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting auth data', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setAuthData: async (data: any) => {
    const adapter = getStorageAdapter();
    try {
      await adapter.setItem(AUTH_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Error setting auth data', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  clearAuthData: async () => {
    const adapter = getStorageAdapter();
    try {
      await adapter.removeItem(AUTH_KEY);
      await adapter.removeItem(SESSION_KEY);
      await adapter.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error clearing auth data', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  getSessionData: async () => {
    const adapter = getStorageAdapter();
    try {
      const data = await adapter.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting session data', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setSessionData: async (data: any) => {
    const adapter = getStorageAdapter();
    try {
      await adapter.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Error setting session data', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
  
  getRefreshToken: async () => {
    const adapter = getStorageAdapter();
    try {
      return await adapter.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting refresh token', AuthErrorCode.UNKNOWN, error);
      return null;
    }
  },
  
  setRefreshToken: async (token: string) => {
    const adapter = getStorageAdapter();
    try {
      await adapter.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error setting refresh token', AuthErrorCode.UNKNOWN, error);
      throw error;
    }
  },
}; 