import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

const UsernameEdit = ({ userId, initialUsername, onSave }) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate username
      if (!username.trim()) {
        setError('Username cannot be empty');
        setSaving(false);
        return;
      }

      // Check if username is already taken
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId);

      if (checkError) {
        throw checkError;
      }

      if (existingUsers && existingUsers.length > 0) {
        setError('Username is already taken');
        setSaving(false);
        return;
      }

      // Update the username in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Exit edit mode
      setEditing(false);

      // Notify parent component
      if (onSave) {
        onSave(username);
      }
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(initialUsername || '');
    setEditing(false);
    setError('');
  };

  if (!editing) {
    return (
      <Surface style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Username</Text>
          <Button
            mode="text"
            compact
            onPress={() => setEditing(true)}
            style={styles.editButton}
          >
            Edit
          </Button>
        </View>
        <Text style={styles.usernameText}>
          {initialUsername ? `@${initialUsername}` : 'Set a username...'}
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Edit Username</Text>
      </View>

      <TextInput
        mode="outlined"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="Enter a username..."
        error={!!error}
        left={<TextInput.Affix text="@" />}
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
  usernameText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
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

export default UsernameEdit;
