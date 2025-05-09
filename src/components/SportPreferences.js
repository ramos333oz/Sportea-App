import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Button, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

// List of available sports
const AVAILABLE_SPORTS = [
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'football', name: 'Football', icon: 'football' },
  { id: 'soccer', name: 'Soccer', icon: 'soccer' },
  { id: 'tennis', name: 'Tennis', icon: 'tennis' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
  { id: 'baseball', name: 'Baseball', icon: 'baseball' },
  { id: 'cricket', name: 'Cricket', icon: 'cricket' },
  { id: 'golf', name: 'Golf', icon: 'golf' },
  { id: 'swimming', name: 'Swimming', icon: 'swim' },
  { id: 'running', name: 'Running', icon: 'run' },
  { id: 'cycling', name: 'Cycling', icon: 'bike' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton' },
];

const SportPreferences = ({ userId, initialPreferences = [], onUpdate }) => {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSports, setSelectedSports] = useState([]);

  useEffect(() => {
    // Initialize selected sports from preferences
    if (initialPreferences && Array.isArray(initialPreferences) && initialPreferences.length > 0) {
      setSelectedSports(initialPreferences.map(sport => sport.id));
    } else {
      setSelectedSports([]);
    }
  }, [initialPreferences]);

  const handleSportToggle = (sportId) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Format the selected sports
      const sportPreferences = AVAILABLE_SPORTS
        .filter(sport => selectedSports.includes(sport.id))
        .map(sport => ({
          id: sport.id,
          name: sport.name,
          icon: sport.icon
        }));

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ sports_preferences: sportPreferences })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPreferences(sportPreferences);

      // Close dialog
      setShowDialog(false);

      // Notify parent component
      if (onUpdate) {
        onUpdate(sportPreferences);
      }
    } catch (err) {
      console.error('Error updating sport preferences:', err);
      setError('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSportChips = () => {
    return preferences.map(sport => (
      <Chip
        key={sport.id}
        style={styles.sportChip}
        icon={() => (
          <MaterialCommunityIcons
            name={sport.icon}
            size={16}
            color={COLORS.primary}
          />
        )}
      >
        {sport.name}
      </Chip>
    ));
  };

  const renderSportSelectionDialog = () => (
    <Portal>
      <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={styles.dialog}>
        <Dialog.Title>Select Your Sports</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.sportsList}>
            {AVAILABLE_SPORTS.map(sport => (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.sportItem,
                  selectedSports.includes(sport.id) && styles.selectedSportItem
                ]}
                onPress={() => handleSportToggle(sport.id)}
              >
                <MaterialCommunityIcons
                  name={sport.icon}
                  size={24}
                  color={selectedSports.includes(sport.id) ? COLORS.primary : COLORS.disabled}
                />
                <Text
                  style={[
                    styles.sportItemText,
                    selectedSports.includes(sport.id) && styles.selectedSportItemText
                  ]}
                >
                  {sport.name}
                </Text>
                {selectedSports.includes(sport.id) && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowDialog(false)}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Sport Preferences</Text>
        <Button
          mode="text"
          compact
          onPress={() => setShowDialog(true)}
          style={styles.editButton}
        >
          Edit
        </Button>
      </View>

      {loading && !showDialog ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : preferences.length > 0 ? (
        <View style={styles.chipsContainer}>{renderSportChips()}</View>
      ) : (
        <Text style={styles.emptyText}>No sports selected yet</Text>
      )}

      {renderSportSelectionDialog()}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    elevation: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  header: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editButton: {
    marginRight: -SPACING.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sportChip: {
    margin: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.disabled,
    fontStyle: 'italic',
    marginVertical: SPACING.sm,
  },
  dialog: {
    maxHeight: '80%',
  },
  sportsList: {
    maxHeight: 300,
  },
  sportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedSportItem: {
    backgroundColor: COLORS.primary + '10',
  },
  sportItemText: {
    marginLeft: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  selectedSportItemText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },
  loader: {
    marginVertical: SPACING.md,
  },
});

export default SportPreferences;
