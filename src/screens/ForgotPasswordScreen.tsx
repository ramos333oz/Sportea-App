import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { supabase } from '../services/supabase';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    // Check if the email is from the university domain
    if (!email.endsWith('@student.uitm.edu.my')) {
      setMessage({ text: 'Please use your university student email', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'sportea://reset-password', // This would be your app's deep link in a real app
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ 
          text: 'Password reset instructions sent to your email', 
          type: 'success' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'An unexpected error occurred. Please try again.', 
        type: 'error' 
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/images/logo-placeholder.png')} 
            style={styles.icon} 
          />
        </View>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your university email and we'll send you instructions to reset your password.
        </Text>

        <TextInput
          style={styles.input}
          label="University Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email" />}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />

        <Button
          mode="contained"
          style={styles.resetButton}
          labelStyle={styles.buttonLabel}
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
        >
          Send Reset Instructions
        </Button>
      </View>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage(null)}
        duration={3000}
        style={[
          styles.snackbar,
          message?.type === 'success' ? styles.successSnackbar : styles.errorSnackbar
        ]}
      >
        {message?.text}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
    marginBottom: SPACING.xl,
  },
  input: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  resetButton: {
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
  },
  buttonLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    paddingVertical: SPACING.xs,
  },
  snackbar: {
    margin: SPACING.md,
  },
  successSnackbar: {
    backgroundColor: COLORS.success,
  },
  errorSnackbar: {
    backgroundColor: COLORS.error,
  },
});

export default ForgotPasswordScreen; 