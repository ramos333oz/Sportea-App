import React from 'react';
import { render, act } from '@testing-library/react-native';
import { NavigationWrapper } from '../../components/NavigationWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation components
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('NavigationWrapper', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading screen while checking auth state', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isSignedIn: false,
      user: null,
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('loading-screen')).toBeTruthy();
  });

  it('shows auth stack when user is not signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: false,
      user: null,
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('auth-stack')).toBeTruthy();
  });

  it('shows app stack when user is signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      user: { id: '123', email: 'test@example.com' },
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('app-stack')).toBeTruthy();
  });

  it('handles auth state changes correctly', () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isSignedIn: false,
      user: null,
    });

    const { getByTestId, rerender } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('loading-screen')).toBeTruthy();

    // Update to signed out state
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: false,
      user: null,
    });

    rerender(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('auth-stack')).toBeTruthy();

    // Update to signed in state
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      user: { id: '123', email: 'test@example.com' },
    });

    rerender(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('app-stack')).toBeTruthy();
  });

  it('preserves navigation state when rerendering with same auth state', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      user: { id: '123', email: 'test@example.com' },
    });

    const { getByTestId, rerender } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    const firstStackInstance = getByTestId('app-stack');

    // Rerender with same auth state
    rerender(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    const secondStackInstance = getByTestId('app-stack');

    // Same stack instance should be preserved
    expect(firstStackInstance).toBe(secondStackInstance);
  });

  it('handles error states gracefully', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isSignedIn: false,
      user: null,
      error: 'Authentication error',
    });

    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <NavigationWrapper />
      </NavigationContainer>
    );

    expect(getByTestId('auth-stack')).toBeTruthy();
    expect(getByText('Authentication error')).toBeTruthy();
  });
}); 