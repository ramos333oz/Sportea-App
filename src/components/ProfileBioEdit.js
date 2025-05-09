import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

const ProfileBioEdit = ({ userId, initialBio, onSave }) => {
  const [bio, setBio] = useState(initialBio || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const MAX_BIO_LENGTH = 150;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Update the bio in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Exit edit mode
      setEditing(false);

      // Notify parent component
      if (onSave) {
        onSave(bio);
      }
    } catch (err) {
      console.error('Error updating bio:', err);
      setError('Failed to update bio. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(initialBio || '');
    setEditing(false);
    setError('');
  };

  if (!editing) {
    return (
      <Surface style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>About Me</Text>
          <Button
            mode="text"
            compact
            onPress={() => setEditing(true)}
            style={styles.editButton}
          >
            Edit
          </Button>
        </View>
        <Text style={styles.bioText}>
          {initialBio || 'Add a bio to tell others about yourself...'}
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Edit Bio</Text>
        <Text style={styles.charCount}>
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>
      </View>

      <TextInput
        mode="outlined"
        value={bio}
        onChangeText={(text) => setBio(text.slice(0, MAX_BIO_LENGTH))}
        multiline
        numberOfLines={4}
        style={styles.input}
        placeholder="Tell others about yourself..."
        maxLength={MAX_BIO_LENGTH}
        error={!!error}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.cancelButton}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          disabled={saving}
        >
          Save
        </Button>
      </View>
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
  bioText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  input: {
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: SPACING.md,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZES.sm,
  },
});

export default ProfileBioEdit;
