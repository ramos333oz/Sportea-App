import { Platform } from 'react-native';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

/**
 * Get the correct host URL for the current environment
 * @returns {Promise<string>} The IP address or hostname
 */
export const getDeviceIpAddress = async () => {
  try {
    // For web, return the origin
    if (Platform.OS === 'web') {
      return window.location.origin;
    }
    
    // Check if running in Expo Go
    const isInExpoGo = Constants.appOwnership === 'expo';
    
    // Special case for Android emulator
    if (Platform.OS === 'android' && isInExpoGo) {
      return '10.0.2.2'; // Standard Android emulator address for host
    }
    
    // Special case for iOS simulator
    if (Platform.OS === 'ios' && isInExpoGo) {
      return 'localhost'; // Standard iOS simulator address
    }
    
    // For physical devices, get actual IP address
    const { isInternetReachable, isConnected } = await Network.getNetworkStateAsync();
    
    if (!isConnected || !isInternetReachable) {
      console.warn('No internet connection');
      return Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';
    }
    
    const ip = await Network.getIpAddressAsync();
    return ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    // Default fallbacks
    return Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';
  }
};

/**
 * Generate a redirect URL for authentication that works across different environments
 * @returns {string} The redirect URL
 */
export const getAuthRedirectUrl = async () => {
  // For testing in Expo Go or development
  if (__DEV__) {
    const deviceIp = await getDeviceIpAddress();
    // Handle special emulator cases
    if (Platform.OS === 'android' && deviceIp === '10.0.2.2') {
      return 'exp://10.0.2.2:8083';
    } else if (Platform.OS === 'ios' && deviceIp === 'localhost') {
      return 'exp://localhost:8083';
    } else {
      return `exp://${deviceIp}:8083`;
    }
  }
  
  // For production app
  return 'sportea://';
}; 