import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
  return null;
};

// Component that throws an error conditionally
const ConditionalErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Conditional test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('renders error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
    expect(logger.error).toHaveBeenCalledWith(
      'React error boundary caught error',
      expect.any(Object)
    );
  });

  it('resets error state when retry button is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ConditionalErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Update the prop to not throw
    fireEvent.press(getByText('Try again'));

    // Error message should be gone
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('renders custom fallback UI when provided', () => {
    const customFallback = <Text>Custom error message</Text>;
    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('logs error details to logger', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledWith(
      'React error boundary caught error',
      expect.any(Object)
    );
  });

  it('maintains error state until retry', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Component should stay in error state
    jest.runAllTimers();
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('handles nested error boundaries correctly', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <Text>Outer content</Text>
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Outer content should still be visible
    expect(getByText('Outer content')).toBeTruthy();
    // Inner error boundary should show error
    expect(getByText('Something went wrong')).toBeTruthy();
    // Only inner error boundary should log error
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
}); 