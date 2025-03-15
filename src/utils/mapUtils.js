import * as Location from 'expo-location';

// Request location permissions from the user
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

// Get the current location of the device
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      error: null,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return {
      latitude: 37.7749, // Default to San Francisco
      longitude: -122.4194,
      error: error.message,
    };
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Get a formatted address from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (response.length > 0) {
      const address = response[0];
      const formattedAddress = `${address.street ? address.street + ', ' : ''}${address.city ? address.city + ', ' : ''}${address.region ? address.region + ', ' : ''}${address.country || ''}`;
      
      return {
        formattedAddress,
        address: response[0],
        error: null,
      };
    }
    
    return {
      formattedAddress: '',
      address: null,
      error: 'No address found',
    };
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return {
      formattedAddress: '',
      address: null,
      error: error.message,
    };
  }
};

// Get coordinates from an address string
export const getCoordinatesFromAddress = async (addressString) => {
  try {
    const locations = await Location.geocodeAsync(addressString);
    
    if (locations.length > 0) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        error: null,
      };
    }
    
    return {
      latitude: null,
      longitude: null,
      error: 'No coordinates found for this address',
    };
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    return {
      latitude: null,
      longitude: null,
      error: error.message,
    };
  }
};

// Calculate initial region for map view
export const getInitialRegion = (latitude, longitude, deltaFactor = 0.02) => {
  return {
    latitude,
    longitude,
    latitudeDelta: deltaFactor,
    longitudeDelta: deltaFactor,
  };
};

// Format coordinate number to 6 decimal places
export const formatCoordinate = (coordinate) => {
  return parseFloat(coordinate.toFixed(6));
}; 