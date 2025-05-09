import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Avatar, ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

const ProfilePictureUpload = ({ userId, avatarUrl, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [avatarSource, setAvatarSource] = useState(
    avatarUrl || `https://ui-avatars.com/api/?name=${userId.substring(0, 8)}&background=random&color=fff`
  );

  // Request permission to access the camera roll
  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload a profile picture!'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Pick an image from the camera roll
  const pickImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Listen for custom event to trigger image picker
  React.useEffect(() => {
    const handlePickImage = () => {
      pickImage();
    };

    // Add event listener for web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('pickProfileImage', handlePickImage);

      return () => {
        document.removeEventListener('pickProfileImage', handlePickImage);
      };
    } else {
      // For non-web platforms, we'll use a global event emitter
      // This is a simplified approach - in a real app, you might want to use a proper event emitter
      global.pickProfileImage = handlePickImage;

      return () => {
        global.pickProfileImage = null;
      };
    }
  }, []);

  // Upload the image to Supabase Storage
  const uploadImage = async (uri) => {
    try {
      setUploading(true);

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique file name
      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Update the avatar URL in the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setAvatarSource(urlData.publicUrl);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl);
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {uploading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Uploading...</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Avatar.Image
            source={{ uri: avatarSource }}
            size={120}
            style={styles.avatar}
          />
          <View style={styles.editButton}>
            <MaterialCommunityIcons name="camera" size={20} color={COLORS.background} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: COLORS.disabled,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.primary,
  },
});

export default ProfilePictureUpload;
