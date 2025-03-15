import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { getCurrentLocation, getInitialRegion } from '../utils/mapUtils';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MarkerData extends Coordinate {
  id: string;
  title?: string;
  description?: string;
}

interface SporteaMapProps {
  style?: any;
  initialRegion?: Region;
  markers?: MarkerData[];
  showUserLocation?: boolean;
  onRegionChange?: (region: Region) => void;
  onMarkerPress?: (marker: MarkerData) => void;
  onMapPress?: (coordinate: Coordinate) => void;
  interactive?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
}

const SporteaMap: React.FC<SporteaMapProps> = ({
  style,
  initialRegion,
  markers = [],
  showUserLocation = true,
  onRegionChange,
  onMarkerPress,
  onMapPress,
  interactive = true,
  zoomEnabled = true,
  scrollEnabled = true,
  pitchEnabled = true,
  rotateEnabled = true,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region | undefined>(initialRegion);
  const [loading, setLoading] = useState<boolean>(!initialRegion);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialRegion) {
      fetchUserLocation();
    }
  }, [initialRegion]);

  const fetchUserLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { latitude, longitude, error } = await getCurrentLocation();
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      
      const newRegion = getInitialRegion(latitude, longitude);
      setRegion(newRegion);
      setLoading(false);
    } catch (err) {
      setError('Failed to get user location');
      setLoading(false);
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  };

  const handleMapPress = (event: any) => {
    if (onMapPress && interactive) {
      onMapPress(event.nativeEvent.coordinate);
    }
  };

  const handleMarkerPress = (marker: MarkerData) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={showUserLocation}
          onPress={handleMapPress}
          zoomEnabled={zoomEnabled && interactive}
          scrollEnabled={scrollEnabled && interactive}
          pitchEnabled={pitchEnabled && interactive}
          rotateEnabled={rotateEnabled && interactive}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.title}
              description={marker.description}
              onPress={() => handleMarkerPress(marker)}
            />
          ))}
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 10,
  },
});

export default SporteaMap; 