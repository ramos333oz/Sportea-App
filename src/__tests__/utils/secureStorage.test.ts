import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getStorageAdapter } from '../../utils/secureStorage';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('Native Platform (iOS/Android)', () => {
    it('uses SecureStore on native platforms', async () => {
      const mockValue = 'test-value';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockValue);

      const adapter = getStorageAdapter();
      const result = await adapter.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('handles SecureStore errors gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const adapter = getStorageAdapter();
      const result = await adapter.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });

    it('stores values securely', async () => {
      const adapter = getStorageAdapter();
      await adapter.setItem('test-key', 'test-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('removes values securely', async () => {
      const adapter = getStorageAdapter();
      await adapter.removeItem('test-key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('uses AsyncStorage on web platform', async () => {
      const mockValue = 'test-value';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockValue);

      const adapter = getStorageAdapter();
      const result = await adapter.getItem('test-key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('handles AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const adapter = getStorageAdapter();
      const result = await adapter.getItem('test-key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });

    it('stores values in AsyncStorage', async () => {
      const adapter = getStorageAdapter();
      await adapter.setItem('test-key', 'test-value');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('removes values from AsyncStorage', async () => {
      const adapter = getStorageAdapter();
      await adapter.removeItem('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });
}); 