import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const SporteaMap = ({ style, markers, interactive }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Map functionality coming soon!</Text>
      {markers && markers.length > 0 && (
        <Text style={styles.markersText}>
          {markers.length} location{markers.length !== 1 ? 's' : ''} would be shown here
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  markersText: {
    fontSize: 14,
    color: COLORS.disabled,
  },
});

export default SporteaMap;
