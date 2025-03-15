import { DefaultTheme } from 'react-native-paper';
import { Theme } from '@react-navigation/native';

// App colors
export const COLORS = {
  primary: '#4CAF50', // Green
  secondary: '#FF9800', // Orange
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#212121',
  border: '#E0E0E0',
  notification: '#F44336', // Red
  success: '#2E7D32', // Dark Green
  warning: '#FFC107', // Amber
  info: '#2196F3', // Blue
  error: '#D32F2F', // Dark Red
  divider: '#BDBDBD',
  disabled: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

// Paper theme
export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.card,
    text: COLORS.text,
    disabled: COLORS.disabled,
    placeholder: COLORS.divider,
    backdrop: COLORS.backdrop,
    notification: COLORS.notification,
  },
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

// Font sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  heading: 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
}; 