import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Snackbar, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { signUp } from '../services/supabase';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    // Check if the email is from the university domain
    return email.endsWith('@student.uitm.edu.my');
  };

  const validatePassword = (password: string) => {
    // Password should be at least 8 characters long and include a number and special character
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= 8 && hasNumber && hasSpecialChar;
  };

  const handleNextStep = () => {
    // Validate first step
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setErrorMessage('Please fill in all fields');
        return;
      }

      if (!validateEmail(email)) {
        setErrorMessage('Please use your university student email');
        return;
      }

      if (!validatePassword(password)) {
        setErrorMessage('Password must be at least 8 characters and include a number and special character');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }

      // Move to next step
      setErrorMessage('');
      setStep(2);
      return;
    }

    // Validate second step
    if (step === 2) {
      if (!universityId.trim() || !faculty.trim() || !yearOfStudy.trim()) {
        setErrorMessage('Please fill in all fields');
        return;
      }

      // Move to next step (final review)
      setErrorMessage('');
      setStep(3);
      return;
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        setErrorMessage(error.message);
      } else if (!data?.user) {
        setErrorMessage('Registration failed. Please try again.');
      } else {
        // Registration successful
        // Note: Normally we would create a profile with the additional details in Supabase here
        // For now we'll just show a success message and navigate back to login
        navigation.navigate('Login');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <ProgressBar progress={step / 3} color={COLORS.primary} style={styles.progressBar} />
      <View style={styles.stepTextContainer}>
        <Text style={[styles.stepText, step >= 1 ? styles.activeStepText : null]}>Account</Text>
        <Text style={[styles.stepText, step >= 2 ? styles.activeStepText : null]}>Profile</Text>
        <Text style={[styles.stepText, step >= 3 ? styles.activeStepText : null]}>Review</Text>
      </View>
    </View>
  );

  const renderAccountForm = () => (
    <View style={styles.formSection}>
      <TextInput
        style={styles.input}
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        style={styles.input}
        label="University Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        style={styles.input}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        style={styles.input}
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />
    </View>
  );

  const renderProfileForm = () => (
    <View style={styles.formSection}>
      <TextInput
        style={styles.input}
        label="University ID"
        value={universityId}
        onChangeText={setUniversityId}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        style={styles.input}
        label="Faculty"
        value={faculty}
        onChangeText={setFaculty}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <TextInput
        style={styles.input}
        label="Year of Study"
        value={yearOfStudy}
        onChangeText={setYearOfStudy}
        keyboardType="number-pad"
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />
    </View>
  );

  const renderReviewInfo = () => (
    <View style={styles.formSection}>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Account Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{fullName}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Email:</Text>
          <Text style={styles.reviewValue}>{email}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Profile Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>University ID:</Text>
          <Text style={styles.reviewValue}>{universityId}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Faculty:</Text>
          <Text style={styles.reviewValue}>{faculty}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Year of Study:</Text>
          <Text style={styles.reviewValue}>{yearOfStudy}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create an Account</Text>
        </View>

        {renderStepIndicator()}

        <View style={styles.formContainer}>
          {step === 1 && renderAccountForm()}
          {step === 2 && renderProfileForm()}
          {step === 3 && renderReviewInfo()}

          <View style={styles.buttonContainer}>
            {step > 1 && (
              <Button
                mode="outlined"
                style={styles.backStepButton}
                onPress={handlePreviousStep}
                disabled={loading}
              >
                Previous
              </Button>
            )}

            {step < 3 ? (
              <Button
                mode="contained"
                style={[styles.nextButton, step > 1 && styles.buttonWithMargin]}
                onPress={handleNextStep}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                style={[styles.registerButton, step > 1 && styles.buttonWithMargin]}
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
              >
                Register
              </Button>
            )}
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
        duration={3000}
        style={styles.snackbar}
      >
        {errorMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
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
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepIndicator: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  stepTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  stepText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  activeStepText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: SPACING.lg,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  input: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  backStepButton: {
    flex: 1,
    borderColor: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  registerButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  buttonWithMargin: {
    marginLeft: SPACING.md,
  },
  reviewSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    color: COLORS.primary,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  reviewLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    width: '35%',
    color: COLORS.text,
  },
  reviewValue: {
    fontSize: FONT_SIZES.md,
    flex: 1,
    color: COLORS.text,
  },
  snackbar: {
    backgroundColor: COLORS.error,
  },
});

export default RegisterScreen; 