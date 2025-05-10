import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import your screens here
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

// Placeholder screens - replace with your actual screens
const LoadingScreen = () => (
  <View testID="loading-screen" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

const AuthStackNavigator = () => (
  <View testID="auth-stack">
    <AuthStack.Navigator>
      {/* Add your auth screens here */}
      <AuthStack.Screen
        name="Login"
        component={() => (
          <View>
            <Text>Login Screen</Text>
          </View>
        )}
      />
    </AuthStack.Navigator>
  </View>
);

const AppStackNavigator = () => (
  <View testID="app-stack">
    <AppStack.Navigator>
      {/* Add your app screens here */}
      <AppStack.Screen
        name="Home"
        component={() => (
          <View>
            <Text>Home Screen</Text>
          </View>
        )}
      />
    </AppStack.Navigator>
  </View>
);

export const NavigationWrapper: React.FC = () => {
  const { isLoading, isSignedIn, lastError } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (lastError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{lastError}</Text>
      </View>
    );
  }

  return isSignedIn ? <AppStackNavigator /> : <AuthStackNavigator />;
}; 