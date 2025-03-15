// This file contains polyfills and mock implementations needed for web compatibility
// It should be imported in App.js when running on web platform

// Mock Platform for web
const Platform = {
  OS: 'web',
  select: (spec) => {
    return spec.web || spec.default;
  },
  Version: 1,
};

// Mock BackHandler
const BackHandler = {
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  exitApp: () => {},
};

// Export polyfills
export { Platform, BackHandler };

// Mock other native modules as needed
export const mockNativeModules = () => {
  if (typeof window !== 'undefined') {
    // Mock RCTNetworking if needed
    if (!global.RCTNetworking) {
      global.RCTNetworking = {
        addListener: () => {},
        removeListeners: () => {},
      };
    }
  }
}; 