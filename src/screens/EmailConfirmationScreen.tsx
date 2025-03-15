import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { COLORS } from '../constants/theme';

const EmailConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' }>({
    text: 'Verifying your email...',
    type: 'success'
  });

  useEffect(() => {
    // This function automatically runs when the screen is loaded
    // It will verify the email confirmation status
    const verifyEmailConfirmation = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setMessage({ 
            text: 'Error verifying your email. Please try again.',
            type: 'error'
          });
          return;
        }

        if (session) {
          // Check if the user's email is confirmed
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setMessage({ 
              text: 'Error retrieving user information. Please try again.',
              type: 'error'
            });
            return;
          }

          if (user?.email_confirmed_at) {
            setMessage({ 
              text: 'Your email has been confirmed successfully!',
              type: 'success'
            });
          } else {
            setMessage({ 
              text: 'Your email has not been confirmed yet. Please check your inbox and click the confirmation link.',
              type: 'error'
            });
          }
        } else {
          setMessage({ 
            text: 'Please sign in to confirm your email.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error in email confirmation:', error);
        setMessage({ 
          text: 'An unexpected error occurred. Please try again.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmailConfirmation();
  }, []);

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <View style={styles.content}>
          <Text 
            style={[
              styles.message, 
              message.type === 'success' ? styles.successText : styles.errorText
            ]}
          >
            {message.text}
          </Text>
          
          <Button 
            mode="contained" 
            onPress={navigateToLogin}
            style={styles.button}
          >
            Go to Login
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: {
    color: COLORS.success,
  },
  errorText: {
    color: COLORS.error,
  },
  button: {
    marginTop: 20,
    width: '80%',
  },
});

export default EmailConfirmationScreen;
