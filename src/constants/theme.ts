import { DefaultTheme } from 'react-native-paper';
import { Theme } from '@react-navigation/native';

// Define our color palette
export const COLORS = {
  primary: '#2E7D32', // Dark green
  secondary: '#388E3C', // Medium green
  tertiary: '#4CAF50', // Light green
  background: '#FFFFFF',
  card: '#F9F9F9',
  text: '#212121',
  border: '#E0E0E0',
  notification: '#FF4081',
  disabled: '#9E9E9E',
  placeholder: '#BDBDBD',
  surface: '#FFFFFF',
  error: '#B00020',
  success: '#43A047',
  warning: '#FFA000',
  info: '#2196F3',
};

// Define spacing for consistent layout
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Define font sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Define border radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 50,
};

// Create and export the React Native Paper theme
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    error: COLORS.error,
    disabled: COLORS.disabled,
    placeholder: COLORS.placeholder,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: COLORS.notification,
  },
  fonts: {
    ...DefaultTheme.fonts,
  },
  roundness: BORDER_RADIUS.md,
};

// Navigation theme
export const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.notification,
  },
}; 