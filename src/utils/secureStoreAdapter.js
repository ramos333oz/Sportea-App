// Adapter for expo-secure-store that works on web
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web implementation using localStorage
const webSecureStore = {
  getItemAsync: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  setItemAsync: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error saving item to localStorage:', error);
      return false;
    }
  },
  deleteItemAsync: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error deleting item from localStorage:', error);
      return false;
    }
  }
};

// Choose the appropriate implementation based on platform
export default Platform.OS === 'web' ? webSecureStore : SecureStore; 