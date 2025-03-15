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
    if (!email) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // Call Supabase to send a password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'sportea://auth/reset-password',
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ 
          text: 'Password reset instructions have been sent to your email', 
          type: 'success' 
        });
      }
    } catch (error) {
      console.error('Error in password reset:', error);
      setMessage({ 
        text: 'An unexpected error occurred. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
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

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <TextInput
          style={styles.input}
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email" />}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
        />

        {message && (
          <Text 
            style={[
              styles.message, 
              message.type === 'success' ? styles.successText : styles.errorText
            ]}
          >
            {message.text}
          </Text>
        )}

        <Button
          mode="contained"
          style={styles.resetButton}
          labelStyle={styles.buttonLabel}
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
        >
          Reset Password
        </Button>
      </View>

      <TouchableOpacity onPress={navigateToLogin} style={styles.linkContainer}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>

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
  message: {
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    color: COLORS.success,
  },
  errorText: {
    color: COLORS.error,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  link: {
    color: COLORS.primary,
    fontSize: 16,
  },
});

export default ForgotPasswordScreen; 